import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FieldMappingValidator } from '../../components/validation/FieldMappingValidator';
import { ValidationService } from '../../services/ValidationService';
import { mockPDFFields } from '../mocks/pdfFields';
import { mockBubbleFields } from '../mocks/bubbleFields';
import { mockValidationResults } from '../mocks/validationResults';

// Mock ValidationService
jest.mock('../../services/ValidationService');
const mockValidationService = ValidationService as jest.Mocked<typeof ValidationService>;

describe('FieldMappingValidator', () => {
  const defaultProps = {
    pdfFields: mockPDFFields,
    bubbleFields: mockBubbleFields,
    onValidationComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockValidationService.validateMapping.mockResolvedValue(mockValidationResults);
  });

  it('validates field mappings on mount', async () => {
    render(<FieldMappingValidator {...defaultProps} />);

    expect(mockValidationService.validateMapping).toHaveBeenCalledWith(
      mockPDFFields,
      mockBubbleFields
    );

    await waitFor(() => {
      mockValidationResults.forEach(result => {
        expect(screen.getByText(result.message)).toBeInTheDocument();
      });
    });
  });

  it('displays loading state during validation', () => {
    mockValidationService.validateMapping.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(mockValidationResults), 100))
    );

    render(<FieldMappingValidator {...defaultProps} />);

    expect(screen.getByText(/Validating field mappings/i)).toBeInTheDocument();
  });

  it('displays error message on validation failure', async () => {
    mockValidationService.validateMapping.mockRejectedValueOnce(
      new Error('Validation failed')
    );

    render(<FieldMappingValidator {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to validate mappings/i)).toBeInTheDocument();
    });
  });

  it('groups validation results by severity', async () => {
    render(<FieldMappingValidator {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Errors/i)).toBeInTheDocument();
      expect(screen.getByText(/Warnings/i)).toBeInTheDocument();
    });
  });

  it('allows fixing validation issues', async () => {
    mockValidationService.getAutoFixes.mockResolvedValueOnce([
      {
        type: 'type_conversion',
        field: mockPDFFields[0],
        suggestion: 'Convert to text',
      },
    ]);

    render(<FieldMappingValidator {...defaultProps} />);

    await waitFor(() => {
      const fixButtons = screen.getAllByText(/fix/i);
      fireEvent.click(fixButtons[0]);
    });

    expect(screen.getByText(/Convert to text/i)).toBeInTheDocument();
  });

  it('applies auto-fixes', async () => {
    const fix = {
      type: 'type_conversion',
      field: mockPDFFields[0],
      suggestion: 'Convert to text',
    };

    mockValidationService.getAutoFixes.mockResolvedValueOnce([fix]);
    mockValidationService.applyFix.mockResolvedValueOnce({ success: true });

    render(<FieldMappingValidator {...defaultProps} />);

    await waitFor(() => {
      const fixButtons = screen.getAllByText(/fix/i);
      fireEvent.click(fixButtons[0]);
    });

    const applyButton = screen.getByText(/apply fix/i);
    fireEvent.click(applyButton);

    expect(mockValidationService.applyFix).toHaveBeenCalledWith(fix);
  });

  it('revalidates after applying fixes', async () => {
    const fix = {
      type: 'type_conversion',
      field: mockPDFFields[0],
      suggestion: 'Convert to text',
    };

    mockValidationService.getAutoFixes.mockResolvedValueOnce([fix]);
    mockValidationService.applyFix.mockResolvedValueOnce({ success: true });

    render(<FieldMappingValidator {...defaultProps} />);

    await waitFor(() => {
      const fixButtons = screen.getAllByText(/fix/i);
      fireEvent.click(fixButtons[0]);
    });

    const applyButton = screen.getByText(/apply fix/i);
    fireEvent.click(applyButton);

    expect(mockValidationService.validateMapping).toHaveBeenCalledTimes(2);
  });

  it('displays fix application errors', async () => {
    const fix = {
      type: 'type_conversion',
      field: mockPDFFields[0],
      suggestion: 'Convert to text',
    };

    mockValidationService.getAutoFixes.mockResolvedValueOnce([fix]);
    mockValidationService.applyFix.mockRejectedValueOnce(new Error('Fix failed'));

    render(<FieldMappingValidator {...defaultProps} />);

    await waitFor(() => {
      const fixButtons = screen.getAllByText(/fix/i);
      fireEvent.click(fixButtons[0]);
    });

    const applyButton = screen.getByText(/apply fix/i);
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(screen.getByText(/Failed to apply fix/i)).toBeInTheDocument();
    });
  });

  it('allows ignoring warnings', async () => {
    const onValidationComplete = jest.fn();
    render(
      <FieldMappingValidator
        {...defaultProps}
        onValidationComplete={onValidationComplete}
      />
    );

    await waitFor(() => {
      const ignoreButton = screen.getByText(/ignore warnings/i);
      fireEvent.click(ignoreButton);
    });

    expect(onValidationComplete).toHaveBeenCalledWith({
      success: true,
      ignoredWarnings: expect.any(Array),
    });
  });

  it('prevents completing with errors', async () => {
    const onValidationComplete = jest.fn();
    render(
      <FieldMappingValidator
        {...defaultProps}
        onValidationComplete={onValidationComplete}
      />
    );

    await waitFor(() => {
      const completeButton = screen.getByText(/complete validation/i);
      fireEvent.click(completeButton);
    });

    expect(screen.getByText(/Cannot complete with errors/i)).toBeInTheDocument();
    expect(onValidationComplete).not.toHaveBeenCalled();
  });

  it('displays detailed validation information', async () => {
    render(<FieldMappingValidator {...defaultProps} />);

    await waitFor(() => {
      const detailsButtons = screen.getAllByText(/view details/i);
      fireEvent.click(detailsButtons[0]);
    });

    expect(screen.getByText(/Validation Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Field Type/i)).toBeInTheDocument();
    expect(screen.getByText(/Constraints/i)).toBeInTheDocument();
  });

  it('allows manual field mapping corrections', async () => {
    const onValidationComplete = jest.fn();
    render(
      <FieldMappingValidator
        {...defaultProps}
        onValidationComplete={onValidationComplete}
      />
    );

    await waitFor(() => {
      const editButtons = screen.getAllByText(/edit mapping/i);
      fireEvent.click(editButtons[0]);
    });

    const fieldSelect = screen.getByLabelText(/select field/i);
    fireEvent.change(fieldSelect, { target: { value: mockBubbleFields[0].name } });

    const saveButton = screen.getByText(/save mapping/i);
    fireEvent.click(saveButton);

    expect(mockValidationService.validateMapping).toHaveBeenCalledTimes(2);
  });
});
