const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Nạp biến môi trường
dotenv.config({ override: true });

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// PHỤC VỤ FILE TĨNH - Giúp Docker tìm thấy index.html, style.css, script.js
app.use(express.static(path.join(__dirname, '.')));

// Route trang chủ - Đảm bảo mở localhost:8080 là ra web ngay
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API tạo kịch bản
app.post('/api/chat', async (req, res) => {
    try {
        const { product, message, audience, duration, actors, style } = req.body;

        if (!product || !message || !audience || !duration || !actors || !style) {
            return res.status(400).json({ error: { message: 'Vui lòng điền đủ thông tin form' } });
        }

        // Nạp lại key mỗi lần request để hỗ trợ sửa file .env trực tiếp
        dotenv.config({ override: true });
        const GROQ_API_KEY = process.env.GROQ_API_KEY;

        console.log("=== KIỂM TRA API KEY ===");
        console.log("Trạng thái Key:", GROQ_API_KEY ? "ĐÃ NẠP (YES)" : "THIẾU (NO)");

        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: { message: 'Server chưa có API Key trong file .env' } });
        }

        const prompt = `Bạn là chuyên gia biên kịch video. Hãy tạo kịch bản cho: 
        Sản phẩm: ${product}, Thông điệp: ${message}, Đối tượng: ${audience}, Thời lượng: ${duration}, Diễn viên: ${actors}, Phong cách: ${style}.
        BẮT BUỘC PHẢI THỰC HIỆN CÁC YÊU CẦU RIÊNG BIỆT SAU:

        1. HOOK (0-3s) - "PHẢI GIẬT GÂN":
        - Sử dụng các kỹ thuật: "Phủ định sự thật", "Nêu con số gây sốc" hoặc "Đánh vào nỗi sợ thầm kín". 
        - Ví dụ: "Dừng ngay việc [X] nếu bạn không muốn [Y]..." hoặc "Tại sao 90% người dùng [X] đều thất bại?".
        2. NHẠC NỀN (BGM) - "PHẢI BẮT TREND & ĐÚNG MOOD":
        - Đề xuất chính xác tên 2-3 bài hát đang Viral trên TikTok/Reels hoặc các bản nhạc không lời (Phonk, Lofi, Cinematic) phù hợp nhất với phong cách ${style}.
        - Cấu trúc mỗi bài phải gồm: [Tên bài hát - Nghệ sĩ] + [Mood: ví dụ Sang trọng, Năng động, Bí ẩn].
        - Chỉ dẫn kỹ thuật: Mô tả chi tiết điểm "Drop" hoặc "Chuyển cảnh" theo nhạc (Ví dụ: "Sử dụng đoạn cao trào từ giây thứ 15 để khớp với cảnh hiện sản phẩm").
        - Âm thanh bổ trợ (SFX): Gợi ý thêm các tiếng động như "Whoosh", "Glitch", hoặc "Tiếng tiền rơi" để tăng tính sinh động cho video.
        3. KÊU GỌI HÀNH ĐỘNG (CTA) - "TẠO CỘNG ĐỒNG":
        - Không dùng "Hãy mua ngay". 
        - Sử dụng các câu kêu gọi xây dựng cộng đồng như: "Tag ngay đứa bạn thân vào để cùng học", "Comment [Từ khóa] để mình gửi tài liệu bí mật", hoặc "Lưu lại ngay vì chắc chắn bạn sẽ cần dùng đến".

        4. CAPTION & HASHTAGS - "TỐI ƯU SEO":
        - Caption: Viết 3 mẫu (1 mẫu ngắn gọn gây tò mò, 1 mẫu kể chuyện sâu sắc, 1 mẫu liệt kê lợi ích).
        - Hashtags: Phải chia làm 3 tầng: 
            + Tầng 1 (Trending toàn cầu): #fyp, #viral, #trending.
            + Tầng 2 (Ngách ngành hàng): Liên quan trực tiếp đến ${product}.
            + Tầng 3 (Đối tượng mục tiêu): Liên quan đến nỗi đau của ${audience}.
        Trả về DUY NHẤT 1 khối JSON chuẩn (không giải thích thêm):
        {
          "hook": "...",
          "timeline": [{"time": "...", "visual": "...", "dialogue": "..."}],
          "captions": [],
          "hashtags": [],
          "bgm": "...",
          "cta": "..."
        }`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            return res.status(response.status).json({ error: errData.error });
        }

        const data = await response.json();
        const textResponse = data.choices[0].message.content;

        // XỬ LÝ LỖI JSON BẰNG REGEX (Khắc phục lỗi 500 khi AI nói thừa)
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                const result = JSON.parse(jsonMatch[0]);
                res.json(result);
            } catch (e) {
                res.status(500).json({ error: { message: 'Lỗi cấu trúc dữ liệu từ AI' } });
            }
        } else {
            res.status(500).json({ error: { message: 'AI không tạo được khối JSON hợp lệ' } });
        }

    } catch (error) {
        res.status(500).json({ error: { message: 'Lỗi hệ thống nội bộ' } });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server Docker đang chạy tại http://localhost:${PORT}`);
});
