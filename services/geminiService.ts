import { GoogleGenAI, Type } from "@google/genai";
import type { Product, InvoiceItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        matchedProductName: {
          type: Type.STRING,
          description: 'The name of the product from our nomenclature that best matches the item on the invoice.',
        },
        originalName: {
            type: Type.STRING,
            description: 'The product name exactly as it appears on the invoice document.'
        },
        quantity: {
          type: Type.NUMBER,
          description: 'The quantity of the item (number of packs, bottles, etc.).',
        },
        unitPrice: {
          type: Type.NUMBER,
          description: 'The price per unit of the item.',
        },
        totalPrice: {
          type: Type.NUMBER,
          description: 'The total price for the line item (quantity * unit price).',
        },
        sku: {
            type: Type.STRING,
            description: 'The SKU of the matched product from our nomenclature.'
        },
        totalQuantity: {
            type: Type.NUMBER,
            description: "The total amount of the product, calculated by multiplying the quantity by the pack size/weight/volume from the product name. For example, if 2 containers of 5kg cheese arrive, 'quantity' is 2, but 'totalQuantity' is 10. If this information is not available, this should be equal to the 'quantity'."
        },
        unitOfMeasure: {
            type: Type.STRING,
            description: "The unit of measure for the totalQuantity (e.g., 'kg', 'g', 'l', 'ml', 'pcs'). If no specific unit is found, use 'pcs'."
        }
      },
      required: ['matchedProductName', 'originalName', 'quantity', 'unitPrice', 'totalPrice', 'sku', 'totalQuantity', 'unitOfMeasure'],
    },
  };


export const parseInvoice = async (imageData: string, mimeType: string, nomenclatureData: string): Promise<InvoiceItem[]> => {

  const prompt = `
    You are an expert accounting assistant specializing in data entry from invoices (накладная).
    Your task is to analyze the provided invoice image, extract all line items, and match them against the company's product nomenclature.

    This is our company's product nomenclature, provided as a block of text (likely CSV format):
    --- NOMENCLATURE START ---
    ${nomenclatureData}
    --- NOMENCLATURE END ---

    Instructions:
    1.  **Language Detection & Translation:** If the invoice text is not in Russian, mentally translate it to Russian before processing to ensure accurate matching with the nomenclature.
    2.  **Nomenclature Analysis:** First, analyze the nomenclature data to understand its structure. Identify which columns represent the product's name and its unique identifier (SKU, article, etc.).
    3.  **Invoice Extraction & Matching:** For each line item on the invoice:
        a. Extract the product name as it appears ('originalName'), quantity, unit price, and total price.
        b. Find the best corresponding product in the nomenclature. The 'matchedProductName' and 'sku' in your response MUST come from the nomenclature file.
        c. If no confident match is found, use "UNKNOWN" for 'matchedProductName' and 'sku'.
    4.  **Total Quantity Calculation:** This is a crucial step.
        a. Examine the 'originalName' for pack size, weight, or volume (e.g., 'Сыр 5кг', 'Вода 1.5л').
        b. Calculate 'totalQuantity' by multiplying the item 'quantity' (number of packs) by this pack size. For example, if quantity is 2 for 'Сыр 5кг', the 'totalQuantity' is 10.
        c. Determine the 'unitOfMeasure' (e.g., 'kg', 'l', 'pcs').
        d. If no pack size is specified, 'totalQuantity' is the same as 'quantity' and 'unitOfMeasure' should be 'pcs'.
    5.  **Formatting:** Parse all numbers correctly, removing currency symbols.
    6.  **Output:** Return a clean JSON array adhering strictly to the schema. No extra text or explanations.
  `;

  const imagePart = {
    inlineData: {
      data: imageData,
      mimeType: mimeType,
    },
  };

  const textPart = {
    text: prompt,
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: 'application/json',
        responseSchema: responseSchema,
      },
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    if (!Array.isArray(result)) {
        throw new Error("AI response is not a JSON array.");
    }
    
    // Basic validation
    if (result.length > 0 && typeof result[0].matchedProductName === 'undefined') {
        throw new Error("AI response does not match the expected schema.");
    }
    
    return result as InvoiceItem[];

  } catch (error) {
    console.error("Error processing invoice with Gemini API:", error);
    throw new Error("The Gemini API failed to process the request. Please check the console for details.");
  }
};