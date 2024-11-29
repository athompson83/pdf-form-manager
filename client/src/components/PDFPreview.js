import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Box, Paper, Typography, Tooltip } from '@mui/material';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

function PDFPreview({ file }) {
  const [numPages, setNumPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  return (
    <Box sx={{ mt: 3, position: 'relative' }}>
      <Paper elevation={3}>
        <Box p={2}>
          <Document
            file={file instanceof File ? file : `http://localhost:3001/uploads/${file.filename}`}
            onLoadSuccess={onDocumentLoadSuccess}
          >
            <Page 
              pageNumber={pageNumber}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
          {file.fields?.map((field, index) => (
            <Tooltip key={index} title={`${field.name} (${field.type})`}>
              <Box
                sx={{
                  position: 'absolute',
                  left: field.rect?.x * scale,
                  top: field.rect?.y * scale,
                  width: field.rect?.width * scale,
                  height: field.rect?.height * scale,
                  border: '2px solid #1976d2',
                  backgroundColor: 'rgba(25, 118, 210, 0.1)',
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'rgba(25, 118, 210, 0.2)',
                  },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      </Paper>
      <Typography variant="body2" align="center" sx={{ mt: 1 }}>
        Page {pageNumber} of {numPages}
      </Typography>
    </Box>
  );
}

export default PDFPreview;
