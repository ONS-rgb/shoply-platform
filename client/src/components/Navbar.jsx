import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { CATEGORIES as DEFAULT_CATEGORIES } from '../constants/categories';
import api from '../services/api';
import logo from '../assets/logo.png';
import '../styles/shop.css';

import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { language, setLanguage, t, tCat } = useLanguage();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [expandedDrawerShop, setExpandedDrawerShop] = useState(null);

  const [shops, setShops] = useState([]);
  const [categoriesList, setCategoriesList] = useState(DEFAULT_CATEGORIES);

  // Boutique active d'après l'URL
  const activeBoutiqueId = params.get('boutique') || '';
  const activeCategorie = params.get('categorie') || '';

  useEffect(() => {
    setQ(params.get('search') || '');
    setCat(params.get('categorie') || '');
  }, [params]);

  // Charger les boutiques et les catégories depuis l'API
  useEffect(() => {
    // Boutiques
    api.get('/shops')
      .then(({ data }) => setShops(data.data || []))
      .catch(() => setShops([]));

    // Catégories
    api.get('/categories')
      .then(({ data }) => {
        if (data.data?.length > 0) {
          const mapped = data.data.map((c) => ({
            value: c.nom,
            label: c.nom,
            emoji: c.icone || '🏷️'
          }));
          setCategoriesList(mapped);
        }
      })
      .catch(() => {});
  }, []);

  // Bloquer le scroll quand le tiroir (Drawer) est ouvert
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  // Fermer le tiroir avec la touche Echap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setDrawerOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (q.trim()) sp.set('search', q.trim());
    if (cat) sp.set('categorie', cat);
    if (activeBoutiqueId) sp.set('boutique', activeBoutiqueId);
    navigate(`/?${sp.toString()}`);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setDrawerOpen(false);
    navigate('/');
  };

  const handleShopClick = (shopId) => {
    if (activeBoutiqueId === shopId && !activeCategorie) {
      navigate('/');
    } else {
      navigate(`/?boutique=${shopId}`);
    }
  };

  const isClient = user?.role === 'client';
  const activeShop = shops.find((s) => s._id === activeBoutiqueId);

  const langConfig = {
    fr: { flag: '🇫🇷', label: 'FR' },
    ar: { flag: '🇹🇳', label: 'AR' },
    en: { flag: '🇬🇧', label: 'EN' }
  };
  const currentLang = langConfig[language] || langConfig.fr;

  return (
    <>
      <header className="nb">
        {/* ================= BARRE SUPÉRIEURE (Top Header - fond sombre #131921) ================= */}
        <div className="nb-top">
          {/* Logo Shoply */}
          <Link to="/" className="nb-logo" title="Shoply - Accueil">
            <img src={logo} alt="Shoply" />
          </Link>

          {/* Adresse de livraison (Amazon style) */}
          <div className="nb-location nb-hide-sm" title={t('delivery_to')}>
            <span className="nb-loc-icon">📍</span>
            <div className="nb-loc-text">
              <span className="nb-loc-sub">{t('delivery_to')}</span>
              <strong className="nb-loc-main">{t('tunisia')}</strong>
            </div>
          </div>

          {/* Barre de recherche centrale large */}
          <form className="nb-search" onSubmit={handleSearch}>
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              aria-label={t('all_categories')}
            >
              <option value="">{t('all_categories')}</option>
              {categoriesList.map((c) => (
                <option key={c.value} value={c.value}>
                  {tCat(c.label)}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder={t('search_placeholder')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button type="submit" aria-label="Rechercher" title="Lancer la recherche">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#131921" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* Notifications pour utilisateur connecté */}
          {user && <NotificationBell />}

          {/* Sélecteur de langue dynamique (FR / AR / EN) */}
          <div
            className="nb-lang nb-hide-sm"
            onMouseEnter={() => setLangOpen(true)}
            onMouseLeave={() => setLangOpen(false)}
          >
            <div className="nb-item" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 16 }}>{currentLang.flag}</span>
              <strong>{currentLang.label} ▾</strong>
            </div>
            {langOpen && (
              <div className="nb-lang-menu">
                <div
                  className={`lang-opt ${language === 'fr' ? 'active' : ''}`}
                  onClick={() => { setLanguage('fr'); setLangOpen(false); }}
                >
                  <span>🇫🇷</span> Français (FR)
                </div>
                <div
                  className={`lang-opt ${language === 'ar' ? 'active' : ''}`}
                  onClick={() => { setLanguage('ar'); setLangOpen(false); }}
                >
                  <span>🇹🇳</span> Arabe (AR)
                </div>
                <div
                  className={`lang-opt ${language === 'en' ? 'active' : ''}`}
                  onClick={() => { setLanguage('en'); setLangOpen(false); }}
                >
                  <span>🇬🇧</span> English (EN)
                </div>
              </div>
            )}
          </div>

          {/* Compte et listes (menu au survol) */}
          <div
            className="nb-account"
            onMouseEnter={() => setMenuOpen(true)}
            onMouseLeave={() => setMenuOpen(false)}
          >
            <Link
              to={user ? '/profile' : '/login'}
              className="nb-item"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', border: '1px solid #febd69' }}
                />
              ) : null}
              <div>
                <span style={{ fontSize: 11, color: '#ccc', display: 'block' }}>
                  {user ? `${t('hello')} ${user.prenom || user.nom}` : t('hello_signin')}
                </span>
                <strong>{t('account_and_lists')} ▾</strong>
              </div>
            </Link>

            {menuOpen && (
              <div className="nb-menu">
                {user ? (
                  <>
                    <div className="who">{user.prenom} {user.nom}</div>
                    <div className="role">{user.role}</div>
                    {isClient && (
                      <Link to="/dashboard" className="row" onClick={() => setMenuOpen(false)} style={{ color: '#ea580c', fontWeight: 700 }}>
                        📊 {t('client_space')}
                      </Link>
                    )}
                    <Link to="/profile" className="row" onClick={() => setMenuOpen(false)}>👤 {t('my_profile')}</Link>
                    {isClient && (
                      <>
                        <Link to="/orders" className="row" onClick={() => setMenuOpen(false)}>📦 {t('my_orders')}</Link>
                        <Link to="/my-reviews" className="row" onClick={() => setMenuOpen(false)}>⭐ {t('my_reviews')}</Link>
                        <Link to="/my-refunds" className="row" onClick={() => setMenuOpen(false)}>💰 {t('my_refunds')}</Link>
                        <Link to="/notifications" className="row" onClick={() => setMenuOpen(false)}>🔔 {t('my_notifications')}</Link>
                        <Link to="/profile" className="row" onClick={() => setMenuOpen(false)}>📍 {t('my_addresses')}</Link>
                        <Link to="/cart" className="row" onClick={() => setMenuOpen(false)}>🛒 {t('cart')} ({cart.nbArticles})</Link>
                      </>
                    )}
                    {user.role === 'admin' && (
                      <>
                        <Link to="/admin" className="row" onClick={() => setMenuOpen(false)} style={{ color: '#ea580c', fontWeight: 700 }}>
                          ⚡ {t('admin_dashboard')}
                        </Link>
                        <Link to="/admin/shops" className="row" onClick={() => setMenuOpen(false)}>🏪 {t('merchant_shops')}</Link>
                        <Link to="/admin/payments" className="row" onClick={() => setMenuOpen(false)}>💳 {t('payments')}</Link>
                        <Link to="/admin/statistics" className="row" onClick={() => setMenuOpen(false)}>📈 {t('stats')}</Link>
                      </>
                    )}
                    {user.role === 'vendeur' && (
                      <>
                        <Link to="/seller" className="row" onClick={() => setMenuOpen(false)} style={{ color: '#ea580c', fontWeight: 700 }}>
                          📊 {t('seller_space')}
                        </Link>
                        <Link to="/add-product" className="row" onClick={() => setMenuOpen(false)}>➕ Vendre un produit</Link>
                      </>
                    )}
                    <button className="btn-primary" onClick={handleLogout} style={{ marginTop: 10 }}>
                      {t('sign_out')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="btn-primary" onClick={() => setMenuOpen(false)}>
                      {t('sign_in')}
                    </Link>
                    <p>
                      {t('new_customer')} <Link to="/register" className="link" onClick={() => setMenuOpen(false)}>{t('start_here')}</Link>
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
            <span style={{ fontSize: 11, color: '#ccc', display: 'block' }}>{t('returns')}</span>
            <strong>{t('and_orders')}</strong>
          </Link>

          {/* Panier avec badge */}
          <Link
            to={user ? '/cart' : '/login'}
            state={user ? undefined : { from: '/cart', message: 'Connectez-vous pour accéder à votre panier' }}
            className="nb-item nb-cart"
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <span className="cart-count">{isClient ? cart.nbArticles : 0}</span>
              <svg width="34" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            </div>
            <strong style={{ alignSelf: 'flex-end', marginBottom: 2 }}>{t('cart')}</strong>
          </Link>
        </div>

        {/* ================= BARRE SECONDAIRE (Sub-Navbar - fond gris-bleu foncé #232f3e) ================= */}
        <nav className="nb-sub">
          {/* Bouton Burger « ☰ Toutes » */}
          <button
            type="button"
            className="nb-sub-burger"
            onClick={() => setDrawerOpen(true)}
            aria-label="Ouvrir le menu complet"
          >
            <span className="burger-icon">☰</span>
            <strong className="burger-label">{t('all')}</strong>
          </button>

          {/* Liste dynamique des boutiques de la base de données */}
          <div className="nb-sub-shops">
            {shops.map((shop) => {
              const isActive = activeBoutiqueId === shop._id;
              return (
                <button
                  key={shop._id}
                  type="button"
                  className={`nb-shop-link ${isActive ? 'active' : ''}`}
                  onClick={() => handleShopClick(shop._id)}
                  title={`Voir les produits de ${shop.nom}`}
                >
                  <span className="shop-icon">🏪</span>
                  <span className="shop-name">{shop.nom}</span>
                  {isActive && <span className="shop-indicator">●</span>}
                </button>
              );
            })}
          </div>

          {/* Raccourcis pratiques à droite */}
          <div className="nb-sub-extra">
            <Link to="/stores" className="nb-sub-pill">
              {t('all_stores')}
            </Link>
            <Link to="/products" className="nb-sub-pill">
              {t('catalog')}
            </Link>
            {user?.role === 'vendeur' ? (
              <Link to="/seller" className="nb-sub-sell">
                📊 {t('seller_space')}
              </Link>
            ) : !user ? (
              <Link to="/register" className="nb-sub-sell">
                {t('sell_on_shoply')}
              </Link>
            ) : null}
          </div>
        </nav>

        {/* ================= SOUS-BARRE BLANCHE : CATÉGORIES DE LA BOUTIQUE SÉLECTIONNÉE ================= */}
        {activeShop && (
          <div className="nb-shop-subbar">
            <div className="nb-shop-subbar-inner">
              {/* Badge nom de la boutique active */}
              <div className="nb-shop-badge">
                <span className="shop-dot"></span>
                <strong>{activeShop.nom}</strong>
                <span className="shop-count">
                  ({activeShop.nbProduits} {activeShop.nbProduits > 1 ? t('product_plural') : t('product_singular')})
                </span>
              </div>

              {/* Catégories associées uniquement à cette boutique */}
              <div className="nb-shop-cats">
                <Link
                  to={`/?boutique=${activeShop._id}`}
                  className={`nb-shop-cat-btn ${!activeCategorie ? 'active' : ''}`}
                >
                  {t('all_products')}
                </Link>

                {activeShop.categories && activeShop.categories.length > 0 ? (
                  activeShop.categories.map((c) => (
                    <Link
                      key={c}
                      to={`/?boutique=${activeShop._id}&categorie=${encodeURIComponent(c)}`}
                      className={`nb-shop-cat-btn ${activeCategorie === c ? 'active' : ''}`}
                    >
                      {tCat(c)}
                    </Link>
                  ))
                ) : (
                  <span style={{ fontSize: 12, color: '#6b7280', alignSelf: 'center' }}>
                    {t('no_cats_for_shop')}
                  </span>
                )}
              </div>

              {/* Bouton pour quitter le filtre boutique */}
              <Link to="/" className="nb-shop-close-btn" title={t('view_all_catalog')}>
                {t('view_all_catalog')}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ================= MENU LATÉRAL COULISSANT (Drawer / Sidebar « ☰ Toutes ») ================= */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)}>
          {/* Bouton de fermeture X à l'extérieur en haut à droite du tiroir (style Amazon) */}
          <button
            type="button"
            className="drawer-close-outside"
            onClick={(e) => {
              e.stopPropagation();
              setDrawerOpen(false);
            }}
            aria-label="Fermer le menu"
            title="Fermer (Échap)"
          >
            ✕
          </button>

          {/* Panneau blanc coulissant */}
          <aside className="drawer-panel" onClick={(e) => e.stopPropagation()}>
            {/* En-tête sombre du drawer style Amazon */}
            <div className="drawer-header">
              <div className="drawer-user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt="" />
                ) : (
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                )}
              </div>
              <div className="drawer-user-info">
                {user ? (
                  <>
                    <span className="drawer-hello">{t('hello')}</span>
                    <strong className="drawer-name">{user.prenom} {user.nom}</strong>
                  </>
                ) : (
                  <Link to="/login" onClick={() => setDrawerOpen(false)} className="drawer-signin-link">
                    {t('hello_signin')}
                  </Link>
                )}
              </div>
            </div>

            {/* Contenu scrollable */}
            <div className="drawer-scroll">
              {/* ===== SECTION 1 : BOUTIQUES DISPONIBLES ===== */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">{t('available_stores')}</h3>
                <ul className="drawer-list">
                  {shops.map((shop) => {
                    const isExpanded = expandedDrawerShop === shop._id;
                    const isSelected = activeBoutiqueId === shop._id;
                    return (
                      <li key={shop._id} className="drawer-shop-wrapper">
                        <div
                          className={`drawer-item drawer-shop-header ${isSelected ? 'active' : ''}`}
                          onClick={() => setExpandedDrawerShop(isExpanded ? null : shop._id)}
                        >
                          <div className="drawer-item-left">
                            <span className="drawer-shop-icon">🏪</span>
                            <span className="drawer-shop-title">{shop.nom}</span>
                            <span className="drawer-shop-count">({shop.nbProduits || 0})</span>
                          </div>
                          <span className={`drawer-arrow ${isExpanded ? 'rotated' : ''}`}>›</span>
                        </div>

                        {/* Sous-menu des catégories spécifiques à cette boutique */}
                        {isExpanded && (
                          <div className="drawer-subcats">
                            <button
                              type="button"
                              className="drawer-subcat-link main-shop"
                              onClick={() => {
                                setDrawerOpen(false);
                                navigate(`/?boutique=${shop._id}`);
                              }}
                            >
                              {t('see_all_products_of', { shop: shop.nom })}
                            </button>

                            {shop.categories && shop.categories.length > 0 ? (
                              shop.categories.map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  className="drawer-subcat-link"
                                  onClick={() => {
                                    setDrawerOpen(false);
                                    navigate(`/?boutique=${shop._id}&categorie=${encodeURIComponent(c)}`);
                                  }}
                                >
                                  🏷️ {tCat(c)}
                                </button>
                              ))
                            ) : (
                              <div className="drawer-no-cat">{t('no_cats_for_shop')}</div>
                            )}

                            <button
                              type="button"
                              className="drawer-subcat-link store-profile"
                              onClick={() => {
                                setDrawerOpen(false);
                                navigate(`/stores/${shop._id}`);
                              }}
                            >
                              {t('store_info')}
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* ===== SECTION 2 : CATÉGORIES GLOBALES ===== */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">{t('all_our_categories')}</h3>
                <ul className="drawer-list">
                  {categoriesList.map((c) => (
                    <li key={c.value}>
                      <button
                        type="button"
                        className="drawer-item"
                        onClick={() => {
                          setDrawerOpen(false);
                          navigate(`/?categorie=${encodeURIComponent(c.value)}`);
                        }}
                      >
                        <span className="drawer-cat-left">
                          <span style={{ fontSize: 16 }}>{c.emoji}</span>
                          <span>{tCat(c.label)}</span>
                        </span>
                        <span className="drawer-arrow">›</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </div>

              {/* ===== SECTION 3 : PROGRAMMES ET ACCÈS RAPIDES ===== */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">{t('discover_shoply')}</h3>
                <ul className="drawer-list">
                  <li>
                    <Link to="/stores" className="drawer-item" onClick={() => setDrawerOpen(false)}>
                      <span>🏪 {t('all_stores')}</span>
                      <span className="drawer-arrow">›</span>
                    </Link>
                  </li>
                  <li>
                    <Link to="/products" className="drawer-item" onClick={() => setDrawerOpen(false)}>
                      <span>🏷️ {t('catalog')}</span>
                      <span className="drawer-arrow">›</span>
                    </Link>
                  </li>
                  {user?.role === 'vendeur' ? (
                    <li>
                      <Link to="/seller" className="drawer-item highlight" onClick={() => setDrawerOpen(false)}>
                        <span>📊 {t('seller_space')}</span>
                        <span className="drawer-arrow">›</span>
                      </Link>
                    </li>
                  ) : !user ? (
                    <li>
                      <Link to="/register" className="drawer-item highlight" onClick={() => setDrawerOpen(false)}>
                        <span>💼 {t('sell_on_shoply')}</span>
                        <span className="drawer-arrow">›</span>
                      </Link>
                    </li>
                  ) : null}
                </ul>
              </div>

              {/* ===== SECTION 4 : AIDE ET PARAMÈTRES ===== */}
              <div className="drawer-section">
                <h3 className="drawer-section-title">{t('help_and_settings')}</h3>
                <ul className="drawer-list">
                  {user ? (
                    <>
                      <li>
                        <Link to="/profile" className="drawer-item" onClick={() => setDrawerOpen(false)}>
                          <span>👤 {t('my_profile')}</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/orders" className="drawer-item" onClick={() => setDrawerOpen(false)}>
                          <span>📦 {t('my_orders')}</span>
                        </Link>
                      </li>
                      {isClient && (
                        <>
                          <li>
                            <Link to="/dashboard" className="drawer-item" onClick={() => setDrawerOpen(false)}>
                              <span>📊 {t('client_space')}</span>
                            </Link>
                          </li>
                          <li>
                            <Link to="/my-reviews" className="drawer-item" onClick={() => setDrawerOpen(false)}>
                              <span>⭐ {t('my_reviews')}</span>
                            </Link>
                          </li>
                          <li>
                            <Link to="/my-refunds" className="drawer-item" onClick={() => setDrawerOpen(false)}>
                              <span>💰 {t('my_refunds')}</span>
                            </Link>
                          </li>
                        </>
                      )}
                      <li>
                        <button type="button" className="drawer-item logout" onClick={handleLogout}>
                          <span>🚪 {t('sign_out')}</span>
                        </button>
                      </li>
                    </>
                  ) : (
                    <>
                      <li>
                        <Link to="/login" className="drawer-item" onClick={() => setDrawerOpen(false)}>
                          <span>🔑 {t('sign_in')}</span>
                        </Link>
                      </li>
                      <li>
                        <Link to="/register" className="drawer-item" onClick={() => setDrawerOpen(false)}>
                          <span>✨ {t('start_here')}</span>
                        </Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
