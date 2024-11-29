import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PDFWebhookManager } from '../../components/webhooks/PDFWebhookManager';
import { WebhookService } from '../../services/WebhookService';
import { mockWebhooks } from '../mocks/webhooks';

// Mock WebhookService
jest.mock('../../services/WebhookService');
const mockWebhookService = WebhookService as jest.Mocked<typeof WebhookService>;

describe('PDFWebhookManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockWebhookService.getWebhooks.mockResolvedValue(mockWebhooks);
  });

  it('loads existing webhooks on mount', async () => {
    render(<PDFWebhookManager />);

    expect(mockWebhookService.getWebhooks).toHaveBeenCalled();
    await waitFor(() => {
      mockWebhooks.forEach(webhook => {
        expect(screen.getByText(webhook.name)).toBeInTheDocument();
      });
    });
  });

  it('displays loading state while fetching webhooks', () => {
    mockWebhookService.getWebhooks.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve(mockWebhooks), 100))
    );

    render(<PDFWebhookManager />);

    expect(screen.getByText(/Loading webhooks/i)).toBeInTheDocument();
  });

  it('displays error message on webhook fetch failure', async () => {
    mockWebhookService.getWebhooks.mockRejectedValueOnce(new Error('Failed to fetch'));

    render(<PDFWebhookManager />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load webhooks/i)).toBeInTheDocument();
    });
  });

  it('allows creating new webhooks', async () => {
    mockWebhookService.createWebhook.mockResolvedValueOnce({
      id: 'new-webhook',
      name: 'New Webhook',
      url: 'https://example.com/webhook',
      active: true,
    });

    render(<PDFWebhookManager />);

    const addButton = screen.getByText(/add webhook/i);
    fireEvent.click(addButton);

    const nameInput = screen.getByLabelText(/webhook name/i);
    const urlInput = screen.getByLabelText(/webhook url/i);

    await userEvent.type(nameInput, 'New Webhook');
    await userEvent.type(urlInput, 'https://example.com/webhook');

    const saveButton = screen.getByText(/save webhook/i);
    fireEvent.click(saveButton);

    expect(mockWebhookService.createWebhook).toHaveBeenCalledWith({
      name: 'New Webhook',
      url: 'https://example.com/webhook',
    });

    await waitFor(() => {
      expect(screen.getByText('New Webhook')).toBeInTheDocument();
    });
  });

  it('validates webhook form inputs', async () => {
    render(<PDFWebhookManager />);

    const addButton = screen.getByText(/add webhook/i);
    fireEvent.click(addButton);

    const saveButton = screen.getByText(/save webhook/i);
    fireEvent.click(saveButton);

    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/URL is required/i)).toBeInTheDocument();

    const urlInput = screen.getByLabelText(/webhook url/i);
    await userEvent.type(urlInput, 'invalid-url');

    expect(screen.getByText(/Invalid URL format/i)).toBeInTheDocument();
  });

  it('allows editing existing webhooks', async () => {
    mockWebhookService.updateWebhook.mockResolvedValueOnce({
      ...mockWebhooks[0],
      name: 'Updated Webhook',
    });

    render(<PDFWebhookManager />);

    await waitFor(() => {
      const editButtons = screen.getAllByLabelText(/edit webhook/i);
      fireEvent.click(editButtons[0]);
    });

    const nameInput = screen.getByLabelText(/webhook name/i);
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Updated Webhook');

    const saveButton = screen.getByText(/save changes/i);
    fireEvent.click(saveButton);

    expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith(
      mockWebhooks[0].id,
      expect.objectContaining({ name: 'Updated Webhook' })
    );

    await waitFor(() => {
      expect(screen.getByText('Updated Webhook')).toBeInTheDocument();
    });
  });

  it('allows deleting webhooks', async () => {
    mockWebhookService.deleteWebhook.mockResolvedValueOnce(undefined);

    render(<PDFWebhookManager />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText(/delete webhook/i);
      fireEvent.click(deleteButtons[0]);
    });

    const confirmButton = screen.getByText(/confirm delete/i);
    fireEvent.click(confirmButton);

    expect(mockWebhookService.deleteWebhook).toHaveBeenCalledWith(mockWebhooks[0].id);

    await waitFor(() => {
      expect(screen.queryByText(mockWebhooks[0].name)).not.toBeInTheDocument();
    });
  });

  it('allows testing webhooks', async () => {
    mockWebhookService.testWebhook.mockResolvedValueOnce({ success: true });

    render(<PDFWebhookManager />);

    await waitFor(() => {
      const testButtons = screen.getAllByLabelText(/test webhook/i);
      fireEvent.click(testButtons[0]);
    });

    expect(mockWebhookService.testWebhook).toHaveBeenCalledWith(mockWebhooks[0].id);

    await waitFor(() => {
      expect(screen.getByText(/Test successful/i)).toBeInTheDocument();
    });
  });

  it('displays webhook test failure message', async () => {
    mockWebhookService.testWebhook.mockRejectedValueOnce(new Error('Test failed'));

    render(<PDFWebhookManager />);

    await waitFor(() => {
      const testButtons = screen.getAllByLabelText(/test webhook/i);
      fireEvent.click(testButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/Test failed/i)).toBeInTheDocument();
    });
  });

  it('allows toggling webhook active status', async () => {
    mockWebhookService.updateWebhook.mockResolvedValueOnce({
      ...mockWebhooks[0],
      active: false,
    });

    render(<PDFWebhookManager />);

    await waitFor(() => {
      const toggleButtons = screen.getAllByLabelText(/toggle webhook/i);
      fireEvent.click(toggleButtons[0]);
    });

    expect(mockWebhookService.updateWebhook).toHaveBeenCalledWith(
      mockWebhooks[0].id,
      expect.objectContaining({ active: false })
    );

    await waitFor(() => {
      expect(screen.getByText(/Inactive/i)).toBeInTheDocument();
    });
  });

  it('displays webhook history', async () => {
    const mockHistory = [
      { timestamp: '2023-01-01T00:00:00Z', status: 'success' },
      { timestamp: '2023-01-01T00:01:00Z', status: 'failure' },
    ];

    mockWebhookService.getWebhookHistory.mockResolvedValueOnce(mockHistory);

    render(<PDFWebhookManager />);

    await waitFor(() => {
      const historyButtons = screen.getAllByLabelText(/view history/i);
      fireEvent.click(historyButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByText(/failure/i)).toBeInTheDocument();
    });
  });
});
