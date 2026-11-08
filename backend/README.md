# QuickShare Backend ⚙️

> Express 5 REST API and file storage service with 24-hour retention and automatic garbage collection.

---

## 🚀 Overview

The QuickShare backend manages file uploads, assigns unique transfer IDs, keeps track of metadata and expiration timestamps in-memory, and streams files directly to recipients. It features an automated background worker that periodically deletes expired files from disk storage.

---

## 📦 Tech Stack

- **Node.js** (v18+)
- **Express 5** (`express@^5.2.1`)
- **Multer 2** (`multer@^2.4.0`)
- **CORS** (`cors@^2.8.6`)

---

## ⚡ Quick Start

```bash
# Install dependencies
npm install

# Start the server (runs on port 5001)
npm start
```

> **Why Port 5001?** Port 5001 is explicitly configured to prevent conflicts with macOS AirPlay Receiver, which binds to port 5000 by default.

---

## 📡 Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/` | Health check and active transfer count |
| `POST` | `/api/upload` | Upload single file (multipart form field: `file`, max 25 MB) |
| `GET` | `/api/transfer/:id` | Get transfer metadata and expiration timestamp |
| `GET` | `/api/download/:id` | Stream and download original file |

---

## 🧹 Auto-Cleanup Daemon

1. **Storage Location**: Uploads are saved into `backend/uploads/` with a cryptographically unique filename prefix (`Date.now() + '-' + crypto.randomBytes(6)`).
2. **Periodic Sweep**: The sweeper runs every 15 minutes and on server startup.
3. **Expiration Logic**: Files older than 24 hours (`24 * 60 * 60 * 1000` ms) are unlinked via `fs.unlinkSync` and removed from the active transfer registry.

