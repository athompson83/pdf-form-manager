import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import PDFPreview from './components/PDFPreview';
import BubbleDBConfig from './components/BubbleDBConfig';
import BubbleIntegrationGuide from './components/BubbleIntegrationGuide';
import BubbleTestConsole from './components/BubbleTestConsole';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const steps = ['Upload PDF', 'Connect Bubble DB', 'Map Fields', 'Test Integration'];

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bubbleConfig, setBubbleConfig] = useState({
    apiKey: '',
    appName: '',
    dataType: '',
  });
  const [fieldMapping, setFieldMapping] = useState({});

  const handleFileUpload = async (event) => {
    if (event.target.files && event.target.files[0]) {
      setLoading(true);
      const file = event.target.files[0];
      setSelectedFile(file);

      const formData = new FormData();
      formData.append('pdf', file);

      try {
        const response = await fetch('http://localhost:3001/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        setPdfData(data);
        setActiveStep(1);
      } catch (error) {
        console.error('Error uploading file:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBubbleConfig = (config) => {
    setBubbleConfig(config);
    setActiveStep(2);
  };

  const handleFieldMapping = (mapping) => {
    setFieldMapping(mapping);
    setActiveStep(3);
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box textAlign="center" p={3}>
            <input
              accept="application/pdf"
              style={{ display: 'none' }}
              id="pdf-upload"
              type="file"
              onChange={handleFileUpload}
            />
            <label htmlFor="pdf-upload">
              <Button variant="contained" component="span">
                Upload PDF Form
              </Button>
            </label>
            {loading && (
              <Box mt={2}>
                <CircularProgress />
              </Box>
            )}
            {pdfData && <PDFPreview file={pdfData} />}
          </Box>
        );
      case 1:
        return (
          <BubbleDBConfig
            onConfigSave={handleBubbleConfig}
            config={bubbleConfig}
          />
        );
      case 2:
        return (
          pdfData && (
            <BubbleIntegrationGuide
              pdfFields={pdfData.fields}
              bubbleConfig={bubbleConfig}
              onFieldMapping={handleFieldMapping}
            />
          )
        );
      case 3:
        return (
          <BubbleTestConsole
            pdfData={pdfData}
            bubbleConfig={bubbleConfig}
            fieldMapping={fieldMapping}
          />
        );
      default:
        return null;
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg">
        <Box my={4}>
          <Typography variant="h4" component="h1" gutterBottom align="center">
            PDF Form Manager
          </Typography>
          <Paper elevation={3}>
            <Box p={3}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              {renderStepContent()}
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;
