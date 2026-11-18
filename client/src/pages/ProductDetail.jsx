import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { PLACEHOLDER } from '../components/ProductCard';
import { colorToCss } from '../constants/colors';
import StarRating from '../components/StarRating';
import '../styles/shop.css';

export default function ProductDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState('');
  const [imgIndex, setImgIndex] = useState(0);
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Avis & Évaluations
  const [reviewsData, setReviewsData] = useState({ reviews: [], total: 0, average: 0, distribution: {} });
  const [reviewForm, setReviewForm] = useState({ note: 5, titre: '', commentaire: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewMsg, setReviewMsg] = useState({ type: '', text: '' });
  const [editingReviewId, setEditingReviewId] = useState(null);

  const loadReviews = async (productId) => {
    try {
      const { data } = await api.get(`/reviews/product/${productId}`);
      if (data.success) {
        setReviewsData(data.data);
      }
    } catch {
      // silencieux
    }
  };

  // Charger le produit et ses avis
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setMsg({ type: '', text: '' });
      setImgIndex(0);
      setQty(1);
      try {
        const { data } = await api.get(`/products/${id}`);
        const p = data.data;
        setProduct(p);

        // Couleur initiale (depuis URL ou unique)
        const initialColor = searchParams.get('couleur') || (p.couleurs?.length === 1 ? p.couleurs[0] : '');
        setColor(initialColor);

        // Déterminer l'image initiale
        const validImages = (p.images || []).filter((u) => u && (u.startsWith('http') || u.startsWith('/') || u.startsWith('data:')));
        let initialImage = validImages[0] || PLACEHOLDER;

        if (initialColor) {
          const variant = p.variantesCouleurs?.find(
            (v) => v.couleur?.trim().toLowerCase() === initialColor.trim().toLowerCase()
          );
          if (variant && variant.image) {
            initialImage = variant.image;
          }
        }
        setSelectedImage(initialImage);

        // Charger les avis
        loadReviews(p._id);
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, searchParams]);

  // Basculer dynamiquement l'image lors du choix d'une couleur
  const handleColorChange = (c) => {
    setColor(c);
    setMsg({ type: '', text: '' });

    if (!product) return;

    // 1. Chercher dans les variantes de couleur spécifiques
    if (product.variantesCouleurs && product.variantesCouleurs.length > 0) {
      const variant = product.variantesCouleurs.find(
        (v) => v.couleur?.trim().toLowerCase() === c.trim().toLowerCase()
      );
      if (variant && variant.image) {
        setSelectedImage(variant.image);
        return;
      }
    }

    // 2. Si non trouvé dans les variantes, chercher par index correspondant dans les images
    const validImages = (product.images || []).filter((u) => u && (u.startsWith('http') || u.startsWith('/') || u.startsWith('data:')));
    const colorIdx = product.couleurs?.findIndex(
      (col) => col.trim().toLowerCase() === c.trim().toLowerCase()
    );

    if (colorIdx !== -1 && validImages[colorIdx]) {
      setSelectedImage(validImages[colorIdx]);
      setImgIndex(colorIdx);
    }
  };

  const handleThumbnailClick = (src, idx) => {
    setSelectedImage(src);
    setImgIndex(idx);
  };

  if (loading) return <div className="page"><p className="muted">Chargement du produit...</p></div>;

  if (!product) {
    return (
      <div className="page">
        <div className="box empty">
          <p>Produit introuvable.</p>
          <Link to="/">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  const validImages = (product.images || []).filter((u) => u && (u.startsWith('http') || u.startsWith('/') || u.startsWith('data:')));
  const mainImage = selectedImage || validImages[imgIndex] || PLACEHOLDER;
  const hasColors = product.couleurs?.length > 0;
  const outOfStock = product.stock <= 0;
  const maxQty = Math.min(product.stock, 10);

  const sellerId = product.boutique?._id || product.boutique;
  const sellerName = product.boutique ? `${product.boutique.prenom || ''} ${product.boutique.nom || ''}`.trim() : '';

  // Vérifie connexion, rôle et couleur avant d'agir
  const canOrder = () => {
    if (!user) {
      navigate('/login', { state: { from: `/product/${id}`, message: 'Connectez-vous pour commander ce produit' } });
      return false;
    }
    if (user.role !== 'client') {
      setMsg({ type: 'info', text: 'Seuls les comptes clients peuvent commander' });
      return false;
    }
    if (hasColors && !color) {
      setMsg({ type: 'error', text: 'Veuillez choisir une couleur' });
      return false;
    }
    return true;
  };

  const handleAdd = async () => {
    if (!canOrder()) return;
    try {
      await addToCart(product._id, qty, color);
      setMsg({ type: 'ok', text: '✅ Produit réservé dans le panier (stock mis à jour)' });
      setProduct((prev) => (prev ? { ...prev, stock: Math.max(0, prev.stock - qty) } : prev));
      setQty(1);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || "Erreur lors de l'ajout" });
    }
  };

  const handleBuyNow = async () => {
    if (!canOrder()) return;
    try {
      await addToCart(product._id, qty, color);
      navigate('/cart');
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Erreur' });
    }
  };

  const handleAddToCart = handleAdd;

  // Soumission d'un avis
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewMsg({ type: '', text: '' });
    setReviewLoading(true);

    try {
      if (editingReviewId) {
        await api.put(`/reviews/${editingReviewId}`, reviewForm);
        setReviewMsg({ type: 'ok', text: 'Votre avis a été modifié ✅' });
        setEditingReviewId(null);
      } else {
        await api.post(`/reviews/product/${product._id}`, reviewForm);
        setReviewMsg({ type: 'ok', text: 'Merci ! Votre avis a été publié ✅' });
      }
      setReviewForm({ note: 5, titre: '', commentaire: '' });
      loadReviews(product._id);
    } catch (err) {
      setReviewMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors de l\'enregistrement de votre avis' });
    } finally {
      setReviewLoading(false);
    }
  };

  const handleEditReview = (rev) => {
    setEditingReviewId(rev._id);
    setReviewForm({
      note: rev.note,
      titre: rev.titre || '',
      commentaire: rev.commentaire || ''
    });
    window.scrollTo({ top: document.getElementById('review-form')?.offsetTop - 100, behavior: 'smooth' });
  };

  const handleDeleteReview = async (revId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer votre avis ?')) return;
    try {
      await api.delete(`/reviews/${revId}`);
      loadReviews(product._id);
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const hasPromo = Boolean(product.enPromotion || (product.promotion?.active && product.promotion?.pourcentage > 0));
  const promoPercent = product.promotion?.pourcentage || (product.enPromotion && product.prix && product.prixFinal ? Math.round((1 - product.prixFinal / product.prix) * 100) : 0);
  const promoPrice = product.prixFinal || product.promotion?.prixPromo || (hasPromo ? Math.round((product.prix * (1 - promoPercent / 100)) * 100) / 100 : product.prix);

  const availability = outOfStock ? (
    <p className="prod-stock out" style={{ fontSize: 18 }}>Rupture de stock</p>
  ) : product.stock < 10 ? (
    <p className="prod-stock low" style={{ fontSize: 18 }}>Plus que {product.stock} en stock</p>
  ) : (
    <p className="prod-stock ok" style={{ fontSize: 18 }}>En stock</p>
  );

  return (
    <div className="page">
      <div className="crumbs">
        <Link to="/">Accueil</Link> › <Link to={`/?categorie=${encodeURIComponent(product.categorie)}`}>{product.categorie}</Link> › {product.nom}
      </div>

      <div className="box pd">
        {/* ===== COLONNE GAUCHE : BOUTONS AU-DESSUS DE LA PHOTO + GALERIE ===== */}
        <div>
          {/* Les deux boutons au-dessus de la photo */}
          <div className="prod-actions-top" style={{ marginBottom: 14 }}>
            <button
              type="button"
              className="prod-btn-commander"
              disabled={outOfStock}
              onClick={handleBuyNow}
            >
              Commander
            </button>
            <button
              type="button"
              className="prod-btn-panier"
              disabled={outOfStock}
              onClick={handleAdd}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              Ajouter au panier
            </button>
          </div>

          <div className="pd-main" style={{ position: 'relative' }}>
            {hasPromo && promoPercent > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  background: '#dc2626',
                  color: '#fff',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 800,
                  zIndex: 2,
                  boxShadow: '0 2px 8px rgba(220,38,38,0.4)'
                }}
              >
                -{promoPercent}%
              </span>
            )}
            <img
              src={mainImage}
              alt={product.nom}
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
            />
          </div>
          {validImages.length > 1 && (
            <div className="pd-thumbs">
              {validImages.map((src, i) => (
                <img
                  key={src + i}
                  src={src}
                  alt=""
                  className={selectedImage === src ? 'active' : ''}
                  onClick={() => handleThumbnailClick(src, i)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ===== INFORMATIONS PRODUIT ===== */}
        <div>
          <h1>{product.nom}</h1>

          {/* Étoiles et avis */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '6px 0 10px' }}>
            <StarRating rating={reviewsData.average} count={reviewsData.total} showValue size={18} />
            <a href="#reviews" style={{ color: '#0369a1', fontSize: 13, textDecoration: 'none' }}>
              {reviewsData.total} évaluation(s)
            </a>
          </div>

          {product.marque && <div className="brand">Marque : <strong>{product.marque}</strong></div>}

          {sellerName && (
            <p className="muted" style={{ margin: '6px 0' }}>
              Boutique vendeuse :{' '}
              <Link to={`/stores/${sellerId}`} style={{ color: '#0369a1', fontWeight: 600 }}>
                {sellerName} ↗
              </Link>
            </p>
          )}

          {hasPromo ? (
            <div style={{ margin: '10px 0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="big-price" style={{ color: '#dc2626', margin: 0 }}>
                  {Number(promoPrice).toFixed(2)} TND
                </span>
                <span style={{ background: '#dc2626', color: '#fff', padding: '3px 8px', borderRadius: 6, fontSize: 13, fontWeight: 800 }}>
                  -{promoPercent}%
                </span>
              </div>
              <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
                Prix initial : <span style={{ textDecoration: 'line-through' }}>{Number(product.prix).toFixed(2)} TND</span>
              </div>
            </div>
          ) : (
            <div className="big-price">{Number(product.prix).toFixed(2)} TND</div>
          )}
          {availability}

          {/* SÉLECTION DE COULEUR (AVEC CHANGEMENT D'IMAGE INSTANTANÉ) */}
          {hasColors && (
            <div style={{ margin: '20px 0' }}>
              <h3 style={{ margin: '0 0 10px', fontSize: 16 }}>
                Couleur : <span style={{ fontWeight: 600, color: '#F97316' }}>{color || 'Veuillez choisir une couleur'}</span>
              </h3>
              <div className="color-opts">
                {product.couleurs.map((c) => {
                  const isSelected = color.trim().toLowerCase() === c.trim().toLowerCase();
                  return (
                    <button
                      key={c}
                      type="button"
                      className={`color-opt ${isSelected ? 'active' : ''}`}
                      onClick={() => handleColorChange(c)}
                      title={`Afficher la photo pour ${c}`}
                    >
                      <span className="swatch" style={{ background: colorToCss(c) || '#e5e7eb' }} />
                      <span>{c}</span>
                      {isSelected && <span style={{ fontSize: 12, marginLeft: 4 }}>✓</span>}
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
                💡 En sélectionnant une couleur, la photo correspondante s'affiche automatiquement.
              </p>
            </div>
          )}

          <h3>Caractéristiques</h3>
          {product.caracteristiques?.length > 0 ? (
            <table className="specs">
              <tbody>
                {product.caracteristiques.map((c, i) => (
                  <tr key={i}><td>{c.nom}</td><td>{c.valeur}</td></tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="muted">Aucune caractéristique renseignée.</p>
          )}

          <h3>À propos de cet article</h3>
          <p style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}>{product.description}</p>
        </div>

        {/* ===== BLOC D'ACHAT (BUYBOX) ===== */}
        <aside className="buybox">
          {hasPromo ? (
            <div style={{ marginTop: 0, marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="big-price" style={{ color: '#dc2626', margin: 0 }}>
                  {Number(promoPrice).toFixed(2)} TND
                </span>
                <span style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', padding: '2px 6px', borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                  -{promoPercent}%
                </span>
              </div>
              <div style={{ fontSize: 13, color: '#9ca3af', textDecoration: 'line-through', marginTop: 2 }}>
                {Number(product.prix).toFixed(2)} TND
              </div>
            </div>
          ) : (
            <div className="big-price" style={{ marginTop: 0 }}>{Number(product.prix).toFixed(2)} TND</div>
          )}
          {availability}

          <div style={{ fontSize: 13, color: '#4b5563', margin: '10px 0', lineHeight: 1.4 }}>
            📦 Livraison à domicile sous <strong>2 à 4 jours</strong>
            <br />
            🛡️ Garantie satisfaction et retours acceptés
          </div>

          {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}

          {!outOfStock && (
            <div className="field">
              <label>Quantité</label>
              <select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                style={{ padding: '10px', borderRadius: 8, border: '1px solid #d1d5db', width: '100%', background: '#fff', color: '#111' }}
              >
                {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          )}

          <button className="btn-orange" disabled={outOfStock} onClick={handleBuyNow}>
            Acheter maintenant
          </button>
          <button className="btn-outline" disabled={outOfStock} onClick={handleAdd}>
            🛒 Ajouter au panier
          </button>
        </aside>
      </div>

      {/* ===== SECTION AVIS ET ÉVALUATIONS (REVIEWS & RATINGS) ===== */}
      <section id="reviews" className="box" style={{ marginTop: 24 }}>
        <h2 style={{ fontSize: 22, margin: '0 0 20px', borderBottom: '2px solid #f3f4f6', paddingBottom: 12 }}>
          Avis et commentaires des clients
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 30, marginBottom: 30 }}>
          {/* Résumé des notes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 44, fontWeight: 800, color: '#111827' }}>
                {reviewsData.average}
              </span>
              <span style={{ fontSize: 20, color: '#6b7280' }}>sur 5</span>
            </div>
            <StarRating rating={reviewsData.average} size={22} />
            <p className="muted" style={{ marginTop: 6 }}>
              Basé sur {reviewsData.total} évaluation(s) vérifiée(s)
            </p>

            {/* Barres de répartition */}
            <div style={{ marginTop: 14 }}>
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviewsData.distribution?.[stars] || 0;
                const pct = reviewsData.total > 0 ? (count / reviewsData.total) * 100 : 0;
                return (
                  <div key={stars} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0', fontSize: 13 }}>
                    <span style={{ width: 45 }}>{stars} étoiles</span>
                    <div style={{ flex: 1, height: 10, background: '#f3f4f6', borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: '#f59e0b', borderRadius: 5 }} />
                    </div>
                    <span style={{ width: 35, textAlign: 'right', color: '#6b7280' }}>{Math.round(pct)}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Formulaire pour laisser un avis */}
          <div id="review-form">
            <h3 style={{ margin: '0 0 10px', fontSize: 17 }}>
              {editingReviewId ? 'Modifier votre avis' : 'Donner votre avis sur ce produit'}
            </h3>

            {!user ? (
              <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <p style={{ margin: '0 0 10px', fontSize: 14, color: '#475569' }}>
                  Connectez-vous pour partager votre expérience et évaluer ce produit.
                </p>
                <Link to="/login" state={{ from: `/product/${id}` }} className="btn-primary" style={{ display: 'inline-block', padding: '8px 20px', borderRadius: 6, background: '#F97316', color: '#fff', textDecoration: 'none', fontWeight: 600 }}>
                  Se connecter
                </Link>
              </div>
            ) : user.role !== 'client' ? (
              <p className="muted">Seuls les clients peuvent rédiger des avis.</p>
            ) : (
              <form onSubmit={handleReviewSubmit} style={{ background: '#f9fafb', padding: 18, borderRadius: 10, border: '1px solid #e5e7eb' }}>
                {reviewMsg.text && <div className={`alert ${reviewMsg.type}`}>{reviewMsg.text}</div>}

                <div className="field">
                  <label>Note globale :</label>
                  <StarRating
                    rating={reviewForm.note}
                    interactive
                    onChange={(n) => setReviewForm({ ...reviewForm, note: n })}
                    size={28}
                  />
                </div>

                <div className="field">
                  <label>Titre de votre avis (optionnel)</label>
                  <input
                    placeholder="Ex: Excellent produit, très satisfait"
                    value={reviewForm.titre}
                    onChange={(e) => setReviewForm({ ...reviewForm, titre: e.target.value })}
                  />
                </div>

                <div className="field">
                  <label>Votre commentaire *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Qu'avez-vous pensé de la qualité, de la taille, de la conformité ?"
                    value={reviewForm.commentaire}
                    onChange={(e) => setReviewForm({ ...reviewForm, commentaire: e.target.value })}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button type="submit" className="btn-orange" style={{ width: 'auto', padding: '10px 24px' }} disabled={reviewLoading}>
                    {reviewLoading ? 'Publication...' : editingReviewId ? 'Enregistrer les modifications' : 'Publier mon avis'}
                  </button>
                  {editingReviewId && (
                    <button
                      type="button"
                      className="btn-outline"
                      style={{ width: 'auto', marginTop: 0 }}
                      onClick={() => {
                        setEditingReviewId(null);
                        setReviewForm({ note: 5, titre: '', commentaire: '' });
                      }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Liste des avis clients */}
        <div>
          <h3 style={{ fontSize: 17, marginBottom: 16 }}>Tous les commentaires ({reviewsData.total})</h3>

          {reviewsData.reviews.length === 0 ? (
            <p className="muted">Soyez le premier à donner votre avis sur cet article !</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviewsData.reviews.map((rev) => {
                const isOwnReview = user && (user._id === rev.client?._id || user._id === rev.client);
                return (
                  <div key={rev._id} style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {rev.client?.avatar ? (
                          <img
                            src={rev.client.avatar}
                            alt=""
                            style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                          />
                        ) : (
                          <span style={{ width: 34, height: 34, borderRadius: '50%', background: '#e0e7ff', color: '#3730a3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14 }}>
                            {rev.client?.prenom?.[0] || 'C'}
                          </span>
                        )}
                        <div>
                          <strong style={{ fontSize: 14 }}>
                            {rev.client ? `${rev.client.prenom} ${rev.client.nom}` : 'Client Shoply'}
                          </strong>
                          {rev.achatVerifie && (
                            <span style={{ marginLeft: 8, fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                              ✓ Achat vérifié
                            </span>
                          )}
                        </div>
                      </div>

                      <span style={{ fontSize: 12, color: '#9ca3af' }}>
                        {new Date(rev.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 4px' }}>
                      <StarRating rating={rev.note} size={16} />
                      {rev.titre && <strong style={{ fontSize: 14 }}>{rev.titre}</strong>}
                    </div>

                    <p style={{ margin: '4px 0', fontSize: 14, color: '#374151', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                      {rev.commentaire}
                    </p>

                    {rev.reponseVendeur?.texte && (
                      <div style={{ marginTop: 12, marginLeft: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, borderLeft: '4px solid #F97316' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#c2410c' }}>
                            🏪 Réponse de la boutique {sellerName ? `(${sellerName})` : ''}
                          </span>
                          {rev.reponseVendeur.dateReponse && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              {new Date(rev.reponseVendeur.dateReponse).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#334155', lineHeight: 1.5, whiteSpace: 'pre-line' }}>
                          {rev.reponseVendeur.texte}
                        </p>
                      </div>
                    )}

                    {isOwnReview && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 14, fontSize: 13 }}>
                        <button type="button" className="link-btn" onClick={() => handleEditReview(rev)}>
                          ✏️ Modifier
                        </button>
                        <button type="button" className="link-btn" style={{ color: '#dc2626' }} onClick={() => handleDeleteReview(rev._id)}>
                          🗑️ Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}