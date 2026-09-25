import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));

function buildMessages(messages) {
  return [
    {
      role: "system",
      content:
        "You are a helpful, concise AI assistant. Answer naturally in English unless the user asks for another language."
    },
    ...messages.slice(-20)
  ];
}

async function callDeepSeek(messages) {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is missing.");
  }

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.DEEPSEEK_MODEL || "deepseek-flash",
      messages,
      stream: false
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `DeepSeek request failed (${response.status})`);
  }
  return data.choices?.[0]?.message?.content || "I couldn't generate a response.";
}

async function callDoubao(messages) {
  if (!process.env.ARK_API_KEY || !process.env.DOUBAO_MODEL) {
    throw new Error("ARK_API_KEY and DOUBAO_MODEL are required for Doubao.");
  }

  const response = await fetch("https://ark.cn-beijing.volces.com/api/v3/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.ARK_API_KEY}`
    },
    body: JSON.stringify({
      model: process.env.DOUBAO_MODEL,
      messages,
      stream: false
    })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Doubao request failed (${response.status})`);
  }
  return data.choices?.[0]?.message?.content || "I couldn't generate a response.";
}

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, provider } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: "Please provide at least one message." });
    }

    const selectedProvider = provider || process.env.AI_PROVIDER || "deepseek";
    const safeMessages = buildMessages(messages);

    const answer =
      selectedProvider === "doubao"
        ? await callDoubao(safeMessages)
        : await callDeepSeek(safeMessages);

    res.json({ answer, provider: selectedProvider });
  } catch (error) {
    res.status(500).json({ error: error.message || "Something went wrong." });
  }
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Free AI Chat is running at http://localhost:${port}`);
});
