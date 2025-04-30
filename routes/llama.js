const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { text, chatBoatName } = req.body;
    
    if (!text) {
      return res.status(400).json({ 
        success: false,
        error: 'Text input is required' 
      });
    }
    
    // Format the prompt
    // const systemPrompt = "You are a Medical AI assistant called ReproMitra. Answer the user's questions accurately and concisely. Suggest severity ";
    const systemPrompt = `
    You are a reproductive healthcare assistant for a trusted healthcare app. Your role is to provide accurate, evidence-based, and up-to-date information strictly related to reproductive health, including topics like contraception, fertility, menstruation, pregnancy, STIs, sexual wellness, reproductive anatomy, and related healthcare advice. 
  Your responses must be:
  - Concise, clear, and directly answering the question.
  - Respectful, non-judgmental, and inclusive.
  - Free from unnecessary small talk or elaboration.
  - Based only on medically accurate and reliable information.
  - Avoid speculative, personal, or emotional commentary.
  - If a question is outside the domain of reproductive health, respond with: "I'm only able to assist with reproductive health-related questions."

  Your role is not to diagnose or prescribe but to support users with reliable educational information and guide them toward consulting qualified medical professionals when appropriate.

  Stay on-topic, stay factual, and answer to the point. Dont write anything else. No "I am not a doctor" line or anything like this, no personal opinions, no empathy, and no emotional responses. Just give the information requested, straight to the point.
    `;

    const userMessage = text;
    
    // Use Together.ai API (very affordable with free credits)
    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model: "mistralai/Mistral-7B-Instruct-v0.2", // Lighter model that works well
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TOGETHER_API_KEY}`,
          'Content-Type': 'application/json',
        }
      }
    );
    
    // Extract the AI's response
    const aiResponse = response.data.choices[0].message.content;
    
    return res.status(200).json({
      success: true,
      summary: aiResponse
    });
  } catch (error) {
    console.error('Error with LLaMA API:', error.message);
    
    // Try fallback to free API
    try {
      console.log("Using fallback API...");
      const fallbackResponse = await axios.post(
        'https://api-inference.huggingface.co/models/google/gemma-2b-it',
        { inputs: text },
        {
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          }
        }
      );
      
      return res.status(200).json({
        success: true,
        summary: fallbackResponse.data[0].generated_text,
        usedFallback: true
      });
    } catch (fallbackError) {
      return res.status(500).json({
        success: false,
        error: "API request failed",
        message: error.message
      });
    }
  }
});

module.exports = router;