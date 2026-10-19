import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/shop.css';

export default function StoreDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  useEffect(() => {
    api.get(`/shops/${id}`)
      .then(({ data }) => setShop(data.data))
      .catch(() => setShop(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleOrder = (product) => {
    navigate(`/product/${product._id}`);
  };

  const handleAddToCart = async (product, color = '') => {
    if (!user) {
      navigate('/login', { state: { from: `/stores/${id}`, message: 'Connectez-vous pour ajouter au panier' } });
      return;
    }
    if (user.role !== 'client') {
      showToast('Seuls les comptes clients peuvent commander');
      return;
    }
    if (product.couleurs?.length > 0 && !color) {
      navigate(`/product/${product._id}`);
      return;
    }
    try {
      await addToCart(product._id, 1, color);
      showToast(`✅ « ${product.nom} » ajouté au panier`);
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur');
    }
  };

  if (loading) return <div className="page"><p className="muted">Chargement de la boutique...</p></div>;

  if (!shop) {
    return (
      <div className="page">
        <div className="box empty" style={{ maxWidth: 500, margin: '40px auto' }}>
          <h2>Boutique introuvable</h2>
          <Link to="/stores" className="link-btn">Voir toutes les boutiques</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ background: '#EAEDED' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div className="crumbs">
          <Link to="/">Accueil</Link> › <Link to="/stores">Boutiques</Link> › {shop.nom}
        </div>

        {toast && <div className="toast">{toast}</div>}

        {/* Bannière & En-tête de la Boutique */}
        <div className="box" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
          {shop.banniere && (
            <div style={{ height: 160, overflow: 'hidden', background: '#0F172A' }}>
              <img src={shop.banniere} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <div style={{ padding: '24px 30px', display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            {shop.logo ? (
              <img
                src={shop.logo}
                alt={shop.nom}
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #F97316' }}
              />
            ) : (
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: '#fed7aa',
                  color: '#c2410c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 36
                }}
              >
                🏪
              </div>
            )}

            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ margin: '0 0 6px', fontSize: 24 }}>{shop.nom}</h1>
              <p style={{ margin: '0 0 8px', color: '#4b5563', fontSize: 14 }}>
                {shop.description || 'Boutique partenaire officielle sur Shoply.'}
              </p>
              <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#6b7280' }}>
                <span>📦 <strong>{shop.nbProduits || 0}</strong> produit(s) en vente</span>
                {shop.proprietaire?.email && <span>✉️ Contact vérifié</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Catalogue de la Boutique */}
        <div className="box">
          <h2 style={{ fontSize: 20, margin: '0 0 16px' }}>
            Tous les produits de cette boutique ({shop.nbProduits || 0})
          </h2>

          {!shop.produits || shop.produits.length === 0 ? (
            <div className="empty">
              <p>Cette boutique n'a pas encore mis de produits en vente.</p>
            </div>
          ) : (
            <div className="prod-grid">
              {shop.produits.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onOrder={handleOrder}
                  onAdd={handleAddToCart}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
