# NTUT Exam System - Backend

[中文版 (Chinese Version)](#中文版本)

This is the backend service for the NTUT Exam System, designed for managing and conducting programming exams with anti-cheat measures and real-time monitoring.

## Features

- **Anti-Cheat Monitoring**: Automatically logs suspicious student activities and flags potential violations.
- **Real-Time Notifications**: Utilizes Socket.IO to push instant updates, messages, and scoreboard changes to all connected clients.
- **Hot Update Configuration**: Exam settings and configurations can be updated dynamically without restarting the server.
- **Multi-Student Support**: Scalable architecture designed to handle concurrent connections from multiple students.
- **Piston Server Integration**: Securely executes and judges student code submissions in isolated environments using the Piston code execution engine.
- **Comprehensive API**: RESTful APIs for both student clients and admin dashboards, fully documented with Swagger.

## Technical Implementation

The backend is built using:

- **Runtime**: Node.js & TypeScript
- **Web Framework**: Express.js
- **Database**: PostgreSQL (via Sequelize ORM)
- **Real-time Communication**: Socket.IO
- **Code Execution**: Piston (Docker-based execution engine)
- **Security**:
  - RSA encryption for secure key exchange.
  - AES encryption for payload protection.
  - JWT for session management.

## Related Projects

- **Student Desktop Client**: [https://github.com/Rduanchen/NTUT-on-machine-test.git](https://github.com/Rduanchen/NTUT-on-machine-test.git)
- **TA Frontend (Admin Dashboard)**: [https://github.com/Rduanchen/ntut-exam-system-ta-frontend.git](https://github.com/Rduanchen/ntut-exam-system-ta-frontend.git)

## Installation

### Prerequisites

- Node.js (v16+)
- Docker & Docker Compose
- PostgreSQL

### 1. Clone the Repository

```bash
git clone https://github.com/Rduanchen/ntut-exam-system-backend.git
cd ntut-exam-system-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Setup Piston Code Execution Engine

Piston is required for running student code. You can set it up using Docker:

```bash
# Clone the Piston repository
git clone https://github.com/engineer-man/piston
cd piston

# Start the API container
docker-compose up -d api

# Install CLI dependencies and language packages
cd cli && npm install
# Example: Install Python (adjust based on your exam requirements)
node index.js ppman install python java c cpp
cd ..
```

### 4. Setup Database and Environment

Make sure you have a PostgreSQL database running. You can use the provided `docker-compose.yaml` to start one:

```bash
docker-compose up -d
```

Create a `.env` file in the root directory (refer to `.env.example` if available) and specificy your environment variables:

```env
USER_PORT=3001
ADMIN_PORT=3002
DATABASE_URL=postgres://user:password@localhost:5432/exam_db
SYSTEM_AES_KEY=your_super_secret_aes_key_here
```

### 5. Manual Configuration (Crucial Steps)

You must manually configure the following security keys for the system to function correctly:

#### A. Generate RSA Keys

The system uses RSA for initial handshake and key exchange. You need to generate a pair of keys and place them in the `keys/` directory.

1. Create a `keys` folder in the project root if it doesn't exist.
2. Generate the keys:
   ```bash
   mkdir -p keys
   cd keys
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -outform PEM -pubout -out public.pem
   cd ..
   ```

#### B. Configure System AES Key

Set the `SYSTEM_AES_KEY` in your `.env` file. This key is used for internal encryption.

#### C. Piston Configuration

Check `src/constants/piston.config.ts` to ensure the Piston server URL and supported languages match your setup.

### 6. Run the Server

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## API Documentation

The API documentation is processed using Swagger. Once the server is running, you can access the documentation at:

- **Admin Server**: `http://localhost:3002/api-docs`

This interface provides detailed information about all available endpoints for both Admin and User roles.

### 中文版本

# NTUT Exam System - Backend (北科大考試系統後端)

這是 NTUT 考試系統的後端服務，專為管理和執行程式設計考試而設計，具備防作弊措施和即時監控功能。

## 特色功能

- **防作弊監控**：自動記錄學生可疑活動並標記潛在違規行為。
- **即時通知推播**：利用 Socket.IO 向所有連線的客戶端（學生端、管理端）即時推送更新、訊息和計分板變動。
- **設定熱更新 (Hot Update)**：無需重啟伺服器即可動態更新考試設定和配置。
- **多學生支援**：可擴展的架構，設計用於處理多位學生的同時連線。
- **Piston Server 串接**：使用 Piston 程式碼執行引擎，在隔離環境中安全地執行和評判學生提交的程式碼。
- **完整的 API**：為學生客戶端和管理員儀表板提供 RESTful API，並附有完整的 Swagger 文件。

## 技術實作

本後端系統使用以下技術構建：

- **Runtime**: Node.js & TypeScript
- **Web 框架**: Express.js
- **資料庫**: PostgreSQL (透過 Sequelize ORM)
- **即時通訊**: Socket.IO
- **程式碼執行**: Piston (基於 Docker 的執行引擎)
- **安全性**:
  - RSA 加密：用於安全的密鑰交換。
  - AES 加密：用於資料傳輸保護。
  - JWT：用於連線階段 (Session) 管理。

## 相關專案

- **學生桌面客戶端**: [https://github.com/Rduanchen/NTUT-on-machine-test.git](https://github.com/Rduanchen/NTUT-on-machine-test.git)
- **TA 前端 (管理員儀表板)**: [https://github.com/Rduanchen/ntut-exam-system-ta-frontend.git](https://github.com/Rduanchen/ntut-exam-system-ta-frontend.git)

## 安裝指南

### 前置需求

- Node.js (v16+)
- Docker & Docker Compose
- PostgreSQL

### 1. 複製專案 (Clone Repository)

```bash
git clone https://github.com/Rduanchen/ntut-exam-system-backend.git
cd ntut-exam-system-backend
```

### 2. 安裝依賴套件

```bash
npm install
```

### 3. 設定 Piston 程式碼執行引擎

執行學生程式碼需要 Piston。您可以使用 Docker 進行設定：

```bash
# Clone Piston repository
git clone https://github.com/engineer-man/piston
cd piston

# 啟動 API container
docker-compose up -d api

# 安裝 CLI 依賴和語言包
cd cli && npm install
# 範例：安裝 Python (請根據您的考試需求調整)
node index.js ppman install python java c cpp
cd ..
```

### 4. 設定資料庫與環境變數

確保您已執行 PostgreSQL 資料庫。您可以使用提供的 `docker-compose.yaml` 啟動一個：

```bash
docker-compose up -d
```

在專案根目錄建立 `.env` 檔案（可參考 `.env.example`），並指定您的環境變數：

```env
USER_PORT=3001
ADMIN_PORT=3002
DATABASE_URL=postgres://user:password@localhost:5432/exam_db
SYSTEM_AES_KEY=your_super_secret_aes_key_here
```

### 5. 手動設定 (關鍵步驟)

您必須手動設定以下安全金鑰，系統才能正常運作：

#### A. 產生 RSA 金鑰

系統使用 RSA 進行初始握手和密鑰交換。您需要產生一對金鑰並將其放置在 `keys/` 目錄中。

1. 如果專案根目錄中沒有 `keys` 資料夾，請建立它。
2. 產生金鑰：
   ```bash
   mkdir -p keys
   cd keys
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -outform PEM -pubout -out public.pem
   cd ..
   ```

#### B. 設定系統 AES 金鑰

在您的 `.env` 檔案中設定 `SYSTEM_AES_KEY`。此金鑰用於內部加密。

#### C. Piston 設定

檢查 `src/constants/piston.config.ts` 以確保 Piston 伺服器 URL 和支援的語言與您的設定相符。

### 6. 啟動伺服器

```bash
# 開發模式
npm run dev

# 生產環境建置與執行
npm run build
npm start
```

## API 文件

本專案使用 Swagger 產生 API 文件。伺服器啟動後，您可以透過以下網址存取文件：

- **Admin Server**: `http://localhost:3002/api-docs`

此介面提供 Admin 和 User 兩者所有可用端點的詳細資訊。
