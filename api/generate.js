export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Only POST is allowed.' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
        return res.status(500).json({ error: 'Missing GEMINI_API_KEY environment variable. Please configure it in Vercel Deployment.' });
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
        
        // Trích xuất JSON từ chuỗi kết quả (Xử lý trường hợp AI trả về markdown)
        const jsonStart = textResponse.indexOf('{');
        const jsonEnd = textResponse.lastIndexOf('}');
        if (jsonStart === -1) {
            return res.status(500).json({ error: "Không tìm thấy cấu trúc JSON hợp lệ từ AI." });
        }
        
        const resultJson = JSON.parse(textResponse.substring(jsonStart, jsonEnd + 1));
        return res.status(200).json(resultJson);

    } catch (error) {
        console.error("Vercel Backend API error:", error);
        return res.status(500).json({ error: error.message || "Internal Server Error" });
    }
}
