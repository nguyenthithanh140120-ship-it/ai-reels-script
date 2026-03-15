# Sử dụng Node.js 18+ Alpine làm base
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json và cài đặt dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Expose port 8080
EXPOSE 8080

# Chạy server Node.js
CMD ["node", "server.js"]
