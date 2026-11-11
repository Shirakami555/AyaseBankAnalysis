const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.get('/ping', (req, res) => res.send('OK'));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, financialData } = req.body;
    
    // ขยาย Token เป็น 2048 ป้องกันภาษาไทยถูกตัดขาดกลางประโยค
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.8-flash",
      generationConfig: { maxOutputTokens: 2048 }
    });
    
    const systemPrompt = `คุณคือผู้ช่วยทางการเงินของแอป Ayase Bank
ข้อมูลการเงินปัจจุบันของผู้ใช้: ${JSON.stringify(financialData || {})}
จงตอบคำถามอย่างเป็นกันเอง แม่นยำ สรุปประเด็นชัดเจน ไม่ต้องเกริ่นนำยาวเกินไป`;

    // ตั้งค่า Headers ป้องกัน Android WebView / Render กักเก็บ Buffer ข้อมูล
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const result = await model.generateContentStream([systemPrompt, message]);
    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).send("เกิดข้อผิดพลาด: " + err.message);
    } else {
      res.write("\n[การเชื่อมต่อขัดข้อง]");
      res.end();
    }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
