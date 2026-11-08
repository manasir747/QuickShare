import React, { useState, useRef, useEffect } from 'react';
import DownloadPage from './DownloadPage';
import QRCodeView from './QRCodeView';
import './App.css';

const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5001' : '');
const API_URL = `${API_BASE_URL}/api/upload`;

function parseTransferIdFromUrl() {
  const path = window.location.pathname;
  const match = path.match(/^\/(?:transfer|download)\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return match[1];
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('transfer') || params.get('id') || null;
}

function App() {
  const [activeTransferId, setActiveTransferId] = useState(parseTransferIdFromUrl());

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'success' | 'error'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [transferResult, setTransferResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTransferId(parseTransferIdFromUrl());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToHome = () => {
    window.history.pushState({}, '', '/');
    setActiveTransferId(null);
  };

  const navigateToTransfer = (id) => {
    window.history.pushState({}, '', `/transfer/${id}`);
    setActiveTransferId(id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (uploadStatus === 'uploading') return;
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateAndSetFile = (selectedFile) => {
    setErrorMessage('');
    if (!selectedFile) return;

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(`File exceeds 25 MB (${formatFileSize(selectedFile.size)}). Please choose a smaller file.`);
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFile(selectedFile);
    setUploadStatus('idle');
    setTransferResult(null);
    setUploadProgress(0);
    setShowQr(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (uploadStatus === 'uploading') return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = (e) => {
    if (e) e.stopPropagation();
    if (uploadStatus === 'uploading') return;
    setFile(null);
    setErrorMessage('');
    setUploadProgress(0);
    setUploadStatus('idle');
    setShowQr(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (!file || uploadStatus === 'uploading') return;

    setErrorMessage('');
    setUploadStatus('uploading');
    setUploadProgress(0);
    setShowQr(false);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          setTransferResult(response);
          setUploadStatus('success');
          setUploadProgress(100);
        } catch (err) {
          setErrorMessage('Failed to parse server response.');
          setUploadStatus('error');
        }
      } else {
        let errorText = 'Upload failed. Please try again.';
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error) errorText = errRes.error;
        } catch (_) {}
        setErrorMessage(errorText);
        setUploadStatus('error');
      }
    };

    xhr.onerror = () => {
      setErrorMessage('Network error: Unable to reach backend server on port 5001.');
      setUploadStatus('error');
    };

    xhr.ontimeout = () => {
      setErrorMessage('Upload timed out. Please check your network and try again.');
      setUploadStatus('error');
    };

    xhr.open('POST', API_URL, true);
    xhr.send(formData);
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('Upload was cancelled.');
  };

  const getShareableLink = (id) => {
    return `${window.location.origin}/transfer/${id}`;
  };

  const handleCopyLink = () => {
    if (!transferResult?.transferId) return;
    const link = getShareableLink(transferResult.transferId);
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleReset = () => {
    handleRemoveFile();
    setTransferResult(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setErrorMessage('');
    setShowQr(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="layout">
      {/* Global Navbar */}
      <header className="navbar">
        <div className="nav-container">
          <button
            type="button"
            className="brand-btn"
            onClick={navigateToHome}
            title="Go to QuickShare home"
          >
            <span className="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7"></path>
                <polyline points="16 6 12 2 8 6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </span>
            <span className="brand-name">QuickShare</span>
          </button>

          <div className="nav-actions">
            {activeTransferId ? (
              <button
                type="button"
                className="nav-action-btn"
                onClick={navigateToHome}
              >
                + Send Files
              </button>
            ) : (
              <span className="badge">24h Auto-Expiry</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTransferId ? (
          /* Receiver / Download Page */
          <DownloadPage
            transferId={activeTransferId}
            onGoHome={navigateToHome}
          />
        ) : (
          /* Sender / Upload Page */
          <div className="card">
            <div className="card-header">
              <h1 className="title">Upload & Share Files</h1>
              <p className="subtitle">
                Fast, simple file transfer with automatic 24-hour expiration and QR sharing.
              </p>
            </div>

            {/* Error Message banner */}
            {errorMessage && (
              <div className="alert alert-error" role="alert">
                <div className="alert-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                  </svg>
                </div>
                <div className="alert-content">
                  <span className="alert-title">Notice</span>
                  <span className="alert-message">{errorMessage}</span>
                </div>
                <button
                  type="button"
                  className="alert-close"
                  onClick={() => setErrorMessage('')}
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Success State */}
            {uploadStatus === 'success' && transferResult ? (
              <div className="success-container">
                <div className="success-badge-icon">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                <h2 className="success-title">File Ready to Share</h2>
                <p className="success-subtitle">
                  Anyone with this link or QR code can download the file. Automatically expires in 24 hours.
                </p>

                {/* Expiry Pill */}
                <div className="expiry-pill">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Link active for 24 hours</span>
                </div>

                {/* Shareable Link Box */}
                <div className="share-link-section">
                  <label className="share-link-label">Shareable Link</label>
                  <div className="share-link-input-group">
                    <input
                      type="text"
                      readOnly
                      value={getShareableLink(transferResult.transferId)}
                      className="share-link-input"
                      id="share-link-input"
                      onFocus={(e) => e.target.select()}
                    />
                    <button
                      type="button"
                      className={`copy-link-btn ${copiedLink ? 'copied' : ''}`}
                      id="copy-link-btn"
                      onClick={handleCopyLink}
                    >
                      {copiedLink ? (
                        <>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Copy Link
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className={`qr-toggle-btn ${showQr ? 'active' : ''}`}
                      id="toggle-qr-btn"
                      onClick={() => setShowQr(!showQr)}
                      title={showQr ? 'Hide QR Code' : 'Show QR Code'}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      {showQr ? 'Hide QR' : 'QR Code'}
                    </button>
                  </div>
                </div>

                {/* QR Code Expansion */}
                {showQr && (
                  <QRCodeView
                    url={getShareableLink(transferResult.transferId)}
                    fileName={transferResult.file?.name}
                    onClose={() => setShowQr(false)}
                  />
                )}

                {/* Transferred File Details */}
                <div className="transferred-file-details">
                  <div className="file-meta">
                    <div className="file-type-icon">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                      </svg>
                    </div>
                    <div className="file-info-text">
                      <span className="file-name" title={transferResult.file?.name}>{transferResult.file?.name}</span>
                      <span className="file-size">{formatFileSize(transferResult.file?.size)}</span>
                    </div>
                  </div>
                  <span className="transfer-id-tag">ID: {transferResult.transferId}</span>
                </div>

                {/* Primary Actions */}
                <div className="success-actions">
                  <button
                    type="button"
                    className="view-page-btn"
                    id="open-download-page-btn"
                    onClick={() => navigateToTransfer(transferResult.transferId)}
                  >
                    Open Download Page
                  </button>
                  <button
                    type="button"
                    className="reset-btn"
                    id="send-another-file-btn"
                    onClick={handleReset}
                  >
                    Send Another File
                  </button>
                </div>
              </div>
            ) : (
              /* Dropzone and File Selection */
              <>
                <div
                  className={`dropzone ${isDragging ? 'dropzone-active' : ''} ${uploadStatus === 'uploading' ? 'dropzone-disabled' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  id="dropzone"
                  onClick={() => {
                    if (uploadStatus !== 'uploading') {
                      fileInputRef.current?.click();
                    }
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    id="file-input"
                    onChange={handleFileChange}
                    className="file-input-hidden"
                    disabled={uploadStatus === 'uploading'}
                  />

                  <div className="dropzone-icon">
                    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="17 8 12 3 7 8"></polyline>
                      <line x1="12" y1="3" x2="12" y2="15"></line>
                    </svg>
                  </div>

                  <div className="dropzone-text">
                    <p className="primary-text">Drag and drop a file here</p>
                    <p className="secondary-text">or click to browse from device (up to 25 MB)</p>
                  </div>

                  <button
                    type="button"
                    className="choose-btn"
                    id="choose-file-btn"
                    disabled={uploadStatus === 'uploading'}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (uploadStatus !== 'uploading') {
                        fileInputRef.current?.click();
                      }
                    }}
                  >
                    Choose File
                  </button>
                </div>

                {/* Selected File Details */}
                {file && (
                  <div className="selected-file-card" id="selected-file-card">
                    <div className="file-meta">
                      <div className="file-type-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                          <polyline points="14 2 14 8 20 8"></polyline>
                        </svg>
                      </div>
                      <div className="file-info-text">
                        <span className="file-name" title={file.name}>{file.name}</span>
                        <span className="file-size">{formatFileSize(file.size)}</span>
                      </div>
                    </div>
                    {uploadStatus !== 'uploading' && (
                      <button
                        type="button"
                        className="remove-btn"
                        id="remove-file-btn"
                        onClick={handleRemoveFile}
                        title="Remove selected file"
                        aria-label="Remove selected file"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="18" y1="6" x2="6" y2="18"></line>
                          <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                      </button>
                    )}
                  </div>
                )}

                {/* Upload Progress Bar */}
                {uploadStatus === 'uploading' && (
                  <div className="progress-section" id="progress-section">
                    <div className="progress-header">
                      <span className="progress-label">Uploading to QuickShare...</span>
                      <span className="progress-percent">{uploadProgress}%</span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <button
                      type="button"
                      className="cancel-btn"
                      id="cancel-upload-btn"
                      onClick={handleCancelUpload}
                    >
                      Cancel Upload
                    </button>
                  </div>
                )}

                {/* Upload Action Button */}
                {uploadStatus !== 'uploading' && (
                  <div className="action-row">
                    <button
                      type="button"
                      className={`upload-btn ${!file ? 'disabled' : ''}`}
                      id="upload-file-btn"
                      onClick={handleUpload}
                      disabled={!file}
                    >
                      {file ? 'Upload File' : 'Select a File to Upload'}
                    </button>
                  </div>
                )}

                <div className="security-notice">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>24-hour auto-deletion • Max 25 MB • Direct link & QR sharing</span>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
