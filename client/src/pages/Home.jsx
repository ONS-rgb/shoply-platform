import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ProductCard';
import { CATEGORIES } from '../constants/categories';
import '../styles/shop.css';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const search = params.get('search') || '';
  const categorie = params.get('categorie') || '';
  const boutique = params.get('boutique') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const isFiltering = Boolean(search || categorie || boutique || minPrice || maxPrice);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('featured');
  const [prices, setPrices] = useState({ min: minPrice, max: maxPrice });
  const [toast, setToast] = useState('');
  const [shopInfo, setShopInfo] = useState(null);

  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  // Charger le nom de la boutique si sélectionnée
  useEffect(() => {
    if (boutique) {
      api.get(`/shops/${boutique}`)
        .then(({ data }) => setShopInfo(data.data))
        .catch(() => setShopInfo(null));
    } else {
      setShopInfo(null);
    }
  }, [boutique]);

  // Chargement des produits à chaque changement de filtre (URL)
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const query = Object.fromEntries(
          Object.entries({ search, categorie, boutique, minPrice, maxPrice }).filter(([, v]) => v)
        );
        const { data } = await api.get('/products', { params: query });
        setProducts(data.data || []);
      } catch (err) {
        console.error('Erreur chargement produits:', err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    setPrices({ min: minPrice, max: maxPrice });
  }, [search, categorie, boutique, minPrice, maxPrice]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  // 🔒 Ajouter au panier : connexion obligatoire (compte client)
  // 🔒 Commander : connexion obligatoire, puis page détails du produit
const handleOrder = (product) => {
  const target = `/product/${product._id}`;
  if (!user) {
    navigate('/login', { state: { from: target, message: 'Connectez-vous pour commander ce produit' } });
    return;
  }
  navigate(target);
};

// 🔒 Ajouter au panier : connexion obligatoire (compte client)
const handleAddToCart = async (product, color = '') => {
  if (!user) {
    navigate('/login', {
      state: { from: '/', message: 'Connectez-vous pour ajouter ce produit au panier' }
    });
    return;
  }
  if (user.role !== 'client') {
    showToast('Seuls les comptes clients peuvent commander');
    return;
  }
  // Produit avec couleurs et aucune couleur choisie
  if (product.couleurs?.length > 0 && !color) {
    showToast('Choisissez une couleur pour ce produit');
    navigate(`/product/${product._id}`);
    return;
  }
  try {
    await addToCart(product._id, 1, color);
    showToast(`✅ « ${product.nom} » ${color ? `(${color}) ` : ''}ajouté au panier`);
  } catch (err) {
    showToast(err.response?.data?.message || "Erreur lors de l'ajout au panier");
  }
};

  const applyPrice = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(params);
    if (prices.min) next.set('minPrice', prices.min); else next.delete('minPrice');
    if (prices.max) next.set('maxPrice', prices.max); else next.delete('maxPrice');
    setParams(next);
  };

  const sorted = [...products].sort((a, b) =>
    sortBy === 'asc' ? a.prix - b.prix : sortBy === 'desc' ? b.prix - a.prix : 0
  );

  const catLabel = CATEGORIES.find((c) => c.value === categorie)?.label || categorie;
  let title = 'Tous les produits';
  if (shopInfo) {
    title = `Boutique : ${shopInfo.nom}${categorie ? ` › ${catLabel}` : ''}`;
  } else if (search) {
    title = `Résultats pour « ${search} »`;
  } else if (categorie) {
    title = catLabel;
  }

  return (
    <div className="home">
      {/* ===== BANNIÈRE (page d'accueil sans filtre) ===== */}
      {!isFiltering && (
        <section className="hero">
          <h1>Tout ce qu'il vous faut, au même endroit</h1>
          <p>Des milliers de produits de vendeurs indépendants, livrés chez vous.</p>
          <a href="#produits">Découvrir les produits</a>
        </section>
      )}

      <div className={`home-wrap ${!isFiltering ? 'overlap' : ''}`}>
        {/* ===== CARTES CATÉGORIES ===== */}
        {!isFiltering && (
          <div className="cat-grid">
            {!user && (
              <div className="cat-card">
                <h3>Connectez-vous pour commander</h3>
                <p>Accédez à votre panier, suivez vos commandes et profitez d'une meilleure expérience.</p>
                <Link to="/login" className="btn-primary">Se connecter</Link>
                <p style={{ textAlign: 'center', marginTop: 12 }}>
                  Nouveau ? <Link to="/register" style={{ color: '#E11D48', fontWeight: 600 }}>Créer un compte</Link>
                </p>
              </div>
            )}
            {CATEGORIES.slice(0, user ? 4 : 3).map((c) => (
              <div className="cat-card" key={c.value}>
                <h3>{c.label}</h3>
                <div className="emoji">{c.emoji}</div>
                <Link className="more" to={`/?categorie=${encodeURIComponent(c.value)}`}>
                  Voir les produits
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* ===== LISTE DES PRODUITS ===== */}
        <section className="section" id="produits">
          <div className="toolbar">
            <div>
              <h2>{title}</h2>
              <span className="count">{loading ? 'Chargement...' : `${products.length} produit(s)`}</span>
            </div>

            <div className="right">
              <form className="price-form" onSubmit={applyPrice}>
                <span>Prix :</span>
                <input type="number" min="0" placeholder="Min" value={prices.min}
                  onChange={(e) => setPrices({ ...prices, min: e.target.value })} />
                <span>à</span>
                <input type="number" min="0" placeholder="Max" value={prices.max}
                  onChange={(e) => setPrices({ ...prices, max: e.target.value })} />
                <button type="submit">OK</button>
              </form>

              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Trier">
                <option value="featured">Trier : Pertinence</option>
                <option value="asc">Prix croissant</option>
                <option value="desc">Prix décroissant</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="empty">Chargement des produits...</div>
          ) : sorted.length === 0 ? (
            <div className="empty">
              <p>Aucun produit trouvé.</p>
              {isFiltering && <Link to="/">Effacer les filtres</Link>}
            </div>
          ) : (
            <div className="prod-grid">
              {sorted.map((p) => (
<ProductCard key={p._id} product={p} onOrder={handleOrder} onAdd={handleAddToCart} />              ))}
            </div>
          )}
        </section>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}