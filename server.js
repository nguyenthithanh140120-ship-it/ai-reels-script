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
        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        console.log("Groq key loaded:", GROQ_API_KEY ? "YES" : "NO");

        if (!GROQ_API_KEY) {
            console.error("GROQ_API_KEY không tồn tại trong .env");
            process.exit(1);
        }

        const prompt = `Hãy đóng vai **chuyên gia sáng tạo nội dung TikTok/Reels viral** với kinh nghiệm marketing và storytelling.

Tạo một **kịch bản video ngắn cực kỳ hấp dẫn, gây tò mò và có khả năng viral cao** dựa trên thông tin sau:

* Sản phẩm/Dịch vụ: ${product}
* Thông điệp chính: ${message}
* Đối tượng khán giả: ${audience}
* Thời lượng: ${duration}
* Số diễn viên: ${actors}
* Phong cách: ${style}

YÊU CẦU CHẤT LƯỢNG CAO:

1. **Hook 0–3s phải gây sốc, tò mò hoặc chạm nỗi đau người xem**
   * dùng câu hỏi, so sánh bất ngờ, hoặc tình huống gây tranh cãi nhẹ.

2. **Timeline phải có storytelling**
   * mở đầu: vấn đề
   * giữa: giải pháp / cao trào
   * cuối: kết quả bất ngờ hoặc cảm xúc mạnh.

3. **Visual mô tả chi tiết**
   * góc máy
   * biểu cảm
   * hành động
   * text trên màn hình.

4. **Dialogue tự nhiên như nói chuyện ngoài đời**, không quá quảng cáo.

5. **Caption phải viral**
   * ngắn
   * kích thích comment
   * có yếu tố cảm xúc.

6. **Hashtag**
   * 5–8 hashtag
   * kết hợp:
     * hashtag trending
     * hashtag niche
     * hashtag viral TikTok.

7. **Nhạc nền**
   * đề xuất nhạc đang trend hoặc vibe phù hợp.

8. **CTA tự nhiên**
   * không quá quảng cáo
   * khuyến khích người xem thử hoặc tìm hiểu.

BẮT BUỘC:
Chỉ trả về JSON đúng format (KHÔNG bọc trong markdown hay bất kỳ văn bản nào khác):

{
  "hook": "...",
  "timeline": [
    {
      "time": "0s - 3s",
      "visual": "...",
      "dialogue": "..."
    }
  ],
  "captions": [],
  "hashtags": [],
  "bgm": "...",
  "cta": "..."
}`;

        const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
        const requestBody = {
            model: "llama-3.1-8b-instant",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7
        };

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.log("Groq API error:", errorText);

            let rawMessage = 'Lỗi khi gọi Groq API';
            try {
                const errorData = JSON.parse(errorText);
                rawMessage = errorData?.error?.message || errorData?.message || rawMessage;
            } catch (e) {
                // If not JSON, use raw text
                rawMessage = errorText;
            }

            const lower = rawMessage.toLowerCase();

            // Nếu key bị lỗi, trả về mã 401
            if (lower.includes('api key') || lower.includes('unauthorized') || lower.includes('expired')) {
                return res.status(401).json({ error: { message: 'API key của bạn không hợp lệ. Vui lòng kiểm tra lại GROQ_API_KEY trong .env.' } });
            }

            return res.status(response.status).json({ error: { message: rawMessage } });
        }

        const data = await response.json();
        const textResponse = data.choices[0].message.content;
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