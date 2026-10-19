import { useState, useRef } from 'react';
import api from '../services/api';

export default function ImageUpload({
  value = '',
  onChange = () => {},
  label = 'Téléverser une image',
  circle = false,
  size = 140
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner un fichier image valide (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setError('L\'image dépasse la taille maximale autorisée (8 Mo)');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result;
        try {
          // Téléverser sur le serveur
          const { data } = await api.post('/upload', { image: base64Data });
          if (data?.url) {
            onChange(data.url);
          } else {
            onChange(base64Data);
          }
        } catch {
          // En cas de problème réseau, utiliser directement la donnée locale
          onChange(base64Data);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => {
        setError('Erreur lors de la lecture du fichier');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Une erreur est survenue lors de la sélection');
      setLoading(false);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    onChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  return (
    <div style={{ marginBottom: 16 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' }}>{label}</label>}

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      <div
        onClick={handleClick}
        style={{
          width: circle ? size : '100%',
          maxWidth: circle ? size : 320,
          height: size,
          borderRadius: circle ? '50%' : 10,
          border: '2px dashed #d1d5db',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f9fafb',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 0.2s',
          margin: circle ? '0 auto' : '0'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#F97316')}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#d1d5db')}
        title="Cliquez pour choisir une photo depuis votre appareil"
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Aperçu"
              style={{
                width: '100%',
                height: '100%',
                objectFit: circle ? 'cover' : 'contain',
                background: '#fff'
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                opacity: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 600,
                transition: 'opacity 0.2s'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
            >
              Changer l'image
            </div>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                position: 'absolute',
                top: 6,
                right: 6,
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: 24,
                height: 24,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
              title="Supprimer cette image"
            >
              ✕
            </button>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 12 }}>
            <span style={{ fontSize: 28, display: 'block', marginBottom: 6 }}>
              {circle ? '👤' : '📷'}
            </span>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#4b5563' }}>
              {loading ? 'Téléversement...' : 'Choisir une photo'}
            </span>
            <span style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginTop: 2 }}>
              JPG, PNG, WebP
            </span>
          </div>
        )}
      </div>

      {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{error}</p>}
    </div>
  );
}
