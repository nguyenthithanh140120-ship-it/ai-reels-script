const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
// Use override so `.env` changes take effect without restarting the server.
// (Update .env and the next request will pick up the new key.)
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files from current directory

// API endpoint to generate script
app.post('/api/generate', async (req, res) => {
    try {
        const { product, message, audience, duration, actors, style } = req.body;

        // Validate required fields
        if (!product || !message || !audience || !duration || !actors || !style) {
            return res.status(400).json({ error: { message: 'Thiếu thông tin bắt buộc' } });
        }

        // Reload .env on every request so updating the key does not require restarting the server.
        dotenv.config({ override: true });
        const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
        if (!GEMINI_API_KEY) {
            return res.status(500).json({ error: { message: 'API Key không được cấu hình' } });
        }

        const prompt = `Bạn là một chuyên gia sáng tạo kịch bản video ngắn (TikTok/Reels/Shorts).
Hãy tạo một kịch bản video chi tiết dựa trên các thông tin sau:
- Sản phẩm/Dịch vụ: ${product}
- Thông điệp chính: ${message}
- Đối tượng khán giả: ${audience}
- Thời lượng: ${duration}
- Số lượng diễn viên: ${actors}
- Phong cách: ${style}

YÊU CẦU BẮT BUỘC:
Chỉ trả về MỘT chuỗi JSON (KHÔNG bọc trong markdown \`\`\`json hay bất kỳ văn bản nào khác). Cấu trúc JSON phải chính xác như sau:
{
  "hook": "Câu Hook thu hút (0-3s đầu)",
  "timeline": [
    {
      "time": "0s - 3s",
      "visual": "Mô tả hình ảnh/góc máy/hành động",
      "dialogue": "Lời thoại hoặc text trên màn hình"
    }
  ],
  "captions": ["Gợi ý caption 1", "Gợi ý caption 2"],
  "hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "bgm": "Tên bài hát / Thể loại nhạc nền phù hợp",
  "cta": "Câu kêu gọi hành động (Call To Action)"
}`;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2000,
            }
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            const rawMessage = errorData?.error?.message || errorData?.message || 'Lỗi khi gọi Google API';
            const lower = rawMessage.toLowerCase();

            // Nếu key đã bị Google báo expired/leaked, trả về mã 401 với hướng dẫn rõ ràng
            if (lower.includes('api key expired') || lower.includes('api key invalid') || lower.includes('api key expired') || lower.includes('key has been revoked') || lower.includes('leaked')) {
                return res.status(401).json({ error: { message: 'API key của bạn không còn hợp lệ (expired/leaked). Vui lòng tạo key mới trong Google AI Studio và cập nhật .env.' } });
            }

            return res.status(response.status).json({ error: { message: rawMessage } });
        }

        const data = await response.json();
        const textResponse = data.candidates[0].content.parts[0].text;
        let jsonString = textResponse.replace(/```json/gi, '').replace(/```/g, '').trim();

        try {
            const result = JSON.parse(jsonString);
            res.json(result);
        } catch (parseErr) {
            console.error('Parse error:', parseErr);
            res.status(500).json({ error: { message: 'Dữ liệu trả về từ AI không đúng định dạng JSON' } });
        }

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: { message: 'Lỗi máy chủ nội bộ' } });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`Server đang chạy trên port ${PORT}`);
});