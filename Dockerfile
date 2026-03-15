# Sử dụng lightweight Nginx image làm base
FROM nginx:alpine

# Xóa nội dung mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copy toàn bộ mã nguồn vào thư mục public của Nginx
COPY . /usr/share/nginx/html/

# Expose port 80 cho web server
EXPOSE 80

# Chạy Nginx
CMD ["nginx", "-g", "daemon off;"]
