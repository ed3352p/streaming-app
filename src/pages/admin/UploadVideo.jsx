import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function UploadVideo() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadId, setUploadId] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith('video/')) {
        setError('Veuillez sélectionner un fichier vidéo');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const uploadChunkedFile = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);
    setProgress(0);

    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
      
      const { uploadId: newUploadId } = await api.initUpload(
        file.name,
        totalChunks,
        file.size
      );
      setUploadId(newUploadId);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, file.size);
        const chunk = file.slice(start, end);

        await api.uploadChunk(newUploadId, i, chunk);
        setProgress(((i + 1) / totalChunks) * 100);
      }

      const finalizeResult = await api.finalizeUpload(newUploadId);
      
      setUploading(false);
      setProcessing(true);

      const baseName = file.name.replace(/\.[^/.]+$/, '');
      const processResult = await api.processVideo(finalizeResult.path, baseName);
      
      setResult(processResult);
      setProcessing(false);
      setProgress(100);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Erreur lors de l\'upload');
      setUploading(false);
      setProcessing(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{minHeight: '100vh', background: '#0f172a'}}>
      <div style={{
        background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95))',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        padding: '20px'
      }}>
        <div style={{maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <button onClick={() => navigate('/admin')} style={{background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer'}}>
              <ArrowLeft size={24} />
            </button>
            <h1 style={{fontSize: '24px', display: 'flex', alignItems: 'center', gap: '10px'}}>
              <Upload style={{color: '#3b82f6'}} />
              Upload Vidéo
            </h1>
          </div>
          <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
            <span style={{color: '#94a3b8'}}>{user?.email}</span>
            <button onClick={handleLogout} className="btn" style={{background: '#ef4444'}}>Déconnexion</button>
          </div>
        </div>
      </div>

      <div style={{maxWidth: '800px', margin: '0 auto', padding: '30px 20px'}}>
        <div style={{
          background: 'linear-gradient(145deg, #1e293b, #0f172a)',
          padding: '30px',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{marginBottom: '20px'}}>Upload et Encodage Automatique</h2>
          <p style={{color: '#94a3b8', marginBottom: '30px'}}>
            Uploadez une vidéo pour l'encoder automatiquement en plusieurs résolutions (360p, 480p, 720p, 1080p) 
            et générer des thumbnails.
          </p>

          {!file && !result && (
            <div style={{
              border: '2px dashed rgba(255,255,255,0.2)',
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = '#3b82f6';
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
              const droppedFile = e.dataTransfer.files[0];
              if (droppedFile) {
                setFile(droppedFile);
              }
            }}>
              <Upload size={64} style={{color: '#64748b', margin: '0 auto 20px'}} />
              <p style={{color: '#cbd5e1', fontSize: '18px', marginBottom: '10px'}}>
                Glissez-déposez votre vidéo ici
              </p>
              <p style={{color: '#64748b', marginBottom: '20px'}}>ou</p>
              <label className="btn" style={{cursor: 'pointer'}}>
                Sélectionner un fichier
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileSelect}
                  style={{display: 'none'}}
                />
              </label>
            </div>
          )}

          {file && !result && (
            <div>
              <div style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h3 style={{marginBottom: '10px'}}>Fichier sélectionné</h3>
                <p style={{color: '#94a3b8'}}>
                  <strong>Nom:</strong> {file.name}
                </p>
                <p style={{color: '#94a3b8'}}>
                  <strong>Taille:</strong> {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>

              {(uploading || processing) && (
                <div style={{marginBottom: '20px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '10px'}}>
                    <span style={{color: '#94a3b8'}}>
                      {uploading ? 'Upload en cours...' : 'Encodage en cours...'}
                    </span>
                    <span style={{color: '#3b82f6', fontWeight: '600'}}>
                      {Math.round(progress)}%
                    </span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
                      width: `${progress}%`,
                      transition: 'width 0.3s'
                    }} />
                  </div>
                  {processing && (
                    <p style={{color: '#64748b', fontSize: '12px', marginTop: '10px'}}>
                      L'encodage peut prendre plusieurs minutes selon la taille de la vidéo...
                    </p>
                  )}
                </div>
              )}

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  padding: '15px',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  <AlertCircle size={20} style={{color: '#ef4444'}} />
                  <span style={{color: '#ef4444'}}>{error}</span>
                </div>
              )}

              {!uploading && !processing && !error && (
                <div style={{display: 'flex', gap: '10px'}}>
                  <button
                    onClick={uploadChunkedFile}
                    className="btn"
                    style={{flex: 1}}
                  >
                    Commencer l'upload
                  </button>
                  <button
                    onClick={() => {
                      setFile(null);
                      setError(null);
                    }}
                    className="btn"
                    style={{background: '#64748b'}}
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>
          )}

          {result && (
            <div>
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid #22c55e',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <CheckCircle size={24} style={{color: '#22c55e'}} />
                <div>
                  <h3 style={{color: '#22c55e', marginBottom: '5px'}}>Upload et encodage réussis!</h3>
                  <p style={{color: '#94a3b8', fontSize: '14px'}}>
                    La vidéo a été encodée en {result.encoded?.length || 0} résolutions
                  </p>
                </div>
              </div>

              <div style={{marginBottom: '20px'}}>
                <h3 style={{marginBottom: '15px'}}>Résolutions disponibles:</h3>
                {result.encoded?.map((encoded, index) => (
                  <div key={index} style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '10px 15px',
                    borderRadius: '8px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span style={{color: '#cbd5e1'}}>{encoded.resolution}</span>
                    <code style={{
                      background: 'rgba(0,0,0,0.3)',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      color: '#3b82f6'
                    }}>
                      {encoded.url}
                    </code>
                  </div>
                ))}
              </div>

              <div style={{marginBottom: '20px'}}>
                <h3 style={{marginBottom: '15px'}}>Thumbnails générés:</h3>
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                  {result.thumbnails?.map((thumb, index) => (
                    <img
                      key={index}
                      src={thumb.url}
                      alt={`Thumbnail ${index + 1}`}
                      style={{
                        width: '150px',
                        height: '85px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.1)'
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={() => {
                  setFile(null);
                  setResult(null);
                  setProgress(0);
                }}
                className="btn"
                style={{width: '100%'}}
              >
                Uploader une autre vidéo
              </button>
            </div>
          )}
        </div>

        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid #3b82f6',
          padding: '20px',
          borderRadius: '12px',
          marginTop: '20px'
        }}>
          <h3 style={{color: '#3b82f6', marginBottom: '10px'}}>ℹ️ Informations</h3>
          <ul style={{color: '#94a3b8', fontSize: '14px', lineHeight: '1.8'}}>
            <li>L'upload utilise un système de chunks pour les gros fichiers</li>
            <li>L'encodage génère automatiquement 4 résolutions (360p, 480p, 720p, 1080p)</li>
            <li>5 thumbnails sont générés automatiquement</li>
            <li>Formats supportés: MP4, AVI, MOV, MKV, WebM</li>
            <li>Taille maximale: 10 GB par fichier</li>
            <li><strong>Note:</strong> FFmpeg doit être installé sur le serveur</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
