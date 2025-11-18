
require('dotenv').config();
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const admin = require('firebase-admin');

// IMPORTANT: Make sure to download your serviceAccountKey.json from Firebase
// and place it in the server directory.
const serviceAccount = require('./firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));


// Invoice processing endpoint with subscription check
app.post('/api/parse-invoice', async (req, res) => {
    const { imageData, mimeType, nomenclatureData, userId } = req.body;

    if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
    }

    try {
        // Check user's subscription status
        const subscriptionRef = db.collection('subscriptions').doc(userId);
        const subDoc = await subscriptionRef.get();

        if (!subDoc.exists) {
            return res.status(403).json({ error: 'No subscription found for this user.' });
        }

        const subscriptionData = subDoc.data();
        const planLimits = { free: 50, pro: 500, premium: 5000 };
        const currentLimit = planLimits[subscriptionData.planId] || 0;

        if (subscriptionData.invoiceCount >= currentLimit) {
            return res.status(403).json({ 
                error: 'Invoice limit reached. Please upgrade your plan.' 
            });
        }

        // ... (rest of the Gemini API call logic remains the same)

    } catch (error) {
        console.error('Error processing invoice:', error);
        res.status(500).json({ error: 'Failed to process invoice' });
    }
});


// ... (Stripe checkout session endpoint remains the same)


app.listen(4242, () => console.log('Running on port 4242'));
