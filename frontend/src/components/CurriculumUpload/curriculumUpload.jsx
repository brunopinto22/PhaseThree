import React, { useState } from 'react';
import { uploadCurriculum } from '../../services/curriculum';
import './curriculumUpload.css';

const CurriculumUpload = ({ studentId, token, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    // Check if file is PDF
    if (selectedFile.type !== 'application/pdf') {
      setMessage('O ficheiro deve ser um PDF');
      setMessageType('error');
      return false;
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (selectedFile.size > maxSize) {
      setMessage('O ficheiro não pode exceder 10MB');
      setMessageType('error');
      return false;
    }

    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile);
      setMessage('');
      setMessageType('');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
      setMessage('');
      setMessageType('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage('Por favor selecione um ficheiro');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      const response = await uploadCurriculum(studentId, file, token);
      setMessage('Currículo enviado com sucesso!');
      setMessageType('success');
      setFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('curriculum-file-input');
      if (fileInput) {
        fileInput.value = '';
      }

      // Call callback to refresh parent component
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (error) {
      setMessage(error.message || 'Erro ao enviar currículo');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="curriculum-upload">
      <div className="upload-container">
        <div
          className={`drag-drop-zone ${dragActive ? 'active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="drag-drop-content">
            <i className="fas fa-cloud-upload-alt"></i>
            <p>Arraste o ficheiro aqui ou clique para selecionar</p>
            <small>PDF (máx 10MB)</small>
          </div>
          <input
            id="curriculum-file-input"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileSelect}
            className="file-input"
          />
        </div>

        {file && (
          <div className="file-selected">
            <div className="file-info">
              <i className="fas fa-file-pdf"></i>
              <div>
                <p className="file-name">{file.name}</p>
                <p className="file-size">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              className="btn-remove"
              onClick={() => {
                setFile(null);
                const fileInput = document.getElementById('curriculum-file-input');
                if (fileInput) fileInput.value = '';
              }}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {message && (
          <div className={`message message-${messageType}`}>
            <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-circle'}`}></i>
            {message}
          </div>
        )}

        <button
          className="btn-upload"
          onClick={handleUpload}
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> A enviar...
            </>
          ) : (
            <>
              <i className="fas fa-upload"></i> Enviar Currículo
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default CurriculumUpload;
