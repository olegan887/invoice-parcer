
import type { InvoiceItem } from '../types';

export const parseInvoice = async (imageData: string, mimeType: string, nomenclatureData: string): Promise<InvoiceItem[]> => {
  try {
    const response = await fetch('http://localhost:4242/api/parse-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageData,
        mimeType,
        nomenclatureData,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process invoice');
    }

    const result = await response.json();
    return result as InvoiceItem[];

  } catch (error: any) {
    console.error("Error calling backend to process invoice:", error);
    const message = error.message || 'An unknown error occurred.';
    throw new Error(`Failed to process the invoice with AI. Details: ${message}`);
  }
};
