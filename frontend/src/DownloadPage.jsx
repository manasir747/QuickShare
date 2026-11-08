import React, { useState, useEffect } from 'react';
import QRCodeView from './QRCodeView';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001' : '');

export default function DownloadPage({ transferId, onGoHome }) {
  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState(null);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState('');
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    if (!transferId) {
      setError('No transfer ID was specified.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    fetch(`${API_BASE}/api/transfer/${encodeURIComponent(transferId)}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'This transfer does not exist, has expired, or was removed.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.success && data.transfer) {
          setTransfer(data.transfer);
        } else {
          throw new Error('Unable to retrieve file transfer details.');
        }
      })
      .catch((err) => {
        setError(err.message || 'File is unavailable or the link is invalid.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [transferId]);

  // Calculate remaining time until 24-hour expiry
  useEffect(() => {
    if (!transfer?.expiresAt) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(transfer.expiresAt).getTime();
      const diffMs = expires - now;

      if (diffMs <= 0) {
        setTimeLeft('Expired');
        setError('This file transfer has reached its 24-hour limit and expired.');
        setTransfer(null);
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeLeft(`${minutes}m remaining`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [transfer]);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_) {
      return '';
    }
  };

  const handleDownload = () => {
    if (!transferId) return;
    window.location.href = `${API_BASE}/api/download/${encodeURIComponent(transferId)}`;
  };

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="card download-card">
      {loading ? (
        <div className="download-state-box">
          <div className="loading-spinner"></div>
          <h2 className="title" style={{ fontSize: '1.25rem' }}>Fetching transfer details...</h2>
          <p className="subtitle">Looking up your file on QuickShare.</p>
        </div>
      ) : error ? (
        <div className="download-state-box">
          <div className="error-badge-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 className="title" style={{ fontSize: '1.35rem' }}>Transfer Unavailable</h2>
          <p className="subtitle">{error}</p>
          <div className="error-hint-box">
            <span>Transfers expire automatically after 24 hours. Please double-check the link or ask the sender to upload the file again.</span>
          </div>
          <button
            type="button"
            className="action-btn-primary"
            onClick={onGoHome}
          >
            Upload a File Instead
          </button>
        </div>
      ) : (
        <div className="download-state-box">
          <div className="download-ready-badge">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="12" y2="18"></line>
              <line x1="15" y1="15" x2="12" y2="18"></line>
            </svg>
          </div>

          <div className="card-header" style={{ textAlign: 'center' }}>
            <h1 className="title" style={{ fontSize: '1.4rem' }}>Ready to Download</h1>
            <p className="subtitle">
              Direct transfer ready from QuickShare.
            </p>
          </div>

          <div className="download-file-card">
            <div className="download-file-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
            </div>
            <div className="download-file-info">
              <span className="file-name" title={transfer.originalName}>{transfer.originalName}</span>
              <div className="download-file-meta-row">
                <span className="file-size">{formatFileSize(transfer.size)}</span>
                {transfer.uploadedAt && (
                  <>
                    <span className="meta-separator">•</span>
                    <span className="meta-date">{formatDate(transfer.uploadedAt)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {timeLeft && (
            <div className="expiry-banner">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Expires in {timeLeft} (24-hour limit)</span>
            </div>
          )}

          <div className="download-actions-group">
            <button
              type="button"
              className="action-btn-primary"
              id="download-file-btn"
              onClick={handleDownload}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download File
            </button>

            <button
              type="button"
              className={`qr-secondary-btn ${showQr ? 'active' : ''}`}
              id="show-qr-recipient-btn"
              onClick={() => setShowQr(!showQr)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              {showQr ? 'Hide QR Code' : 'Scan on Mobile (QR)'}
            </button>
          </div>

          {showQr && (
            <QRCodeView
              url={currentUrl}
              fileName={transfer.originalName}
              onClose={() => setShowQr(false)}
            />
          )}

          <button
            type="button"
            className="secondary-link-btn"
            onClick={onGoHome}
          >
            Need to send a file? Go to QuickShare upload
          </button>
        </div>
      )}
    </div>
  );
}
