import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// 1. Phục vụ các file Frontend tĩnh (index.html, style.css, script.js)
app.use(express.static(__dirname));

// 2. Mock API Gateway cho Local & Docker (Mô phỏng Vercel Serverless)
app.post('/api/generate', async (req, res) => {
    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'Missing GEMINI_API_KEY environment variable. Create a .env file locally with your key.' });
    }

    try {
        const { product, message, audience, duration, actors, style } = req.body;
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

        const systemPrompt = `Bạn là một chuyên gia sáng tạo nội dung (Content Creator) triệu view trên TikTok và Reels. 
        Khi nhận được chủ đề, xây dựng kịch bản chú trọng đến phong cách cụ thể yêu cầu.
        OUTPUT CHÍNH XÁC CHUẨN JSON MÀ KHÔNG CÓ BACKTICKS HAY TEXT:
        {
            "hook": "Câu mở đầu gây chú ý 0-3s (kích thích người xem)",
            "timeline": [
                {
                    "time": "Mốc thời gian (VD: 03-08s)",
                    "visual": "Mô tả hình ảnh bối cảnh chi tiết",
                    "dialogue": "Lời thoại hoặc phụ đề (Ngữ điệu...)"
                }
            ],
            "captions": ["Caption mẫu 1", "Caption mẫu 2"],
            "hashtags": ["#hashtag1", "#hashtag2"],
            "bgm": "Mô tả nhạc nền (Trend...)",
            "cta": "Câu Kêu gọi hành động ấn tượng cuối clip"
        }`;

        const userPrompt = `Hãy tạo kịch bản video:
        - Sản phẩm: ${product}
        - Điểm nổi bật / Thông điệp: ${message}
        - Đối tượng người xem: ${audience}
        - Thời lượng chốt: ${duration}
        - Số diễn viên: ${actors}
        - Phong cách kết hợp: ${style}`;

        const payload = {
            contents: [{ role: "user", parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }]
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            let errorText = await response.text();
            try { errorText = JSON.parse(errorText).error.message; } catch(e) {}
            return res.status(response.status).json({ error: errorText || 'Error from Google API' });
        }

        const data = await response.json();
        let textResponse = data.candidates[0].content.parts[0].text;
        
        const jsonStart = textResponse.indexOf('{');
        const jsonEnd = textResponse.lastIndexOf('}');
        if (jsonStart === -1) {
            return res.status(500).json({ error: "Không tìm thấy JSON hợp lệ từ AI." });
        }
        
        const resultJson = JSON.parse(textResponse.substring(jsonStart, jsonEnd + 1));
        return res.status(200).json(resultJson);

    } catch (error) {
        console.error("Local Backend API error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Frontend URL: http://localhost:${PORT}/index.html`);
});
