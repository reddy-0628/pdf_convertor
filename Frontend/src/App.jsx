import React, { useState } from 'react';
import axios from 'axios';
import { useDropzone } from 'react-dropzone';
import './App.css';

function FileUpload() {
  const [files, setFiles] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const allowedExtensions = ['doc', 'docx', 'ppt', 'pptx', 'vcf'];

  const onDrop = (acceptedFiles) => {
    const fileExtension = acceptedFiles[0]?.name.split('.').pop().toLowerCase();
    if (acceptedFiles.length > 5) {
      setError('You can upload up to 5 files at once.');
      setFiles([]);
    } else if (acceptedFiles.some(file => !allowedExtensions.includes(file.name.split('.').pop().toLowerCase()))) {
      setError('Invalid file type! Only .doc, .docx, .ppt, .pptx, .vcf files are allowed.');
      setFiles([]);
    } else {
      setFiles(acceptedFiles);
      setError(null);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: allowedExtensions.map(ext => `.${ext}`),
  });

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files first!');
      return;
    }

    setLoading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const response = await axios.post('http://localhost:8000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      setDownloadUrl(url);
      setLoading(false);
    } catch (error) {
      setError('File upload failed! Please try again.');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    setDownloadSuccess(true);

    setTimeout(() => {
      setFiles([]);
      setDownloadUrl(null);
      setError(null);
      setDownloadSuccess(false); 
    }, 2000); 
  };

  return (
    <div className="main-container">
      <div className="hero-section">
        <h1 className="hero-heading">Upload Your File and Convert it to PDF</h1>
        <p className="hero-description">Convert .doc, .docx, .ppt, .pptx, .vcf files into PDF effortlessly.</p>
      </div>

      <div className="file-upload-container">
        <div className="upload-card">
          <h2>Choose Your Files</h2>
          
          <div {...getRootProps()} className="dropzone-container">
            <input {...getInputProps()} className="file-input" />
            <p className="dropzone-text">Drag and drop your files here, or click to select files.</p>
          </div>

          {files.length > 0 && <p className="file-name">Selected files: {files.map(file => file.name).join(', ')}</p>}

          {error && <p className="error-message">{error}</p>}

          <button onClick={handleUpload} className="upload-btn" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload and Convert'}
          </button>

          {downloadUrl && (
            <div className="download-section">
              <p>Download your converted files:</p>
              <a
                href={downloadUrl}
                download={files.length > 1 ? 'converted_files.zip' : 'converted.pdf'}
                className="download-link"
                onClick={handleDownload}
              >
                Download {files.length > 1 ? 'ZIP' : 'PDF'}
              </a>
            </div>
          )}

          {downloadSuccess && <p className="success-message">Download successful!</p>}
        </div>
      </div>
    </div>
  );
}

export default FileUpload;
