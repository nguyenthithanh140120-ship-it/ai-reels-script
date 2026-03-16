module.exports = async function handler(req, res) {
    console.log("Check Key:", process.env.GROQ_API_KEY ? "OK" : "MISSING");
    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Handle OPTIONS request
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { product, message, audience, duration, actors, style } = req.body;

        if (!product || !message || !audience || !duration || !actors || !style) {
            return res.status(400).json({ error: 'Thiếu thông tin yêu cầu' });
        }

        const API_KEY = process.env.GROQ_API_KEY;
        console.log("Check Key:", API_KEY ? "OK" : "MISSING");
        
        if (!API_KEY) {
            console.error("Thiếu biến môi trường GROQ_API_KEY");
            return res.status(500).json({ error: 'Lỗi cấu hình server' });
        }

        const prompt = `Hãy đóng vai **chuyên gia sáng tạo nội dung TikTok/Reels viral** với kinh nghiệm marketing và storytelling.

Tạo một **kịch bản video ngắn cực kỳ hấp dẫn, gây tò mò và có khả năng viral cao** dựa trên thông tin sau:

* Sản phẩm/Dịch vụ: ${product}
* Thông điệp chính: ${message}
* Khán giả mục tiêu: ${audience}
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

        try {
            console.log("===> Bắt đầu gọi Groq API...");
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
                    "Authorization": `Bearer ${API_KEY}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Groq API Error:", errorData);
                return res.status(response.status).json({ error: 'Lỗi khi gọi AI. Có thể do API Key hoặc tham số không đúng.', details: errorData });
            }

            const data = await response.json();
            let rawText = data.choices[0].message.content.trim();
            console.log("===> Đã nhận API Response từ Groq.");
            
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
                console.error('Error parsing JSON from Groq:', rawText);
                return res.status(500).json({ error: 'Kết quả từ AI không đúng định dạng JSON' });
            }
        } catch (apiError) {
            console.error('Groq API Error:', apiError);
            return res.status(500).json({ error: 'Lỗi khi gọi AI.', details: apiError.message });
        }

    } catch (error) {
        console.error('Lỗi tổng quát xử lý request:', error);
        return res.status(500).json({ error: 'Lỗi server nội bộ. Chi tiết: ' + (error.message || 'Unknown Error') });
    }
}
