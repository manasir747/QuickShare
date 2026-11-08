const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 5001;
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

app.use(cors());
app.use(express.json());

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// In-memory store for transfer metadata
const transfers = new Map();

// Helper to remove an individual transfer and its file
function removeTransfer(id) {
  const transfer = transfers.get(id);
  if (transfer) {
    const filePath = path.join(uploadDir, transfer.filename);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete file for transfer ${id}:`, err);
      }
    }
    transfers.delete(id);
  }
}

// Periodic cleanup for expired files (runs every 15 minutes and at startup)
function cleanExpiredFiles() {
  const now = Date.now();
  let cleanedCount = 0;

  // 1. Remove expired tracked transfers
  for (const [id, transfer] of transfers.entries()) {
    if (now > transfer.expiresAtTimestamp) {
      removeTransfer(id);
      cleanedCount++;
    }
  }

  // 2. Remove orphaned files in uploads directory older than 24 hours
  try {
    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
      const filePath = path.join(uploadDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (now - stats.mtimeMs > EXPIRY_MS) {
          fs.unlinkSync(filePath);
          cleanedCount++;
        }
      } catch (_) {}
    }
  } catch (err) {
    console.error('Error scanning upload directory for cleanup:', err);
  }

  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired file(s) and transfer(s).`);
  }
}

// Initial scan and setup periodic interval
cleanExpiredFiles();
setInterval(cleanExpiredFiles, 15 * 60 * 1000);

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeOriginalName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'QuickShare Backend is active',
    activeTransfers: transfers.size,
    retention: '24 hours'
  });
});

// Single file upload endpoint
app.post('/api/upload', (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: 'File size exceeds the 25 MB limit for this demo.'
        });
      }
      return res.status(400).json({
        error: `Upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(500).json({
        error: `Server error during upload: ${err.message}`
      });
    }

    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded. Please select a file to transfer.'
      });
    }

    const now = Date.now();
    const expiresAt = now + EXPIRY_MS;
    const transferId = crypto.randomUUID().slice(0, 8);

    const transferData = {
      id: transferId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      filename: req.file.filename,
      uploadedAt: new Date(now).toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      expiresAtTimestamp: expiresAt
    };

    transfers.set(transferId, transferData);

    return res.status(200).json({
      success: true,
      message: 'File uploaded successfully!',
      transferId: transferId,
      expiresAt: transferData.expiresAt,
      file: {
        name: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  });
});

// Transfer retrieval endpoint
app.get('/api/transfer/:id', (req, res) => {
  const transfer = transfers.get(req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'Transfer not found or expired.' });
  }

  // Check 24-hour expiry
  if (Date.now() > transfer.expiresAtTimestamp) {
    removeTransfer(req.params.id);
    return res.status(404).json({ error: 'This file transfer has expired (24-hour limit).' });
  }

  const filePath = path.join(uploadDir, transfer.filename);
  if (!fs.existsSync(filePath)) {
    transfers.delete(req.params.id);
    return res.status(404).json({ error: 'File is no longer available on the server.' });
  }

  res.json({ success: true, transfer });
});

// File download endpoint
app.get('/api/download/:id', (req, res) => {
  const transfer = transfers.get(req.params.id);
  if (!transfer) {
    return res.status(404).json({ error: 'File transfer not found or expired.' });
  }

  // Check 24-hour expiry
  if (Date.now() > transfer.expiresAtTimestamp) {
    removeTransfer(req.params.id);
    return res.status(404).json({ error: 'This file transfer has expired (24-hour limit).' });
  }

  const filePath = path.join(uploadDir, transfer.filename);
  if (!fs.existsSync(filePath)) {
    transfers.delete(req.params.id);
    return res.status(404).json({ error: 'File no longer exists on server.' });
  }

  res.download(filePath, transfer.originalName);
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
