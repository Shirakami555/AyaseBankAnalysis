const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/chat', async (req, res) => {
  try {
    const { message, financialData } = req.body;
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });
    
    const systemPrompt = `คุณคือผู้ช่วยทางการเงินของแอป Ayase Bank
ข้อมูลการเงินปัจจุบันของผู้ใช้: ${JSON.stringify(financialData || {})}
จงตอบคำถามสั้น กระชับ เป็นกันเอง และช่วยวิเคราะห์งบการเงินให้อย่างแม่นยำ`;

    const result = await model.generateContent([systemPrompt, message]);
    res.json({ reply: result.response.text() });
  } catch (err) {
    res.status(500).json({ error: "ประมวลผลข้อความล้มเหลว: " + err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
