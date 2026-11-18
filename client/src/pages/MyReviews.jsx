import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import StarRating from '../components/StarRating';
import { PLACEHOLDER } from '../components/ProductCard';
import '../styles/shop.css';

export default function MyReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [editForm, setEditForm] = useState({ note: 5, titre: '', commentaire: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState({ type: '', text: '' });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast({ type: '', text: '' }), 4000);
  };

  const loadMyReviews = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/reviews/my');
      setReviews(data.data || []);
    } catch {
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyReviews();
  }, []);

  const handleOpenEdit = (rev) => {
    setEditingReview(rev);
    setEditForm({
      note: rev.note || 5,
      titre: rev.titre || '',
      commentaire: rev.commentaire || ''
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.put(`/reviews/${editingReview._id}`, editForm);
      showToast('ok', 'Avis modifié avec succès ✅');
      setEditingReview(null);
      loadMyReviews();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors de la modification');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet avis ?')) return;
    try {
      await api.delete(`/reviews/${id}`);
      showToast('ok', 'Avis supprimé avec succès ✅');
      loadMyReviews();
    } catch (err) {
      showToast('error', err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  return (
    <div className="page" style={{ background: '#EAEDED', minHeight: '85vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div className="crumbs" style={{ margin: '0 0 6px' }}>
              <Link to="/dashboard">‹ Mon Espace Client</Link>
            </div>
            <h1 style={{ fontSize: 26, margin: 0, color: '#0F172A' }}>
              ⭐ Mes Avis et Évaluations
            </h1>
          </div>
          <Link to="/orders" className="link-btn" style={{ fontWeight: 600, fontSize: 14 }}>
            📦 Évaluer un autre article acheté ›
          </Link>
        </div>

        {toast.text && <div className={`alert ${toast.type}`}>{toast.text}</div>}

        {loading ? (
          <div className="box"><p className="muted">Chargement de vos avis...</p></div>
        ) : reviews.length === 0 ? (
          <div className="box empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>⭐</span>
            <h3 style={{ margin: '0 0 8px' }}>Vous n'avez pas encore publié d'avis</h3>
            <p className="muted" style={{ margin: '0 0 20px' }}>
              Partagez votre expérience sur les produits que vous avez achetés pour aider les autres clients.
            </p>
            <Link to="/orders" className="btn-orange" style={{ width: 'auto', display: 'inline-block', padding: '10px 24px' }}>
              Consulter mes commandes
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {reviews.map((rev) => {
              const prod = rev.produit || {};
              const img = prod.images?.[0] || PLACEHOLDER;

              return (
                <div key={rev._id} className="box" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'start', flexWrap: 'wrap' }}>
                    <Link to={`/product/${prod._id}`}>
                      <img
                        src={img}
                        alt={prod.nom}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'contain',
                          background: '#f8fafc',
                          borderRadius: 8,
                          border: '1px solid #e2e8f0'
                        }}
                      />
                    </Link>

                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <Link to={`/product/${prod._id}`} className="plain" style={{ fontWeight: 700, fontSize: 16 }}>
                            {prod.nom || 'Produit'}
                          </Link>
                          {prod.prix && (
                            <span style={{ marginLeft: 10, color: '#64748b', fontSize: 14 }}>
                              {Number(prod.prix).toFixed(2)} TND
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: 10 }}>
                          <button
                            type="button"
                            className="link-btn"
                            style={{ fontSize: 13, fontWeight: 600 }}
                            onClick={() => handleOpenEdit(rev)}
                          >
                            ✏️ Modifier
                          </button>
                          <span style={{ color: '#d1d5db' }}>|</span>
                          <button
                            type="button"
                            className="link-btn"
                            style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}
                            onClick={() => handleDelete(rev._id)}
                          >
                            🗑️ Supprimer
                          </button>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0' }}>
                        <StarRating rating={rev.note} size={18} />
                        {rev.titre && <strong style={{ fontSize: 14, color: '#0F172A' }}>{rev.titre}</strong>}
                        {rev.achatVerifie && (
                          <span style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: 11, padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                            ✓ Achat vérifié
                          </span>
                        )}
                      </div>

                      <p style={{ margin: '6px 0 0', fontSize: 14, color: '#334155', lineHeight: 1.5, background: '#f8fafc', padding: 12, borderRadius: 8 }}>
                        « {rev.commentaire} »
                      </p>

                      <span style={{ fontSize: 12, color: '#94a3b8', display: 'block', marginTop: 8 }}>
                        Publié le {new Date(rev.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>

                      {/* Réponse du vendeur si existante */}
                      {rev.reponseVendeur?.texte && (
                        <div style={{ marginTop: 12, background: '#fffbeb', border: '1px solid #fef3c7', padding: '12px 14px', borderRadius: 8, fontSize: 13 }}>
                          <strong style={{ color: '#b45309', display: 'block', marginBottom: 4 }}>
                            🏪 Réponse du vendeur :
                          </strong>
                          <span style={{ color: '#78350f' }}>{rev.reponseVendeur.texte}</span>
                          {rev.reponseVendeur.dateReponse && (
                            <span style={{ display: 'block', fontSize: 11, color: '#92400e', marginTop: 4 }}>
                              Le {new Date(rev.reponseVendeur.dateReponse).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODAL DE MODIFICATION D'AVIS */}
        {editingReview && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <form onSubmit={handleSaveEdit} className="box" style={{ maxWidth: 500, width: '100%' }}>
              <h3 style={{ marginTop: 0 }}>Modifier votre évaluation</h3>
              <p style={{ fontSize: 14, color: '#64748b' }}>
                Produit : <strong>{editingReview.produit?.nom}</strong>
              </p>

              <div className="field">
                <label>Note attribuée *</label>
                <StarRating
                  rating={editForm.note}
                  interactive
                  size={26}
                  onChange={(val) => setEditForm({ ...editForm, note: val })}
                />
              </div>

              <div className="field">
                <label>Titre de votre avis</label>
                <input
                  placeholder="Ex: Excellent produit, très satisfait"
                  value={editForm.titre}
                  onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })}
                />
              </div>

              <div className="field">
                <label>Commentaire détaillé *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Partagez votre avis sur ce produit..."
                  value={editForm.commentaire}
                  onChange={(e) => setEditForm({ ...editForm, commentaire: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button
                  type="button"
                  className="btn-outline"
                  style={{ width: 'auto', marginTop: 0 }}
                  onClick={() => setEditingReview(null)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="btn-orange"
                  style={{ width: 'auto' }}
                >
                  {actionLoading ? 'Enregistrement...' : 'Mettre à jour'}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
}
