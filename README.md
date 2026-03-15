# Tên Đề Bài: Xây dựng Ứng dụng Trợ Lý AI tạo Kịch bản Video (TikTok/Reels)

## 1. Mô tả ngắn gọn về ứng dụng
🎬 **Trợ Lý Biên Kịch Reels/TikTok AI** là một ứng dụng web giúp các nhà sáng tạo nội dung, marketer nhanh chóng tạo ra các kịch bản video ngắn (Short-form video) chuyên nghiệp, thu hút người xem.
Dựa trên Công nghệ Google Gemini AI, ứng dụng cung cấp:
- Bảng kịch bản phân cảnh chi tiết (Visual & Audio) theo thời gian thực.
- Gợi ý Caption & Hashtags đính kèm chuẩn SEO.
- Đề xuất Nhạc nền (BGM) phù hợp với ngữ cảnh.
- Giao diện (UI/UX) tối ưu hóa trải nghiệm mượt mà, hỗ trợ Responsive và chuẩn Accessibility. Tích hợp tính năng Copy Nhanh cho nội dung đầu ra.

## 2. Link Ứng dụng trên Vercel
> 🌐 **[Link Deploy Vercel (Thêm link sau khi deploy)]** 

## 3. Hướng dẫn chạy ứng dụng cục bộ (Local)
Dự án được xây dựng hoàn toàn bằng HTML, CSS (Vanilla) và JavaScript (Vanilla) giao tiếp trực tiếp với Gemini API. Do đó việc chạy mã cục bộ rất đơn giản:
1. Tải toàn bộ mã nguồn (`index.html`, `style.css`, `script.js`).
2. Mở file `index.html` trực tiếp bằng bất kỳ trình duyệt web hiện đại nào (Chrome, Edge, Safari,...).
3. Hoặc sử dụng Live Server Extension trên VS Code: Chuột phải vào file `index.html` -> Chọn **"Open with Live Server"**.

## 4. Hướng dẫn Build và Chạy Docker Image
Dự án được cấu hình sẵn để đóng gói chạy thông qua Docker với `NGINX` server.

**Các bước chạy với Docker Desktop:**
1. Cài đặt và bật ứng dụng **Docker Desktop**.
2. Mở Terminal / PowerShell / Command Prompt tại thư mục gốc chứa project (Nơi có file `Dockerfile`).
3. Chạy lệnh sau để Docker Compose tự động Build image và Start container:
   ```bash
   docker-compose up -d --build
   ```
4. Mở trình duyệt và truy cập vào địa chỉ: **`http://localhost:8080`** 
*(Chú ý: Nếu port 8080 bị trùng, có thể đổi port trong file `docker-compose.yml` theo cấu trúc `"port_ngoài:80"`)*.

**Cách Tắt/Dừng Docker Container:**
```bash
docker-compose down
```

## 5. Bảo mật API Key với Vercel Serverless Functions
🔑 **API Key Gemini AI đã được bảo mật hoàn toàn.**
Ứng dụng sử dụng **Vercel Serverless Functions** (`/api/generate.js`) làm proxy server phân giải. Frontend (`script.js`) sẽ gọi yêu cầu đến Backend nội bộ `/api/generate`, và Backend sẽ lấy biến môi trường `GEMINI_API_KEY` để giao tiếp với Google AI Studio một cách an toàn.

**Cách thiết lập trên Vercel:**
1. Đưa mã nguồn lên GitHub.
2. Tại Vercel Dashboard, chọn **Import Project**.
3. Trong phần **Environment Variables**, thêm biến:
   - Key: `GEMINI_API_KEY`
   - Value: `[API_KEY_CỦA_BẠN]`
4. Bấm **Deploy**.
