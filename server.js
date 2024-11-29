const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const axios = require('axios');
const crypto = require('crypto');

const app = express();
const port = process.env.PORT || 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json());

// Store templates in memory (in production, use a database)
const templates = new Map();

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Upload PDF route
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const pdfPath = req.file.path;
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    // Get field positions for highlighting in the UI
    const fieldData = await Promise.all(fields.map(async field => {
      const widget = field.acroField.getWidgets()[0];
      const rect = widget.getRectangle();
      return {
        name: field.getName(),
        type: field.constructor.name,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      };
    }));

    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      fields: fieldData,
      uploadDate: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Error processing PDF file' });
  }
});

// Get PDF fields route
app.get('/api/pdf/:filename/fields', async (req, res) => {
  try {
    const pdfPath = path.join(uploadsDir, req.params.filename);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    
    // Get field positions for highlighting in the UI
    const fieldData = await Promise.all(fields.map(async field => {
      const widget = field.acroField.getWidgets()[0];
      const rect = widget.getRectangle();
      return {
        name: field.getName(),
        type: field.constructor.name,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height
        }
      };
    }));

    res.json(fieldData);
  } catch (error) {
    console.error('Error reading PDF fields:', error);
    res.status(500).json({ error: 'Error reading PDF fields' });
  }
});

// Test Bubble connection
app.post('/api/bubble/test', async (req, res) => {
  const { apiKey, appName } = req.body;

  try {
    const response = await axios.get(`https://${appName}.bubbleapps.io/api/1.1/obj/user`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.status === 200) {
      res.json({ success: true });
    } else {
      throw new Error('Failed to connect to Bubble');
    }
  } catch (error) {
    console.error('Error testing Bubble connection:', error);
    res.status(500).json({ error: 'Failed to connect to Bubble' });
  }
});

// Get Bubble fields
app.post('/api/bubble/fields', async (req, res) => {
  const { apiKey, appName, dataType } = req.body;

  try {
    const response = await axios.get(
      `https://${appName}.bubbleapps.io/api/1.1/meta/types/${dataType}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (response.status === 200) {
      const fields = Object.entries(response.data.fields).map(([id, field]) => ({
        id,
        name: field.name,
        type: field.type
      }));
      res.json({ fields });
    } else {
      throw new Error('Failed to fetch Bubble fields');
    }
  } catch (error) {
    console.error('Error fetching Bubble fields:', error);
    res.status(500).json({ error: 'Failed to fetch Bubble fields' });
  }
});

// Generate webhook
app.post('/api/webhook/generate', async (req, res) => {
  const { pdfId, bubbleConfig, fieldMapping } = req.body;
  
  try {
    const webhookId = crypto.randomBytes(16).toString('hex');
    const template = {
      id: webhookId,
      pdfFile: pdfId,
      bubbleConfig,
      fieldMapping,
      createdAt: new Date().toISOString()
    };
    
    templates.set(webhookId, template);
    
    const webhookUrl = `${req.protocol}://${req.get('host')}/api/webhook/${webhookId}`;
    res.json({ webhookUrl });
  } catch (error) {
    console.error('Error generating webhook:', error);
    res.status(500).json({ error: 'Error generating webhook' });
  }
});

// Webhook endpoint
app.post('/api/webhook/:webhookId', async (req, res) => {
  const { webhookId } = req.params;
  const { data } = req.body;
  
  try {
    const template = templates.get(webhookId);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const pdfPath = path.join(uploadsDir, template.pdfFile);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const form = pdfDoc.getForm();

    // Map Bubble data to PDF fields
    Object.entries(template.fieldMapping).forEach(([pdfField, bubbleField]) => {
      const field = form.getField(pdfField);
      if (field && data[bubbleField]) {
        field.setText(data[bubbleField].toString());
      }
    });

    // Save the filled PDF
    const filledPdfBytes = await pdfDoc.save();
    const outputPath = path.join(uploadsDir, `filled_${Date.now()}_${path.basename(template.pdfFile)}`);
    fs.writeFileSync(outputPath, filledPdfBytes);

    res.json({
      message: 'PDF filled successfully',
      filledPdfPath: path.basename(outputPath)
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Error processing webhook' });
  }
});

// Serve uploaded files
app.use('/uploads', express.static(uploadsDir));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
