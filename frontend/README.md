# QuickShare Frontend 💻

> Modern, lightweight React 19 web interface for QuickShare file transfers with live upload tracking, QR codes, and 24-hour expiration countdowns.

---

## 🚀 Overview

The frontend client provides a clean, responsive single-page application built on top of **React 19** and **Vite 8**. It allows users to:
1. Drag and drop or browse files (up to 25 MB).
2. Monitor transfer progress with byte-level precision via `XMLHttpRequest`.
3. Generate and export scannable QR codes.
4. Preview and download shared files with a dynamic countdown until link expiration.

---

## 🧩 Component Architecture

- [`src/App.jsx`](file:///Users/mohammednasir/B.Tech/Tech%20Club/VIbecoding/prompt-to-product/project/frontend/src/App.jsx): Main orchestrator component. Handles URL routing for `/transfer/:id`, file selection validation, upload state lifecycle (idle, uploading, success, error), and cancellation.
- [`src/DownloadPage.jsx`](file:///Users/mohammednasir/B.Tech/Tech%20Club/VIbecoding/prompt-to-product/project/frontend/src/DownloadPage.jsx): Recipient landing view. Fetches transfer metadata from `/api/transfer/:id`, displays file specifications, counts down to expiration, and triggers direct download.
- [`src/QRCodeView.jsx`](file:///Users/mohammednasir/B.Tech/Tech%20Club/VIbecoding/prompt-to-product/project/frontend/src/QRCodeView.jsx): Dynamic QR code generator using the `qrcode` library with a one-click button to download the QR code as a PNG.
- [`src/App.css`](file:///Users/mohammednasir/B.Tech/Tech%20Club/VIbecoding/prompt-to-product/project/frontend/src/App.css): Dedicated stylesheet using a solid-color, high-contrast palette (`#0f172a`, `#2563eb`, `#f8fafc`).
- [`src/index.css`](file:///Users/mohammednasir/B.Tech/Tech%20Club/VIbecoding/prompt-to-product/project/frontend/src/index.css): Base CSS reset and typography declarations.

---

## 🛠 Available Scripts

In the `frontend/` directory, you can run:

### `npm run dev`
Starts the Vite local development server at `http://localhost:5173` with instant Hot Module Replacement (HMR).

### `npm run build`
Compiles and bundles the application into production-ready static assets inside `dist/`.

### `npm run preview`
Locally previews the production build from `dist/`.

### `npm run lint`
Runs `oxlint` to scan for code issues, accessibility patterns, and potential runtime bugs.

---

## 🔌 API Proxy Configuration

The Vite dev server is configured in [`vite.config.js`](file:///Users/mohammednasir/B.Tech/Tech%20Club/VIbecoding/prompt-to-product/project/frontend/vite.config.js) to proxy `/api` calls directly to the Express backend:

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:5001',
      changeOrigin: true
    }
  }
}
```

This prevents cross-origin issues during local development while allowing relative endpoint requests.
