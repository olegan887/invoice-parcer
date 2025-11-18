
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Initialize GoogleGenerativeAI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const responseSchema = {
    type: "ARRAY",
    items: {
      type: "OBJECT",
      properties: {
        matchedProductName: {
          type: "STRING",
          description: "The product name from the nomenclature that best matches the original name from the invoice. Set to 'UNKNOWN' if no suitable match is found.",
        },
        originalName: {
          type: "STRING",
          description: "The product name exactly as it appears on the invoice.",
        },
        quantity: {
          type: "NUMBER",
          description: "The quantity of the item listed.",
        },
        unitPrice: {
          type: "NUMBER",
          description: "The price per single unit of the item.",
        },
        totalPrice: {
          type: "NUMBER",
          description: "The total price for the line item (quantity * unit price).",
        },
        sku: {
          type: "STRING",
          description: "The corresponding SKU from the nomenclature for the matched product. Set to 'UNKNOWN' if no match is found.",
        },
        totalQuantity: {
          type: "NUMBER",
          description: "The total number of individual units if specified (e.g., 10 packs of 12 units = 120). If not specified, this should be the same as 'quantity'.",
        },
        unitOfMeasure: {
          type: "STRING",
          description: "The unit of measurement for the item (e.g., 'kg', 'pcs', 'box').",
        },
      },
      required: ['matchedProductName', 'originalName', 'quantity', 'unitPrice', 'totalPrice', 'sku', 'totalQuantity', 'unitOfMeasure'],
    },
};

// New endpoint for parsing invoices
app.post('/api/parse-invoice', async (req, res) => {
    const { imageData, mimeType, nomenclatureData } = req.body;

    if (!imageData || !mimeType || !nomenclatureData) {
        return res.status(400).json({ error: 'Missing required fields: imageData, mimeType, or nomenclatureData' });
    }

    try {
        const model = genAI.getGenerativeModel({
             model: 'gemini-1.5-flash',
             generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
            }
        });

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

        const result = await model.generateContent([prompt, {
            inlineData: {
                data: imageData,
                mimeType,
            },
        }]);

        const response = result.response;
        const text = response.text();
        res.json(JSON.parse(text));

    } catch (error) {
        console.error('Error processing invoice:', error);
        res.status(500).json({ error: 'Failed to process invoice' });
    }
});


const YOUR_DOMAIN = 'http://localhost:5173';

app.post('/create-checkout-session', async (req, res) => {
  const { priceId } = req.body;
  const session = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${YOUR_DOMAIN}/success`,
    cancel_url: `${YOUR_DOMAIN}/cancel`,
  });

  res.json({ url: session.url });
});

app.listen(4242, () => console.log('Running on port 4242'));
