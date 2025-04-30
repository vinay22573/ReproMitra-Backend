const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const prompt = req.body.text || req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        success: false,
        error: 'Text input is required' 
      });
    }
    
    // Using Google's Gemini API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [
          {
            parts: [
              {
                text: typeof prompt === 'string' ? prompt : JSON.stringify(prompt)
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        }
      }
    );
    
    const result = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || 
                  'Sorry, I could not generate a response.';
    
    return res.status(200).json({
      success: true,
      summary: result
    });
  } catch (error) {
    console.error('Error calling Gemini API:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to process request'
    });
  }
});

module.exports = router;