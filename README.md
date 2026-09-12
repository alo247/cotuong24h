# 🎯 Cờ Tướng 24h (CoTuong24h)

Ứng dụng chơi Cờ Tướng trực tuyến và đấu với AI thông minh với giao diện bàn cờ gỗ 3D chuyên nghiệp, hỗ trợ chơi đa nền tảng (Web, Mobile, Tablet).

[![GitHub Repo](https://img.shields.io/badge/GitHub-alo247%2Fcotuong24h-blue?logo=github)](https://github.com/alo247/cotuong24h)
[![Status](https://img.shields.io/badge/Status-Active-brightgreen)]()

---

## ✨ Tính năng nổi bật

- 🪵 **Giao diện bàn cờ gỗ 3D chuyên nghiệp:** Thiết kế tinh xảo, hiệu ứng đổ bóng, quân cờ sắc nét và trải nghiệm thị giác chân thực.
- 🤖 **Đấu với AI thông minh:** Nhiều cấp độ từ Dễ đến Cao thủ, áp dụng thuật toán Minimax kết hợp Alpha-Beta Pruning và bảng định giá vị trí quân cờ chuẩn xác.
- 👥 **Đấu Online Thời Gian Thực:**
  - Kết nối phòng chơi qua **Socket.IO** và mạng ngang hàng **WebRTC P2P**.
  - Tìm trận ngẫu nhiên hoặc tạo phòng riêng có mã mời bạn bè.
- 🏆 **Hệ thống Xếp hạng & ELO:** Tự động tính điểm ELO sau mỗi ván đấu, lưu lịch sử và thống kê tỉ lệ thắng/thua.
- 🔊 **Âm thanh chân thực:** Tiếng gõ cờ, ăn cờ, chiếu tướng và thắng/thua sống động.
- ⚡ **Hỗ trợ Triển khai Đa nền tảng:** Sẵn sàng chạy trên Node.js server hoặc frontend tĩnh trên Vercel.

---

## 🚀 Cài đặt và Khởi chạy

### Yêu cầu hệ thống
- [Node.js](https://nodejs.org/) (phiên bản 18 trở lên)
- NPM hoặc Yarn

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Khởi chạy Server
```bash
npm start
```
Server sẽ chạy mặc định tại: `http://localhost:3000`

---

## 📁 Cấu trúc dự án

```
├── js/
│   ├── ai-engine.js       # Thuật toán AI cờ tướng
│   ├── app.js             # Logic điều khiển giao diện chính
│   ├── game-engine.js     # Luật chơi, kiểm tra nước đi hợp lệ
│   ├── p2p-network.js     # Kết nối ngang hàng WebRTC
│   ├── sound-manager.js   # Quản lý hiệu ứng âm thanh
│   └── storage.js         # Lưu trữ trạng thái và lịch sử
├── database.js            # Quản lý cơ sở dữ liệu SQLite (Users, Games, ELO)
├── game-engine.js         # Engine luật cờ tướng phía server
├── index.html             # Giao diện chính của ứng dụng
├── server.js              # Server Node.js (Express + Socket.IO)
├── styles.css             # Định kiểu CSS bàn cờ gỗ 3D và responsive
├── vercel.json            # Cấu hình triển khai nhanh trên Vercel
└── package.json           # Danh sách thư viện phụ thuộc
```

---

## 📜 Giấy phép
Dự án được phát hành theo giấy phép [MIT](LICENSE).