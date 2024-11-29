import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFFieldDetector } from '../../components/pdf/PDFFieldDetector';
import { PDFService } from '../../services/PDFService';
import { mockPDFFields } from '../mocks/pdfFields';

// Mock PDFService
jest.mock('../../services/PDFService');
const mockPDFService = PDFService as jest.Mocked<typeof PDFService>;

describe('PDFFieldDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders upload section initially', () => {
    render(<PDFFieldDetector onFieldsDetected={jest.fn()} />);
    
    expect(screen.getByText(/Upload PDF/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/drop zone/i)).toBeInTheDocument();
  });

  it('handles file upload', async () => {
    const onFieldsDetected = jest.fn();
    mockPDFService.detectFields.mockResolvedValueOnce(mockPDFFields);

    render(<PDFFieldDetector onFieldsDetected={onFieldsDetected} />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByLabelText(/drop zone/i);

    await userEvent.upload(dropzone, file);

    expect(mockPDFService.detectFields).toHaveBeenCalledWith(file);
    await waitFor(() => {
      expect(onFieldsDetected).toHaveBeenCalledWith(mockPDFFields);
    });
  });

  it('displays error for invalid file type', async () => {
    render(<PDFFieldDetector onFieldsDetected={jest.fn()} />);

    const file = new File(['dummy content'], 'test.txt', { type: 'text/plain' });
    const dropzone = screen.getByLabelText(/drop zone/i);

    await userEvent.upload(dropzone, file);

    expect(screen.getByText(/Please upload a PDF file/i)).toBeInTheDocument();
    expect(mockPDFService.detectFields).not.toHaveBeenCalled();
  });

  it('displays loading state during field detection', async () => {
    mockPDFService.detectFields.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(mockPDFFields), 100))
    );

    render(<PDFFieldDetector onFieldsDetected={jest.fn()} />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByLabelText(/drop zone/i);

    await userEvent.upload(dropzone, file);

    expect(screen.getByText(/Detecting fields/i)).toBeInTheDocument();
  });

  it('displays error message on detection failure', async () => {
    mockPDFService.detectFields.mockRejectedValueOnce(new Error('Detection failed'));

    render(<PDFFieldDetector onFieldsDetected={jest.fn()} />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByLabelText(/drop zone/i);

    await userEvent.upload(dropzone, file);

    await waitFor(() => {
      expect(screen.getByText(/Failed to detect fields/i)).toBeInTheDocument();
    });
  });

  it('allows retrying after failure', async () => {
    mockPDFService.detectFields
      .mockRejectedValueOnce(new Error('Detection failed'))
      .mockResolvedValueOnce(mockPDFFields);

    const onFieldsDetected = jest.fn();
    render(<PDFFieldDetector onFieldsDetected={onFieldsDetected} />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByLabelText(/drop zone/i);

    await userEvent.upload(dropzone, file);
    await waitFor(() => {
      expect(screen.getByText(/Failed to detect fields/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/Retry/i);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(onFieldsDetected).toHaveBeenCalledWith(mockPDFFields);
    });
  });

  it('displays field preview after detection', async () => {
    mockPDFService.detectFields.mockResolvedValueOnce(mockPDFFields);

    render(<PDFFieldDetector onFieldsDetected={jest.fn()} />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByLabelText(/drop zone/i);

    await userEvent.upload(dropzone, file);

    await waitFor(() => {
      mockPDFFields.forEach(field => {
        expect(screen.getByText(field.name)).toBeInTheDocument();
        expect(screen.getByText(field.type)).toBeInTheDocument();
      });
    });
  });

  it('allows editing detected fields', async () => {
    mockPDFService.detectFields.mockResolvedValueOnce(mockPDFFields);
    const onFieldsDetected = jest.fn();

    render(<PDFFieldDetector onFieldsDetected={onFieldsDetected} />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByLabelText(/drop zone/i);

    await userEvent.upload(dropzone, file);

    await waitFor(() => {
      const editButtons = screen.getAllByLabelText(/edit field/i);
      fireEvent.click(editButtons[0]);
    });

    const nameInput = screen.getByLabelText(/field name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Field');

    const saveButton = screen.getByText(/save/i);
    fireEvent.click(saveButton);

    const updatedFields = [...mockPDFFields];
    updatedFields[0].name = 'Updated Field';

    expect(onFieldsDetected).toHaveBeenLastCalledWith(updatedFields);
  });

  it('validates field names during editing', async () => {
    mockPDFService.detectFields.mockResolvedValueOnce(mockPDFFields);

    render(<PDFFieldDetector onFieldsDetected={jest.fn()} />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByLabelText(/drop zone/i);

    await userEvent.upload(dropzone, file);

    await waitFor(() => {
      const editButtons = screen.getAllByLabelText(/edit field/i);
      fireEvent.click(editButtons[0]);
    });

    const nameInput = screen.getByLabelText(/field name/i);
    await userEvent.clear(nameInput);

    expect(screen.getByText(/Field name is required/i)).toBeInTheDocument();
  });

  it('prevents duplicate field names', async () => {
    mockPDFService.detectFields.mockResolvedValueOnce(mockPDFFields);

    render(<PDFFieldDetector onFieldsDetected={jest.fn()} />);

    const file = new File(['dummy content'], 'test.pdf', { type: 'application/pdf' });
    const dropzone = screen.getByLabelText(/drop zone/i);

    await userEvent.upload(dropzone, file);

    await waitFor(() => {
      const editButtons = screen.getAllByLabelText(/edit field/i);
      fireEvent.click(editButtons[0]);
    });

    const nameInput = screen.getByLabelText(/field name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, mockPDFFields[1].name);

    expect(screen.getByText(/Field name must be unique/i)).toBeInTheDocument();
  });
});
