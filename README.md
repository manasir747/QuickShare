# QuickShare 🚀

> Fast, ephemeral, self-hosted file sharing web application with automatic 24-hour expiration, real-time progress tracking, and instant QR code generation.

Built with **React 19** and **Vite** on the frontend, and **Node.js** with **Express 5** and **Multer** on the backend.

---

## 📑 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
- [API Reference](#api-reference)
- [Configuration & Environment](#configuration--environment)
- [User Workflows](#user-workflows)
- [Verification & Testing](#verification--testing)
- [Security & Sanitization](#security--sanitization)
- [License](#license)

---

## 🌟 Overview

QuickShare is designed to make one-off peer-to-peer file distribution as effortless as possible without requiring user accounts or logins. Users can drag and drop any file (up to 25 MB), monitor upload progress in real-time, and instantly receive a shareable link and scannable QR code.

All transfers expire after **24 hours**, after which the backend background cleaner securely deletes both the metadata record and physical file from disk storage.

---

## ✨ Key Features

- **Intuitive Drag-and-Drop & File Picker**: Drop files directly anywhere in the upload target or browse locally.
- **Real-Time Upload Progress**: Accurate percentage progress tracking via client-side `XMLHttpRequest` with cancellation support.
- **Instant QR Code Generation**:
  - Dynamically renders an on-screen QR code for direct smartphone camera scanning.
  - One-click button to download and save the generated QR code as a high-resolution PNG image.
- **Shareable Ephemeral Links**: Clean `/transfer/:id` URLs that can be copied with a single click.
- **Dynamic 24-Hour Expiration & Auto-Cleanup**:
  - Every upload is assigned a strict 24-hour time-to-live (`TTL`).
  - Active background daemon runs periodic sweeps (every 15 minutes and on server startup) to unlink expired and orphaned files.
- **Live Expiration Countdown**: Recipient download view shows hours, minutes, and seconds remaining before link invalidation.
- **Direct File Downloads**: Recipient downloads preserve original filenames and MIME types via HTTP Content-Disposition headers.
- **Mobile-Responsive, Accessible SaaS UI**:
  - Crisp, professional solid-color design system (no cluttered templates or glassmorphic blur).
  - Smooth transitions, clear alert banners, and dedicated error states for missing or expired files.
- **Fast Build & Modern Tooling**: Powered by Vite and Oxlint for ultra-fast hot module replacement (HMR) and lightweight bundle sizes.

---

## 📐 System Architecture

```text
 ┌──────────────────────┐                     ┌────────────────────────┐
 │   Sender / Client    │                     │   Recipient / Client   │
 │   (Browser / Mobile) │                     │   (Browser / Mobile)   │
 └──────────┬───────────┘                     └───────────▲────────────┘
            │                                             │
   POST /api/upload                              GET /api/download/:id
   (Multipart Form)                              (Direct File Stream)
            │                                             │
            ▼                                             │
 ┌────────────────────────────────────────────────────────┴────────────┐
 │                     QuickShare Express Backend                      │
 │                     (Node.js • Port 5001)                           │
 ├─────────────────────────────────────────────────────────────────────┤
 │  • Multer Disk Storage (Safe UUID/timestamp file naming)            │
 │  • In-Memory Map (Metadata, original name, size, expiry timestamp)   │
 │  • Background Sweeper (15-min interval + startup orphan scrub)       │
 └──────────────────────────────┬──────────────────────────────────────┘
                                │
                                ▼
                   ┌─────────────────────────┐
                   │   Local Disk Storage    │
                   │   (backend/uploads/)    │
                   └─────────────────────────┘
```

---

## 📁 Project Structure

```
project/
├── backend/
│   ├── uploads/               # Temporary server storage for uploaded files
│   ├── index.js               # Express API, upload handling & cleanup scheduler
│   ├── package.json           # Backend dependencies (express, multer, cors)
│   └── package-lock.json
├── frontend/
│   ├── public/                # Static icons, SVGs and favicon
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── assets/            # Static assets and graphics
│   │   ├── App.jsx            # Core layout, drag-and-drop & link generation
│   │   ├── App.css            # Responsive, solid-color SaaS design styling
│   │   ├── DownloadPage.jsx   # Recipient view, countdown timer & file retrieval
│   │   ├── QRCodeView.jsx     # Canvas QR code generator and PNG exporter
│   │   ├── index.css          # Global CSS variables and resets
│   │   └── main.jsx           # React DOM root mounting
│   ├── index.html             # Application entry point
│   ├── vite.config.js         # Vite configuration with /api reverse proxy
│   ├── package.json           # Frontend dependencies (React 19, qrcode, vite)
│   └── package-lock.json
└── README.md                  # Project documentation (this file)
```

---

## 🧰 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 19 | Declarative user interface and reactive state management |
| **Build Tool** | Vite 8 | High-performance build tool with instant HMR |
| **Styling** | Vanilla CSS | Responsive, accessible, custom design system |
| **QR Generation** | `qrcode` | Client-side QR canvas generation and export |
| **Linter** | Oxlint | High-speed JavaScript/JSX code linter |
| **Backend** | Node.js + Express 5 | REST API routing and file streaming |
| **File Handling** | Multer 2.x | Multipart/form-data upload parsing and disk storage |
| **CORS** | `cors` | Cross-Origin Resource Sharing middleware |

---

## ⚡ Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

---

### 1. Backend Setup

The backend runs on **port 5001** by default (port 5001 is chosen deliberately to avoid conflicts with macOS AirPlay Receiver on port 5000).

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the server
npm start
```

> **Endpoint:** `http://localhost:5001`  
> Verify backend health by visiting `http://localhost:5001/` in your browser.

---

### 2. Frontend Setup

In a new terminal window:

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

> **Application URL:** `http://localhost:5173`  
> The Vite development server automatically proxies requests matching `/api` to `http://localhost:5001`.

#### Other Frontend Scripts

- **Lint Code**: `npm run lint` (runs `oxlint`)
- **Production Build**: `npm run build` (outputs optimized bundle to `frontend/dist/`)
- **Preview Production Build**: `npm run preview`

---

## 📡 API Reference

### 1. Service Health Check
- **Route**: `GET /`
- **Description**: Returns server status, active transfer counts, and retention policy.
- **Response `(200 OK)`**:
  ```json
  {
    "status": "ok",
    "message": "QuickShare Backend is active",
    "activeTransfers": 2,
    "retention": "24 hours"
  }
  ```

### 2. Upload File
- **Route**: `POST /api/upload`
- **Content-Type**: `multipart/form-data`
- **Body Field**: `file` (Binary file, max 25 MB)
- **Response `(200 OK)`**:
  ```json
  {
    "success": true,
    "message": "File uploaded successfully!",
    "transferId": "4a9f1b2c",
    "expiresAt": "2026-11-09T16:00:00.000Z",
    "file": {
      "name": "project_report.pdf",
      "size": 1048576,
      "mimeType": "application/pdf"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: File exceeds 25 MB or no file attached.
  - `500 Internal Server Error`: Disk write failure.

### 3. Get Transfer Details
- **Route**: `GET /api/transfer/:id`
- **Description**: Returns metadata for a given transfer ID without downloading the file.
- **Response `(200 OK)`**:
  ```json
  {
    "success": true,
    "transfer": {
      "id": "4a9f1b2c",
      "originalName": "project_report.pdf",
      "mimeType": "application/pdf",
      "size": 1048576,
      "uploadedAt": "2026-11-08T16:00:00.000Z",
      "expiresAt": "2026-11-09T16:00:00.000Z",
      "expiresAtTimestamp": 1790697600000
    }
  }
  ```
- **Error Responses**:
  - `404 Not Found`: Transfer does not exist or has expired.

### 4. Download File
- **Route**: `GET /api/download/:id`
- **Description**: Streams the stored file with `Content-Disposition: attachment; filename="<originalName>"`.
- **Response `(200 OK)`**: File binary stream.
- **Error Responses**:
  - `404 Not Found`: Transfer expired or physical file unlinked.

---

## ⚙️ Configuration & Environment

Configuration parameters are defined in `backend/index.js` and can be customized as needed:

| Parameter | Default Value | Description |
| :--- | :--- | :--- |
| `PORT` | `5001` | Express listener port (override via `process.env.PORT`) |
| `MAX_FILE_SIZE` | `25 * 1024 * 1024` (25 MB) | Maximum permitted single upload payload |
| `EXPIRY_MS` | `24 * 60 * 60 * 1000` (24h) | Time after which a file expires and is deleted |
| `Cleanup Interval`| `15 * 60 * 1000` (15m) | Frequency of the background garbage collection sweep |

---

## 🔄 User Workflows

### Upload Workflow
1. User drops a file onto the dashed dropzone or selects one via file picker.
2. Client checks if `file.size <= 25MB`. If exceeded, immediate alert is shown and upload is prevented.
3. User clicks **Upload File**.
4. An `XMLHttpRequest` uploads the file, streaming progress percentages to the progress bar.
5. On completion, the transfer ID, link, and QR code options are presented.

### Recipient Download Workflow
1. Recipient opens the share link (`http://localhost:5173/transfer/<id>`).
2. Frontend queries `GET /api/transfer/<id>`.
3. If valid, the UI renders the file name, formatted size, and a live ticking countdown.
4. Recipient clicks **Download File**, triggering `GET /api/download/<id>` to download the original file.
5. If expired, an alert informs the recipient that the transfer is no longer active.

---

## 🧪 Verification & Testing

To test the application end-to-end:

1. **Verify Services**: Ensure backend is running on `http://localhost:5001` and frontend on `http://localhost:5173`.
2. **Test File Upload**:
   - Go to `http://localhost:5173`.
   - Select a sample file (e.g., text document or image).
   - Verify upload progress bar smoothly reaches 100%.
3. **Test Shareable Link & QR**:
   - Click **Copy Link** and verify clipboard notification.
   - Click **Show QR Code**, scan with a mobile phone or download the PNG image.
4. **Test Recipient Download**:
   - Open the copied URL in a new Incognito browser window.
   - Confirm the live countdown timer is ticking down.
   - Click **Download File** and verify that the downloaded file matches the original.
5. **Test Validation & Guardrails**:
   - Attempt to select a file larger than 25 MB — notice client rejection.
   - Navigate to `http://localhost:5173/transfer/non-existent-id` — notice graceful 404 error page.

---

## 🛡️ Security & Sanitization

- **Filename Sanitization**: Uploaded files on disk are prefixed with a cryptographic random hex and timestamp, and non-alphanumeric characters are stripped (`uniqueSuffix-safeOriginalName`).
- **MIME & Header Safety**: When downloaded, files are transmitted with the recipient's original filename via standard `Content-Disposition`.
- **Automatic Garbage Collection**: Unlinked files are scrubbed from disk so no files accumulate indefinitely.
- **Port Conflict Safeguards**: Port 5001 avoids colliding with macOS system AirPlay Receiver daemon.

---

## 📄 License

This project is licensed under the ISC License. Created for the **Prompt to Product** workshop series.
