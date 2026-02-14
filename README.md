# NTUT Exam System - Backend

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
