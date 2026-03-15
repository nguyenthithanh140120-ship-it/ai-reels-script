# Tên Đề Bài: Xây dựng Ứng dụng Trợ Lý AI tạo Kịch bản Video (TikTok/Reels)

## 1. Mô tả ngắn gọn về ứng dụng
🎬 **Trợ Lý Biên Kịch Reels/TikTok AI** là một ứng dụng web giúp các nhà sáng tạo nội dung, marketer nhanh chóng tạo ra các kịch bản video ngắn (Short-form video) chuyên nghiệp, thu hút người xem.
Dựa trên Công nghệ Google Gemini AI, ứng dụng cung cấp:
- Bảng kịch bản phân cảnh chi tiết (Visual & Audio) theo thời gian thực.
- Gợi ý Caption & Hashtags đính kèm chuẩn SEO.
- Đề xuất Nhạc nền (BGM) phù hợp với ngữ cảnh.
- Giao diện (UI/UX) tối ưu hóa trải nghiệm mượt mà, hỗ trợ Responsive và chuẩn Accessibility. Tích hợp tính năng Copy Nhanh cho nội dung đầu ra.

## 2. Link Ứng dụng trên Vercel
> https://ai-reels-script.vercel.app 

## 3. Hướng dẫn chạy ứng dụng cục bộ (Local)
Do ứng dụng gọi API qua Server Backend (để bảo mật API Key tránh lộ trên Frontend), bạn cần cài NodeJS để chạy ứng dụng:

1. Phải cài đặt [Node.js](https://nodejs.org/) (phiên bản 18 trở lên).
2. Tạo file tên `.env` tại thư mục gốc của project (cùng chỗ với file `package.json`). Viết đoạn code sau vào trong file `.env`:
   ```env
   GEMINI_API_KEY=AIzaSyA_... (thêm đoạn mã API của bạn vào đây)
   ```
   > ✅ **Lưu ý:** mỗi khi bạn đổi API Key trong `.env`, hãy **dừng server và khởi động lại** để thay đổi có hiệu lực.
3. Mở Terminal tại thư mục project và chạy 2 lệnh sau:
   ```bash
   npm install
   npm start
   ```
4. Khi chạy xong, mở trình duyệt web truy cập: **`http://localhost:8080/index.html`**

*(Chú ý: Không dùng tính năng Live Server hay mở file HTML trực tiếp được nữa, vì chúng không thể chạy code API của Server.)*

## 4. Hướng dẫn Build và Chạy Docker Image
Dự án đã cấu hình đầy đủ để đóng gói toàn bộ Frontend và Backend Node.js qua Docker.

**Các bước chạy với Docker Desktop:**
1. Đảm bảo bạn đã có file `.env` và API Key bên trong (như hướng dẫn số 3 ở trên). Môi trường Docker Compose tự động lấy key từ `.env`.
2. Bật ứng dụng **Docker Desktop**.
3. Mở Terminal tại thư mục gốc chứa project và gõ:
   ```bash
   docker-compose up -d --build
   ```
4. Mở trình duyệt và truy cập vào địa chỉ: **`http://localhost:8080`** 

**Cách Tắt/Dừng Docker Container:**
```bash
docker-compose down
```

## 5. Bảo mật API Key với Node.js Backend
🔑 **API Key Gemini AI đã được bảo mật hoàn toàn.**
Ứng dụng sử dụng **Node.js/Express server** (`server.js`) làm proxy server phân giải. Frontend (`script.js`) sẽ gọi yêu cầu đến Backend nội bộ `/api/generate`, và Backend sẽ lấy biến môi trường `GEMINI_API_KEY` từ file `.env` để giao tiếp với Google AI Studio một cách an toàn.

**Cơ chế bảo mật:**
- API Key được lưu trong file `.env` (đã được thêm vào `.gitignore`)
- Frontend chỉ gọi API nội bộ, không lộ API Key ra bên ngoài
- Server backend xử lý việc gọi Google API và trả kết quả về frontend
- Khi F12 trên trình duyệt, chỉ thấy request đến `/api/generate` - không tìm thấy API Key

> ⚠️ Nếu bạn gặp thông báo “Your API key was reported as leaked” hoặc “API key expired”, hãy thực hiện các bước sau:
>
> 1. **Tạo API Key mới** (không đăng public ở nơi nào). Key đã bị lộ sẽ nhanh chóng bị Google gắn cờ và vô hiệu.
> 2. **Bật Billing + Enable API**:
>    - Trong Google Cloud Console, đảm bảo **Billing đã bật** cho dự án.
>    - Vào **APIs & Services > Library** và bật **Generative Language API** (hoặc tên tương tự).
> 3. **Không giới hạn key** (hoặc chỉ giới hạn theo domain/người dùng nếu bạn biết rõ). Nếu key bị giới hạn sai, Google có thể trả lỗi “expired/invalid”.
> 4. Cập nhật lại file `.env` (hoặc biến môi trường) và **khởi động lại server**.

**Cách thiết lập trên Vercel:**
1. Đưa mã nguồn lên GitHub.
2. Tại Vercel Dashboard, chọn **Import Project**.
3. Trong phần **Environment Variables**, thêm biến:
   - Key: `GEMINI_API_KEY`
   - Value: `[API_KEY_CỦA_BẠN]`
4. Bấm **Deploy**.
