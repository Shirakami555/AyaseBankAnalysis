const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();

// อนุญาตให้รับคำขอข้ามสาย (CORS) จาก Android WebView, APK และไฟล์ HTML ในเครื่องได้ทุกแหล่ง
app.use(cors({ origin: '*' }));
app.use(express.json());

// ดึง API Key จาก Environment Variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Health Check Endpoint สำหรับทดสอบสถานะเซิร์ฟเวอร์
app.get('/ping', (req, res) => res.send('OK'));

// Endpoint หลักสำหรับประมวลผลแชทบอท AI
app.post('/api/chat', async (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  try {
    const { message, financialData } = req.body;

    // เรียกใช้โมเดล gemini-3.8-flash และขยาย Token เพื่อรองรับภาษาไทย
    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.8-flash",
      generationConfig: {
        maxOutputTokens: 2048
      }
    });

    // กำหนด System Prompt วิเคราะห์การเงินสำหรับ Ayase Bank
    const systemPrompt = `คุณคือผู้ช่วยทางการเงินของแอป Ayase Bank
ข้อมูลการเงินปัจจุบันของผู้ใช้: ${JSON.stringify(financialData || {})}
จงตอบคำถามอย่างเป็นกันเอง แม่นยำ สรุปประเด็นชัดเจน ไม่ต้องเกริ่นนำยาวเกินไป`;

    const result = await model.generateContent([systemPrompt, message]);
    const responseText = result.response.text();

    res.json({ reply: responseText });
  } catch (err) {
    console.error('Gemini API Error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));

// Export app สำหรับรองรับ Vercel Serverless Functions
module.exports = app;
