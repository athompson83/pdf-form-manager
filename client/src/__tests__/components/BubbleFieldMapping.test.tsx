import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BubbleFieldMapping } from '../../components/bubble/BubbleFieldMapping';
import { BubbleService } from '../../services/BubbleService';
import { mockPDFFields } from '../mocks/pdfFields';
import { mockBubbleFields } from '../mocks/bubbleFields';

// Mock BubbleService
jest.mock('../../services/BubbleService');
const mockBubbleService = BubbleService as jest.Mocked<typeof BubbleService>;

describe('BubbleFieldMapping', () => {
  const defaultProps = {
    pdfFields: mockPDFFields,
    onMappingComplete: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockBubbleService.getFields.mockResolvedValue(mockBubbleFields);
  });

  it('loads Bubble fields on mount', async () => {
    render(<BubbleFieldMapping {...defaultProps} />);

    expect(mockBubbleService.getFields).toHaveBeenCalled();
    await waitFor(() => {
      mockBubbleFields.forEach(field => {
        expect(screen.getByText(field.name)).toBeInTheDocument();
      });
    });
  });

  it('displays loading state while fetching Bubble fields', () => {
    mockBubbleService.getFields.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(mockBubbleFields), 100))
    );

    render(<BubbleFieldMapping {...defaultProps} />);

    expect(screen.getByText(/Loading Bubble fields/i)).toBeInTheDocument();
  });

  it('displays error message on field fetch failure', async () => {
    mockBubbleService.getFields.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<BubbleFieldMapping {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load Bubble fields/i)).toBeInTheDocument();
    });
  });

  it('allows mapping PDF fields to Bubble fields', async () => {
    const onMappingComplete = jest.fn();
    render(<BubbleFieldMapping {...defaultProps} onMappingComplete={onMappingComplete} />);

    await waitFor(() => {
      const mappingButtons = screen.getAllByLabelText(/map field/i);
      fireEvent.click(mappingButtons[0]);
    });

    const bubbleFieldSelect = screen.getByLabelText(/select bubble field/i);
    fireEvent.change(bubbleFieldSelect, { target: { value: mockBubbleFields[0].name } });

    const saveButton = screen.getByText(/save mapping/i);
    fireEvent.click(saveButton);

    expect(onMappingComplete).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        pdfField: mockPDFFields[0],
        bubbleField: mockBubbleFields[0],
      }),
    ]));
  });

  it('validates field type compatibility', async () => {
    render(<BubbleFieldMapping {...defaultProps} />);

    await waitFor(() => {
      const mappingButtons = screen.getAllByLabelText(/map field/i);
      fireEvent.click(mappingButtons[0]);
    });

    const bubbleFieldSelect = screen.getByLabelText(/select bubble field/i);
    const incompatibleField = mockBubbleFields.find(f => f.type !== mockPDFFields[0].type);
    fireEvent.change(bubbleFieldSelect, { target: { value: incompatibleField!.name } });

    expect(screen.getByText(/Incompatible field types/i)).toBeInTheDocument();
  });

  it('allows setting transformation rules', async () => {
    const onMappingComplete = jest.fn();
    render(<BubbleFieldMapping {...defaultProps} onMappingComplete={onMappingComplete} />);

    await waitFor(() => {
      const mappingButtons = screen.getAllByLabelText(/map field/i);
      fireEvent.click(mappingButtons[0]);
    });

    const bubbleFieldSelect = screen.getByLabelText(/select bubble field/i);
    fireEvent.change(bubbleFieldSelect, { target: { value: mockBubbleFields[0].name } });

    const addTransformButton = screen.getByText(/add transformation/i);
    fireEvent.click(addTransformButton);

    const transformSelect = screen.getByLabelText(/transformation type/i);
    fireEvent.change(transformSelect, { target: { value: 'uppercase' } });

    const saveButton = screen.getByText(/save mapping/i);
    fireEvent.click(saveButton);

    expect(onMappingComplete).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        pdfField: mockPDFFields[0],
        bubbleField: mockBubbleFields[0],
        transformations: ['uppercase'],
      }),
    ]));
  });

  it('validates required field mappings', async () => {
    const requiredPDFFields = [
      { ...mockPDFFields[0], required: true },
      ...mockPDFFields.slice(1),
    ];

    render(
      <BubbleFieldMapping
        {...defaultProps}
        pdfFields={requiredPDFFields}
      />
    );

    const completeButton = screen.getByText(/complete mapping/i);
    fireEvent.click(completeButton);

    expect(screen.getByText(/Required fields must be mapped/i)).toBeInTheDocument();
  });

  it('allows removing field mappings', async () => {
    const onMappingComplete = jest.fn();
    render(<BubbleFieldMapping {...defaultProps} onMappingComplete={onMappingComplete} />);

    // Create a mapping
    await waitFor(() => {
      const mappingButtons = screen.getAllByLabelText(/map field/i);
      fireEvent.click(mappingButtons[0]);
    });

    const bubbleFieldSelect = screen.getByLabelText(/select bubble field/i);
    fireEvent.change(bubbleFieldSelect, { target: { value: mockBubbleFields[0].name } });

    const saveButton = screen.getByText(/save mapping/i);
    fireEvent.click(saveButton);

    // Remove the mapping
    const removeButton = screen.getByLabelText(/remove mapping/i);
    fireEvent.click(removeButton);

    const completeButton = screen.getByText(/complete mapping/i);
    fireEvent.click(completeButton);

    expect(onMappingComplete).toHaveBeenCalledWith([]);
  });

  it('preserves existing mappings when adding new ones', async () => {
    const onMappingComplete = jest.fn();
    render(<BubbleFieldMapping {...defaultProps} onMappingComplete={onMappingComplete} />);

    // Create first mapping
    await waitFor(() => {
      const mappingButtons = screen.getAllByLabelText(/map field/i);
      fireEvent.click(mappingButtons[0]);
    });

    let bubbleFieldSelect = screen.getByLabelText(/select bubble field/i);
    fireEvent.change(bubbleFieldSelect, { target: { value: mockBubbleFields[0].name } });

    let saveButton = screen.getByText(/save mapping/i);
    fireEvent.click(saveButton);

    // Create second mapping
    const mappingButtons = screen.getAllByLabelText(/map field/i);
    fireEvent.click(mappingButtons[1]);

    bubbleFieldSelect = screen.getByLabelText(/select bubble field/i);
    fireEvent.change(bubbleFieldSelect, { target: { value: mockBubbleFields[1].name } });

    saveButton = screen.getByText(/save mapping/i);
    fireEvent.click(saveButton);

    const completeButton = screen.getByText(/complete mapping/i);
    fireEvent.click(completeButton);

    expect(onMappingComplete).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        pdfField: mockPDFFields[0],
        bubbleField: mockBubbleFields[0],
      }),
      expect.objectContaining({
        pdfField: mockPDFFields[1],
        bubbleField: mockBubbleFields[1],
      }),
    ]));
  });
});
