import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { CATEGORIES } from '../constants/categories';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/shop.css';

export default function Products() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const initialCat = params.get('categorie') || '';
  const initialMin = params.get('minPrice') || '';
  const initialMax = params.get('maxPrice') || '';
  const initialSort = params.get('sort') || 'newest';
  const boutique = params.get('boutique') || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [minPrice, setMinPrice] = useState(initialMin);
  const [maxPrice, setMaxPrice] = useState(initialMax);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);
  const [toast, setToast] = useState('');

  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const q = {};
      if (selectedCat) q.categorie = selectedCat;
      if (search) q.search = search;
      if (minPrice) q.minPrice = minPrice;
      if (maxPrice) q.maxPrice = maxPrice;
      if (inStockOnly) q.inStock = 'true';
      if (sortBy) q.sort = sortBy;
      if (boutique) q.boutique = boutique;

      const { data } = await api.get('/products', { params: q });
      setProducts(data.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCat, search, inStockOnly, sortBy, boutique]);

  const handleApplyPrice = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleResetFilters = () => {
    setSelectedCat('');
    setMinPrice('');
    setMaxPrice('');
    setInStockOnly(false);
    setSortBy('newest');
    setParams({});
  };

  const handleOrder = (product) => {
    navigate(`/product/${product._id}`);
  };

  const handleAddToCart = async (product, color = '') => {
    if (!user) {
      navigate('/login', { state: { from: '/products', message: 'Connectez-vous pour ajouter un article' } });
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
      showToast(err.response?.data?.message || 'Erreur lors de l\'ajout');
    }
  };

  return (
    <div className="page" style={{ background: '#EAEDED', padding: '20px 24px' }}>
      <div style={{ display: 'flex', gap: 24, alignItems: 'start', maxWidth: 1300, margin: '0 auto' }}>

        {/* SIDEBAR GAUCHE : FILTRES */}
        <aside
          className="box"
          style={{
            width: 260,
            flexShrink: 0,
            padding: 20,
            position: 'sticky',
            top: 100
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Filtres</h3>
            <button type="button" className="link-btn" onClick={handleResetFilters} style={{ fontSize: 12 }}>
              Réinitialiser
            </button>
          </div>

          {/* Catégories */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Catégorie
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="cat_filter"
                  checked={!selectedCat}
                  onChange={() => setSelectedCat('')}
                  style={{ accentColor: '#F97316' }}
                />
                <span style={{ fontWeight: !selectedCat ? 700 : 400 }}>Toutes les catégories</span>
              </label>

              {CATEGORIES.map((c) => (
                <label key={c.value} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    name="cat_filter"
                    checked={selectedCat === c.value}
                    onChange={() => setSelectedCat(c.value)}
                    style={{ accentColor: '#F97316' }}
                  />
                  <span style={{ fontWeight: selectedCat === c.value ? 700 : 400 }}>
                    {c.emoji} {c.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Prix Min / Max */}
          <div style={{ marginBottom: 20, borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
            <h4 style={{ margin: '0 0 10px', fontSize: 14, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Prix (TND)
            </h4>
            <form onSubmit={handleApplyPrice} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                style={{ width: 65, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
              />
              <span style={{ color: '#9ca3af' }}>à</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                style={{ width: 65, padding: '6px 8px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 13 }}
              />
              <button
                type="submit"
                style={{ background: '#0F172A', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 10px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >
                Go
              </button>
            </form>
          </div>

          {/* Disponibilité */}
          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                style={{ accentColor: '#F97316' }}
              />
              <span>En stock uniquement</span>
            </label>
          </div>
        </aside>

        {/* CONTENU PRINCIPAL : GRILLE */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {/* Barre d'outils / Tri */}
          <div
            className="box"
            style={{
              padding: '14px 20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12
            }}
          >
            <div>
              <h2 style={{ fontSize: 18, margin: 0 }}>
                {search ? `Résultats pour « ${search} »` : selectedCat ? `Rayon ${selectedCat}` : 'Tous nos produits'}
              </h2>
              <span className="count">{loading ? 'Chargement...' : `${products.length} article(s) trouvé(s)`}</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>Trier par :</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '7px 12px', borderRadius: 6, border: '1px solid #d1d5db', fontSize: 14, background: '#fff' }}
              >
                <option value="newest">Nouveautés</option>
                <option value="asc">Prix : croissant</option>
                <option value="desc">Prix : décroissant</option>
                <option value="rating">Meilleures évaluations</option>
              </select>
            </div>
          </div>

          {toast && <div className="toast">{toast}</div>}

          {/* Grille de produits */}
          {loading ? (
            <div className="box empty"><p className="muted">Chargement des produits...</p></div>
          ) : products.length === 0 ? (
            <div className="box empty" style={{ padding: '60px 20px' }}>
              <span style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>🔍</span>
              <h3>Aucun produit ne correspond à vos critères</h3>
              <p className="muted" style={{ margin: '6px 0 16px' }}>
                Essayez d'élargir vos filtres ou de modifier votre recherche.
              </p>
              <button type="button" className="btn-orange" onClick={handleResetFilters} style={{ width: 'auto', display: 'inline-block', padding: '10px 24px' }}>
                Effacer tous les filtres
              </button>
            </div>
          ) : (
            <div className="prod-grid">
              {products.map((p) => (
                <ProductCard
                  key={p._id}
                  product={p}
                  onOrder={handleOrder}
                  onAdd={handleAddToCart}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}