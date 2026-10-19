import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { CATEGORIES } from '../constants/categories';
import logo from '../assets/logo.png';
import '../styles/shop.css';

import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setQ(params.get('search') || '');
    setCat(params.get('categorie') || '');
  }, [params]);

  const handleSearch = (e) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('search', q.trim());
    if (cat) sp.set('categorie', cat);
    navigate(`/?${sp.toString()}`);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
  };

  const isClient = user?.role === 'client';

  return (
    <header className="nb">
      <div className="nb-top">
        <Link to="/" className="nb-logo">
          <img src={logo} alt="Shoply" />
        </Link>

        <form className="nb-search" onSubmit={handleSearch}>
          <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Catégorie">
            <option value="">Toutes</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Rechercher un produit ou marque..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <button type="submit" aria-label="Rechercher">🔍</button>
        </form>

        {/* Notifications pour utilisateur connecté */}
        {user && <NotificationBell />}

        {/* Compte (menu au survol) */}
        <div
          className="nb-account"
          onMouseEnter={() => setMenuOpen(true)}
          onMouseLeave={() => setMenuOpen(false)}
        >
          <Link to={user ? '/profile' : '/login'} className="nb-item" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid #F97316' }}
              />
            ) : null}
            <div>
              Bonjour, {user ? user.prenom || user.nom : 'Connectez-vous'}
              <strong>Compte et listes ▾</strong>
            </div>
          </Link>

          {menuOpen && (
            <div className="nb-menu">
              {user ? (
                <>
                  <div className="who">{user.prenom} {user.nom}</div>
                  <div className="role">{user.role}</div>
                  <Link to="/profile" className="row" onClick={() => setMenuOpen(false)}>👤 Mon profil</Link>
                  {isClient && (
                    <>
                      <Link to="/orders" className="row" onClick={() => setMenuOpen(false)}>📦 Mes commandes</Link>
                      <Link to="/profile" className="row" onClick={() => setMenuOpen(false)}>📍 Mes adresses</Link>
                      <Link to="/cart" className="row" onClick={() => setMenuOpen(false)}>🛒 Mon panier ({cart.nbArticles})</Link>
                    </>
                  )}
                  {user.role === 'vendeur' && (
                    <Link to="/add-product" className="row" onClick={() => setMenuOpen(false)}>➕ Vendre un produit</Link>
                  )}
                  <button className="btn-primary" onClick={handleLogout} style={{ marginTop: 10 }}>
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn-primary">Se connecter</Link>
                  <p>
                    Nouveau client ? <Link to="/register" className="link">Créer un compte</Link>
                  </p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Retours et Commandes (Amazon style) */}
        <Link
          to={user ? '/orders' : '/login'}
          state={user ? undefined : { from: '/orders', message: 'Connectez-vous pour voir vos commandes' }}
          className="nb-item nb-hide-sm"
        >
          Retours
          <strong>et commandes</strong>
        </Link>

        {/* Panier avec badge */}
        <Link
          to={user ? '/cart' : '/login'}
          state={user ? undefined : { from: '/cart', message: 'Connectez-vous pour accéder à votre panier' }}
          className="nb-item nb-cart"
        >
          <span className="cart-count">{isClient ? cart.nbArticles : 0}</span>
          <strong>🛒 Panier</strong>
        </Link>
      </div>

      <nav className="nb-sub">
        <Link to="/">🏠 Accueil</Link>
        <Link to="/products">🏷️ Catalogue</Link>
        <Link to="/stores">🏪 Boutiques</Link>
        {CATEGORIES.map((c) => (
          <Link key={c.value} to={`/?categorie=${encodeURIComponent(c.value)}`}>{c.label}</Link>
        ))}
        {(!user || user.role === 'vendeur') && (
          <Link to={user ? '/add-product' : '/register'} className="sell">
            Vendre sur Shoply
          </Link>
        )}
      </nav>
    </header>
  );
}