import { GoogleGenAI, Type } from "@google/genai";
import type { InvoiceItem } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        matchedProductName: {
          type: Type.STRING,
          description: "The product name from the nomenclature that best matches the original name from the invoice. Set to 'UNKNOWN' if no suitable match is found.",
        },
        originalName: {
          type: Type.STRING,
          description: "The product name exactly as it appears on the invoice.",
        },
        quantity: {
          type: Type.NUMBER,
          description: "The quantity of the item listed.",
        },
        unitPrice: {
          type: Type.NUMBER,
          description: "The price per single unit of the item.",
        },
        totalPrice: {
          type: Type.NUMBER,
          description: "The total price for the line item (quantity * unit price).",
        },
        sku: {
          type: Type.STRING,
          description: "The corresponding SKU from the nomenclature for the matched product. Set to 'UNKNOWN' if no match is found.",
        },
        totalQuantity: {
          type: Type.NUMBER,
          description: "The total number of individual units if specified (e.g., 10 packs of 12 units = 120). If not specified, this should be the same as 'quantity'.",
        },
        unitOfMeasure: {
          type: Type.STRING,
          description: "The unit of measurement for the item (e.g., 'kg', 'pcs', 'box').",
        },
      },
      required: ['matchedProductName', 'originalName', 'quantity', 'unitPrice', 'totalPrice', 'sku', 'totalQuantity', 'unitOfMeasure'],
    },
};


export const parseInvoice = async (imageData: string, mimeType:string, nomenclatureData: string): Promise<InvoiceItem[]> => {
  try {
    const prompt = `
You are an expert invoice processing AI. Your task is to analyze an invoice image, extract all line items, and match them against a provided product nomenclature.

**Instructions:**
1.  Carefully read the line items from the provided invoice image.
2.  For each line item, use the provided nomenclature data (in CSV format) to find the best match for the product.
3.  If a product from the invoice cannot be confidently matched to an item in the nomenclature, you MUST set 'matchedProductName' and 'sku' to the string 'UNKNOWN'.
4.  Extract the following fields for each line item:
    *   **originalName**: The product name as it appears on the invoice.
    *   **matchedProductName**: The corresponding 'name' from the nomenclature.
    *   **sku**: The corresponding 'sku' from the nomenclature.
    *   **quantity**: The quantity of the item.
    *   **unitPrice**: The price per unit.
    *   **totalPrice**: The total price for the line item.
    *   **totalQuantity**: The absolute total quantity. For example, if the line is "10 boxes of 12 units", quantity is 10 and totalQuantity is 120. If not specified, make it equal to quantity.
    *   **unitOfMeasure**: The unit of measure (e.g., kg, pcs, box).
5.  Return the data as a JSON array of objects, strictly adhering to the provided schema. Do not return anything other than the JSON array.

**Nomenclature Data:**
---
${nomenclatureData}
---
`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: imageData,
                    },
                },
            ],
        },
        config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
        },
    });

    const jsonString = response.text.trim();
    if (!jsonString.startsWith('[') || !jsonString.endsWith(']')) {
        console.error("Gemini response is not a valid JSON array:", jsonString);
        throw new Error("The AI returned data in an unexpected format. Please try again with a clearer image.");
    }

    const result = JSON.parse(jsonString);
    return result as InvoiceItem[];

  } catch (error: any) {
    console.error("Error calling Gemini to process invoice:", error);
    const message = error.message || 'An unknown error occurred.';
    if (message.includes('API key not valid')) {
        throw new Error("The API key is invalid. Please check your configuration.");
    }
    throw new Error(`Failed to process the invoice with AI. Details: ${message}`);
  }
};
