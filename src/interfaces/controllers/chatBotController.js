// controllers/chatController.js
import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message },
      ],
    });

    const reply = response.choices[0].message.content;
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("Chatbot error:", err);
    return res.status(500).json({ error: "Chatbot failed to respond" });
  }
};
