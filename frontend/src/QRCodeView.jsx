import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function QRCodeView({ url, fileName, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!url) return;
    setLoading(true);

    QRCode.toDataURL(url, {
      width: 240,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      }
    })
      .then((dataUrl) => {
        setQrDataUrl(dataUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
        setLoading(false);
      });
  }, [url]);

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `quickshare-qr-${fileName ? fileName.replace(/\.[^/.]+$/, '') : 'transfer'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="qr-container">
      <div className="qr-header">
        <div className="qr-header-left">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span className="qr-title">Scan QR Code</span>
        </div>
        {onClose && (
          <button
            type="button"
            className="qr-close-btn"
            onClick={onClose}
            aria-label="Close QR code"
          >
            ✕
          </button>
        )}
      </div>

      <div className="qr-card">
        {loading ? (
          <div className="qr-loading-placeholder">
            <div className="loading-spinner" style={{ width: 28, height: 28 }}></div>
            <span>Generating QR code...</span>
          </div>
        ) : qrDataUrl ? (
          <img
            src={qrDataUrl}
            alt="Transfer QR Code"
            className="qr-image"
          />
        ) : (
          <div className="qr-error-placeholder">Failed to render QR Code</div>
        )}
      </div>

      <p className="qr-instructions">
        Scan with your mobile camera to open and download the file instantly.
      </p>

      <button
        type="button"
        className="qr-download-btn"
        onClick={handleDownloadQr}
        disabled={!qrDataUrl}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Save QR Image
      </button>
    </div>
  );
}
