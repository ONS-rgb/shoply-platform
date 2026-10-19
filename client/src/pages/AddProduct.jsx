import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createProduct } from '../services/productService';
import { CATEGORIES } from '../constants/categories';
import ImageUpload from '../components/ImageUpload';
import { colorToCss } from '../constants/colors';
import '../styles/shop.css';

export default function AddProduct() {
  const [form, setForm] = useState({
    nom: '', description: '', prix: '', stock: '',
    categorie: '', marque: '', couleurs: ''
  });
  const [uploadedImages, setUploadedImages] = useState([]);
  const [colorVariants, setColorVariants] = useState({});
  const [specs, setSpecs] = useState([{ nom: '', valeur: '' }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });
  const setSpec = (i, field, value) =>
    setSpecs(specs.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  const addSpec = () => setSpecs([...specs, { nom: '', valeur: '' }]);
  const removeSpec = (i) => setSpecs(specs.filter((_, idx) => idx !== i));

  // Liste des couleurs déduites
  const parsedColors = [
    ...new Set(form.couleurs.split(',').map((c) => c.trim()).filter(Boolean))
  ];

  const handleAddImage = (url) => {
    if (url) {
      setUploadedImages([...uploadedImages, url]);
    }
  };

  const handleRemoveImage = (index) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSetColorImage = (colorName, imageUrl) => {
    setColorVariants({
      ...colorVariants,
      [colorName]: imageUrl
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (uploadedImages.length === 0) {
      setError('Veuillez ajouter au moins une image pour le produit');
      return;
    }

    setLoading(true);
    try {
      // Préparer les variantes de couleur avec leurs images correspondantes
      const variantesCouleurs = parsedColors.map((c) => ({
        couleur: c,
        image: colorVariants[c] || uploadedImages[0]
      }));

      await createProduct({
        nom: form.nom,
        description: form.description,
        prix: Number(form.prix),
        stock: Number(form.stock),
        categorie: form.categorie,
        marque: form.marque,
        couleurs: parsedColors,
        variantesCouleurs,
        images: uploadedImages,
        caracteristiques: specs
          .map((s) => ({ nom: s.nom.trim(), valeur: s.valeur.trim() }))
          .filter((s) => s.nom && s.valeur)
      });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || "Erreur lors de l'ajout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <form className="box" onSubmit={handleSubmit} style={{ maxWidth: 800, margin: '0 auto' }}>
        <h1 style={{ textAlign: 'center' }}>Ajouter un produit au catalogue</h1>
        {error && <div className="alert error">{error}</div>}

        <div className="field">
          <label>Nom du produit *</label>
          <input value={form.nom} onChange={set('nom')} placeholder="Ex: iPhone 15 Pro" required />
        </div>

        <div className="row2">
          <div className="field">
            <label>Marque</label>
            <input value={form.marque} onChange={set('marque')} placeholder="Ex: Apple" />
          </div>
          <div className="field">
            <label>Catégorie *</label>
            <select
              value={form.categorie}
              onChange={set('categorie')}
              required
              style={{ width: '100%', padding: '11px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, background: '#fff', color: '#111' }}
            >
              <option value="">Sélectionner une catégorie</option>
              {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>

        <div className="field">
          <label>Description du produit *</label>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={4}
            required
            placeholder="Décrivez les fonctionnalités, matériaux et détails du produit..."
            style={{ width: '100%', boxSizing: 'border-box', padding: '11px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 15, background: '#fff', color: '#111', resize: 'vertical' }}
          />
        </div>

        <div className="row2">
          <div className="field">
            <label>Prix (TND) *</label>
            <input type="number" min="0" step="0.01" value={form.prix} onChange={set('prix')} required />
          </div>
          <div className="field">
            <label>Stock disponible *</label>
            <input type="number" min="0" value={form.stock} onChange={set('stock')} required />
          </div>
        </div>

        {/* ===== GESTION DES IMAGES PRODUIT (SANS EMAIL NI URL EXTERNE) ===== */}
        <div className="field" style={{ background: '#f9fafb', padding: 18, borderRadius: 10, border: '1px solid #e5e7eb' }}>
          <label style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>
            📷 Photos du produit (choisir directement depuis votre appareil)
          </label>
          <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6b7280' }}>
            Sélectionnez les photos de votre produit. La première photo sera l'image principale affichée dans le catalogue.
          </p>

          {/* Grille des photos déjà ajoutées */}
          {uploadedImages.length > 0 && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              {uploadedImages.map((img, i) => (
                <div key={i} style={{ position: 'relative', width: 100, height: 100, borderRadius: 8, overflow: 'hidden', border: i === 0 ? '2px solid #F97316' : '1px solid #d1d5db', background: '#fff' }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  {i === 0 && (
                    <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#F97316', color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}>
                      Principale
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                    style={{ position: 'absolute', top: 4, right: 4, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Sélecteur de fichier d'image */}
          <ImageUpload
            label="+ Ajouter une photo depuis l'ordinateur"
            onChange={handleAddImage}
            size={100}
          />
        </div>

        {/* ===== COULEURS ET IMAGES PAR COULEUR ===== */}
        <div className="field">
          <label>Couleurs disponibles (séparées par des virgules)</label>
          <input
            value={form.couleurs}
            onChange={set('couleurs')}
            placeholder="Ex: Noir, Blanc, Bleu, Rouge"
          />
        </div>

        {/* Si des couleurs sont définies, afficher l'association d'image par couleur */}
        {parsedColors.length > 0 && (
          <div style={{ background: '#fff7ed', padding: 18, borderRadius: 10, border: '1px solid #fed7aa', marginBottom: 18 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 15, color: '#9a3412' }}>
              🎨 Association photo par couleur
            </h3>
            <p style={{ margin: '0 0 12px', fontSize: 13, color: '#7c2d12' }}>
              Pour chaque couleur, vous pouvez associer la photo correspondante qui s'affichera automatiquement lorsque l'acheteur clique sur cette couleur :
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {parsedColors.map((c) => {
                const colorImg = colorVariants[c] || '';
                return (
                  <div key={c} style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid #d1d5db' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                      <span className="swatch" style={{ background: colorToCss(c) || '#cbd5e1' }} />
                      <strong style={{ fontSize: 14 }}>{c}</strong>
                    </div>

                    <ImageUpload
                      value={colorImg}
                      label="Photo pour cette couleur"
                      size={90}
                      onChange={(url) => handleSetColorImage(c, url)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Caractéristiques */}
        <div className="field">
          <label>Caractéristiques techniques</label>
          {specs.map((s, i) => (
            <div className="spec-row" key={i}>
              <input value={s.nom} onChange={(e) => setSpec(i, 'nom', e.target.value)} placeholder="Ex: Écran" />
              <input value={s.valeur} onChange={(e) => setSpec(i, 'valeur', e.target.value)} placeholder='Ex: 6.1 pouces' />
              <button type="button" className="link-btn" onClick={() => removeSpec(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="link-btn" onClick={addSpec}>+ Ajouter une caractéristique</button>
        </div>

        <button type="submit" className="btn-orange" disabled={loading} style={{ marginTop: 10 }}>
          {loading ? 'Publication en cours...' : 'Ajouter le produit au catalogue'}
        </button>
      </form>
    </div>
  );
}