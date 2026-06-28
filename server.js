require('dotenv').config(); 
const express = require('express');
const cors = require('cors'); 
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai'); 

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true' ? '0.0.0.0' : '127.0.0.1';

app.use(cors({
    origin: [
        'http://localhost:5173', 
        'http://127.0.0.1:5173', 
        'https://YOUR_PROJECT_NAME.vercel.app' // ◄ ADD YOUR FRESH live Vercel URL here!
    ],
    methods: ['GET', 'POST'],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

function fileToGenerativePart(filePath, mimeType) {
    return {
        inlineData: {
            data: Buffer.from(fs.readFileSync(filePath)).toString("base64"),
            mimeType
        },
    };
}

app.post('/api/upload', upload.single('screenshot'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'Please select an image file.' });

    try {
        const imagePart = fileToGenerativePart(req.file.path, req.file.mimetype);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `
            You are a friendly web design coach checking a student's design layout screenshot.
            Identify exactly 5 elements that a human user would look at first based on spacing and colors.
            
            Provide a clear layout analysis score, plain English critiques, and a custom "autoFixSuggestions" block.
            
            You MUST respond ONLY with a clean, raw JSON object. No markdown backticks.
            
            Format:
            {
              "conversionScore": 78,
              "critique": "Your heading text pops beautifully! However, your primary action button is a bit small and blends into the background shadow layers.",
              "attentionPoints": [
                { 
                  "element": "The main heading text", 
                  "x": 50, 
                  "y": 25, 
                  "intensity": 90,
                  "fixAction": "Make this text 10% smaller so it does not crowd out your main action button."
                },
                { 
                  "element": "The 'Get Started' action button", 
                  "x": 52, 
                  "y": 58, 
                  "intensity": 60,
                  "fixAction": "✨ BOOST SIZE & GLOW: We expanded this button box by 1.3x and added a high-contrast glowing neon accent border so users find it instantly!"
                },
                { "element": "The top right navigation bar links", "x": 80, "y": 8, "intensity": 45, "fixAction": "Move these links 5% further right." },
                { "element": "The left side abstract illustration", "x": 20, "y": 45, "intensity": 75, "fixAction": "Dim opacity to 40% to prevent distraction." },
                { "element": "The secondary description paragraph text", "x": 50, "y": 38, "intensity": 50, "fixAction": "Increase line spacing slightly." }
              ]
            }
        `;
        
        const response = await model.generateContent([prompt, imagePart]);
        let rawText = response.response.text().trim();
        
        if (rawText.includes("```json")) rawText = rawText.split("```json")[1].split("```")[0].trim();
        else if (rawText.includes("```")) rawText = rawText.split("```")[1].split("```")[0].trim();
        
        const aiData = JSON.parse(rawText);

        res.status(200).json({
            imageUrl: `http://127.0.0.1:5000/uploads/${req.file.filename}`,
            analytics: aiData
        });

    } catch (error) {
        console.error(error);
        if (error.status === 429 || (error.message && error.message.includes('429'))) {
            return res.status(429).json({ error: 'The AI is taking a short rest! Please wait 30 seconds and click analyze again.' });
        }
        res.status(500).json({ error: 'AI processing failed.', details: error.message });
    }
});

app.listen(PORT, HOST, () => console.log(`🚀 Server listening on http://${HOST}:${PORT}`));