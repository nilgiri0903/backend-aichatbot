const express = require("express");
const router = express.Router();
const db = require("../db");
const { OpenAI } = require("openai");
require("dotenv").config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Rule-based static responses
const faqReplies = {
  "hi": "Hello! How can I assist you today?",
  "hello": "Hi there! How can I help you today?",
  "what is computer": "A computer is an electronic device that processes data according to instructions in a program.",
  "what is computer engineering": "Computer engineering is a branch of engineering that integrates electrical engineering and computer science to develop computer hardware and software.",
  "difference between computer engineering and computer science": "Computer engineering focuses more on hardware and embedded systems, while computer science emphasizes software, algorithms, and programming.",
  "main components of a computer": "The main components include the CPU, memory (RAM & ROM), input/output devices, storage devices, and the motherboard.",
  "what is a microprocessor": "A microprocessor is the brain of a computer that executes instructions and processes data.",
  "programming languages should a computer engineer learn": "Common programming languages include C, C++, Java, Python, and assembly language.",
  "what is an algorithm": "An algorithm is a step-by-step procedure to solve a problem or perform a task.",
  "what is cpu pipelining": "Pipelining is a technique where multiple instruction stages are processed in parallel to increase CPU efficiency.",
  "what is virtual memory": "Virtual memory is a memory management technique that uses a portion of the hard drive as if it were RAM to extend available memory.",
  "what is osi model": "The OSI model is a conceptual framework used to understand network interactions, divided into seven layers from physical to application.",
  "what is sql": "SQL stands for Structured Query Language, used to manage and manipulate relational databases.",
};

// Function to get rule-based reply
function getRuleBasedReply(text) {
  const msg = text.toLowerCase();

  for (const key in faqReplies) {
    if (msg.includes(key)) {
      return faqReplies[key];
    }
  }

  // No match found — return null to trigger OpenAI fallback
  return null;
}

// Get all messages
router.get("/", (req, res) => {
  db.query("SELECT * FROM messages", (err, result) => {
    if (err) throw err;
    res.json(result);
  });
});

// Post message and get reply
router.post("/", async (req, res) => {
  const { sender, text } = req.body;

  try {
    // Save user message
    const userResult = await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO messages (sender, text) VALUES (?, ?)",
        [sender, text],
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });

    let botReply = getRuleBasedReply(text);

    // If no rule-based reply, fallback to OpenAI
    if (!botReply) {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: text }],
        });
        botReply = completion.choices[0].message.content;
      } catch (err) {
        console.error("OpenAI API error:", err);
        botReply = "Sorry, I couldn't process your message.";
      }
    }

    // Save bot reply
    const botResult = await new Promise((resolve, reject) => {
      db.query(
        "INSERT INTO messages (sender, text) VALUES (?, ?)",
        ["bot", botReply],
        (err, result) => (err ? reject(err) : resolve(result))
      );
    });

    // Return both messages
    res.json({
      id: userResult.insertId,
      sender,
      text,
      botReply,
      botReplyId: botResult.insertId,
    });
  } catch (err) {
    console.error("DB Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
