const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { product, message, audience, duration, actors, style } = req.body;

    if (!product || !message || !audience || !duration || !actors || !style) {
        return res.status(400).json({ error: 'Thiếu thông tin yêu cầu' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
        console.error("Thiếu biến môi trường GEMINI_API_KEY");
        return res.status(500).json({ error: 'Lỗi cấu hình server' });
    }

    const prompt = `Bạn là một chuyên gia biên kịch video ngắn (TikTok, Reels, Shorts) xuất sắc.
Hãy viết một kịch bản video chi tiết dựa trên các thông tin sau:
- Sản phẩm/Dịch vụ: ${product}
- Thông điệp chính: ${message}
- Khán giả mục tiêu: ${audience}
- Thời lượng: ${duration}
- Số lượng diễn viên: ${actors}
- Phong cách: ${style}

YÊU CẦU ĐẦU RA:
- Trả về ĐÚNG định dạng JSON, KHÔNG BỌC TRONG markdown, KHÔNG CÓ BẤT KỲ VĂN BẢN NÀO KHÁC BÊN NGOÀI JSON.
- Cấu trúc JSON phải chính xác như sau:
{
  "hook": "Câu mở đầu thu hút sự chú ý trong 3 giây",
  "timeline": [
    {
      "time": "0-5s",
      "visual": "Mô tả hình ảnh/hành động/bối cảnh",
      "dialogue": "Lời thoại hoặc chữ trên màn hình"
    }
  ],
  "captions": ["Caption 1", "Caption 2"],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "bgm": "Tên bài hát hoặc phong cách nhạc nền",
  "cta": "Lời kêu gọi hành động cuối video"
}`;

    try {
        console.log("===> Bắt đầu gọi Gemini API qua SDK...");
        const genAI = new GoogleGenerativeAI(API_KEY);
        // Cập nhật tên model đúng như yêu cầu: gemini-1.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1200,
            }
        });

        const response = await result.response;
        let rawText = response.text().trim();
        console.log("===> Đã nhận API Response từ Gemini.");
        
        // Loại bỏ markdown JSON nếu có
        if (rawText.startsWith('```json')) {
            rawText = rawText.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (rawText.startsWith('```')) {
            rawText = rawText.replace(/^```/, '').replace(/```$/, '').trim();
        }

        try {
            const parsedData = JSON.parse(rawText);
            return res.status(200).json(parsedData);
        } catch (parseError) {
            console.error('Error parsing JSON from Gemini:', rawText);
            return res.status(500).json({ error: 'Kết quả từ AI không đúng định dạng JSON' });
        }
    } catch (error) {
        console.error('Server execution error:', error.message);
        return res.status(500).json({ error: 'Lỗi server nội bộ chi tiết: ' + error.message });
    }
}
