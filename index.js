const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Endpoint ปลุกเซิร์ฟเวอร์ไม่ให้หลับ
app.get('/ping', (req, res) => res.send('OK'));

app.post('/api/chat', async (req, res) => {
  try {
    const { message, financialData } = req.body;
    
    // ตั้งค่า maxOutputTokens เพื่อให้ AI ตอบสั้นกระชับและผลิตข้อความเร็วขึ้น
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.8-flash",
      generationConfig: { maxOutputTokens: 350 }
    });
    
    const systemPrompt = `คุณคือผู้ช่วยทางการเงินของแอป Ayase Bank
ข้อมูลการเงินปัจจุบันของผู้ใช้: ${JSON.stringify(financialData || {})}
จงตอบคำถามให้สั้น กระชับ สรุปประเด็นทันที ไม่เกริ่นนำยาว`;

    // ตั้งค่า HTTP Response เป็น Stream
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');

    const result = await model.generateContentStream([systemPrompt, message]);
    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end();
  } catch (err) {
    res.status(500).send("เกิดข้อผิดพลาด: " + err.message);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
