import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../constants/categories';
import { colorToCss } from '../constants/colors';
import ImageUpload from '../components/ImageUpload';
import StarRating from '../components/StarRating';
import { PLACEHOLDER } from '../components/ProductCard';
import '../styles/shop.css';
import '../styles/seller.css';

export default function SellerDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  // Notifications / Alert messages
  const [toast, setToast] = useState({ type: '', text: '' });
  const showToast = (text, type = 'ok') => {
    setToast({ text, type });
    setTimeout(() => setToast({ text: '', type: '' }), 4000);
  };

  const setTab = (tabName) => {
    setSearchParams({ tab: tabName });
  };

  // =========================================================================
  // 1. STATS (Tableau de bord)
  // =========================================================================
  const [stats, setStats] = useState(null);

  const loadStats = async () => {
    try {
      const { data } = await api.get('/stats/seller');
      if (data.success) {
        setStats(data.data);
      }
    } catch {
      // silencieux
    }
  };

  // =========================================================================
  // 2. BOUTIQUE
  // =========================================================================
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopForm, setShopForm] = useState({
    nom: '',
    description: '',
    logo: '',
    banniere: '',
    telephone: '',
    email: '',
    rue: '',
    ville: '',
    codePostal: '',
    pays: 'Tunisie',
    statut: 'active',
    motifFermeture: ''
  });

  const loadShop = async () => {
    setShopLoading(true);
    try {
      const { data } = await api.get('/shops/mine');
      if (data.success && data.data) {
        setShop(data.data);
        setShopForm({
          nom: data.data.nom || '',
          description: data.data.description || '',
          logo: data.data.logo || '',
          banniere: data.data.banniere || '',
          telephone: data.data.telephone || '',
          email: data.data.email || '',
          rue: data.data.adresse?.rue || '',
          ville: data.data.adresse?.ville || '',
          codePostal: data.data.adresse?.codePostal || '',
          pays: data.data.adresse?.pays || 'Tunisie',
          statut: data.data.statut || 'active',
          motifFermeture: data.data.motifFermeture || ''
        });
      } else {
        setShop(null);
      }
    } catch {
      setShop(null);
    } finally {
      setShopLoading(false);
    }
  };

  const handleSaveShop = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nom: shopForm.nom,
        description: shopForm.description,
        logo: shopForm.logo,
        banniere: shopForm.banniere,
        telephone: shopForm.telephone,
        email: shopForm.email,
        adresse: {
          rue: shopForm.rue,
          ville: shopForm.ville,
          codePostal: shopForm.codePostal,
          pays: shopForm.pays
        }
      };

      if (!shop) {
        const { data } = await api.post('/shops', payload);
        setShop(data.data);
        showToast('Boutique créée avec succès !');
      } else {
        const { data } = await api.put('/shops/mine', payload);
        setShop(data.data);
        showToast('Informations de la boutique mises à jour !');
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleUpdateShopStatus = async (newStatus) => {
    try {
      const motif = newStatus === 'fermee_temporairement'
        ? (shopForm.motifFermeture || 'Congé temporaire / Pause')
        : '';

      const { data } = await api.put('/shops/mine/status', {
        statut: newStatus,
        motifFermeture: motif
      });
      setShop(data.data);
      setShopForm((prev) => ({ ...prev, statut: newStatus, motifFermeture: motif }));
      showToast(data.message || 'Statut de la boutique actualisé !');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    }
  };

  // =========================================================================
  // 3. PRODUITS
  // =========================================================================
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [productCat, setProductCat] = useState('');
  const [productStockFilter, setProductStockFilter] = useState('');

  // Modals Produits
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [colorVariants, setColorVariants] = useState({});
  const [productForm, setProductForm] = useState({
    nom: '',
    description: '',
    prix: '',
    stock: '',
    categorie: '',
    marque: '',
    couleurs: '',
    seuilAlerteStock: 5,
    images: []
  });

  const loadProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (productSearch.trim()) params.set('search', productSearch.trim());
      if (productCat) params.set('categorie', productCat);
      if (productStockFilter) params.set('stockStatus', productStockFilter);

      const { data } = await api.get(`/products/seller?${params.toString()}`);
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch {
      setProducts([]);
    }
  };

  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setColorVariants({});
    setProductForm({
      nom: '',
      description: '',
      prix: '',
      stock: '',
      categorie: CATEGORIES[0]?.value || '',
      marque: '',
      couleurs: '',
      seuilAlerteStock: 5,
      images: []
    });
    setProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    const cvMap = {};
    if (prod.variantesCouleurs && prod.variantesCouleurs.length > 0) {
      prod.variantesCouleurs.forEach((v) => {
        if (v.couleur && v.image) cvMap[v.couleur.trim()] = v.image;
      });
    }
    setColorVariants(cvMap);
    setProductForm({
      nom: prod.nom,
      description: prod.description,
      prix: prod.prix,
      stock: prod.stock,
      categorie: prod.categorie,
      marque: prod.marque || '',
      couleurs: (prod.couleurs || []).join(', '),
      seuilAlerteStock: prod.seuilAlerteStock !== undefined ? prod.seuilAlerteStock : 5,
      images: prod.images || []
    });
    setProductModalOpen(true);
  };

  const handleAddProductImage = (url) => {
    if (!url) return;
    setProductForm((prev) => ({
      ...prev,
      images: [...prev.images, url]
    }));
  };

  const handleRemoveProductImage = (index) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSetColorImage = (colorName, url) => {
    const trimmed = colorName.trim();
    setColorVariants((prev) => ({
      ...prev,
      [trimmed]: url
    }));
    // Si une photo est ajoutée pour cette couleur, l'ajouter également à la galerie principale si absente
    if (url) {
      setProductForm((prev) => {
        if (prev.images.includes(url)) return prev;
        return { ...prev, images: [...prev.images, url] };
      });
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const parsedColors = productForm.couleurs
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean);

      // Préparer les variantes de couleur avec leurs images correspondantes
      const variantesCouleurs = parsedColors
        .map((c) => ({
          couleur: c,
          image: colorVariants[c] || colorVariants[c.toLowerCase()] || ''
        }))
        .filter((v) => v.image);

      // Fusionner toutes les photos (galerie générale + variantes de couleur)
      const colorImages = Object.values(colorVariants).filter(Boolean);
      const combinedImages = [...new Set([...productForm.images, ...colorImages])].filter(Boolean);

      const payload = {
        nom: productForm.nom,
        description: productForm.description,
        prix: Number(productForm.prix),
        stock: Number(productForm.stock),
        categorie: productForm.categorie,
        marque: productForm.marque,
        couleurs: parsedColors,
        variantesCouleurs,
        seuilAlerteStock: Number(productForm.seuilAlerteStock) || 5,
        images: combinedImages.length > 0 ? combinedImages : [PLACEHOLDER]
      };

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, payload);
        showToast('Produit mis à jour avec succès !');
      } else {
        await api.post('/products', payload);
        showToast('Nouveau produit ajouté au catalogue !');
      }

      setProductModalOpen(false);
      loadProducts();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  };

  const handleDeleteProduct = async (prodId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ou archiver ce produit ?')) return;
    try {
      const { data } = await api.delete(`/products/${prodId}`);
      showToast(data.message || 'Produit supprimé !');
      loadProducts();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    }
  };

  // =========================================================================
  // 4. PROMOTIONS
  // =========================================================================
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [selectedPromoProduct, setSelectedPromoProduct] = useState(null);
  const [promoForm, setPromoForm] = useState({
    active: true,
    pourcentage: 20,
    dateDebut: '',
    dateFin: ''
  });

  const handleOpenPromoModal = (prod) => {
    setSelectedPromoProduct(prod);
    setPromoForm({
      active: prod.promotion?.active || true,
      pourcentage: prod.promotion?.pourcentage || 15,
      dateDebut: prod.promotion?.dateDebut ? prod.promotion.dateDebut.split('T')[0] : '',
      dateFin: prod.promotion?.dateFin ? prod.promotion.dateFin.split('T')[0] : ''
    });
    setPromoModalOpen(true);
  };

  const handleSavePromo = async (e) => {
    e.preventDefault();
    if (!selectedPromoProduct) return;
    try {
      const { data } = await api.put(`/products/${selectedPromoProduct._id}/promotion`, promoForm);
      showToast(data.message || 'Promotion mise à jour !');
      setPromoModalOpen(false);
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    }
  };

  const handleTogglePromo = async (prod) => {
    try {
      const isCurrentlyActive = prod.promotion?.active;
      const { data } = await api.put(`/products/${prod._id}/promotion`, {
        active: !isCurrentlyActive,
        pourcentage: prod.promotion?.pourcentage || 10
      });
      showToast(data.message);
      loadProducts();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    }
  };

  // =========================================================================
  // 5. COMMANDES VENDEUR
  // =========================================================================
  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');

  // Modal Annulation
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelingOrder, setCancelingOrder] = useState(null);
  const [cancelMotif, setCancelMotif] = useState('');

  const loadOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (orderStatusFilter && orderStatusFilter !== 'all') params.set('statut', orderStatusFilter);
      if (orderSearch.trim()) params.set('search', orderSearch.trim());

      const { data } = await api.get(`/orders/seller?${params.toString()}`);
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch {
      setOrders([]);
    }
  };

  const handleAdvanceOrderStatus = async (orderId, nextStatus) => {
    try {
      const { data } = await api.put(`/orders/seller/${orderId}/status`, { statut: nextStatus });
      showToast(data.message);
      loadOrders();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors du changement de statut', 'error');
    }
  };

  const handleOpenCancelOrder = (order) => {
    setCancelingOrder(order);
    setCancelMotif('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancelOrder = async (e) => {
    e.preventDefault();
    if (!cancelingOrder) return;
    try {
      const { data } = await api.put(`/orders/seller/${cancelingOrder._id}/cancel`, {
        motif: cancelMotif
      });
      showToast(data.message);
      setCancelModalOpen(false);
      loadOrders();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de l\'annulation', 'error');
    }
  };

  // =========================================================================
  // 6. STOCKS & ALERTES
  // =========================================================================
  const [stocks, setStocks] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [stockFilter, setStockFilter] = useState('all');
  const [stockEdits, setStockEdits] = useState({});

  const loadStocks = async () => {
    try {
      const { data } = await api.get('/stocks/seller');
      if (data.success) {
        setStocks(data.data || []);
        setStockSummary(data.summary);
        // Init edit values
        const initial = {};
        (data.data || []).forEach((item) => {
          initial[item._id] = { stock: item.stock, seuilAlerteStock: item.seuilAlerteStock };
        });
        setStockEdits(initial);
      }
    } catch {
      setStocks([]);
    }
  };

  const handleStockInputChange = (prodId, field, val) => {
    setStockEdits((prev) => ({
      ...prev,
      [prodId]: {
        ...prev[prodId],
        [field]: Number(val)
      }
    }));
  };

  const handleSaveStockItem = async (prodId) => {
    const edit = stockEdits[prodId];
    if (!edit) return;
    try {
      const { data } = await api.put(`/stocks/seller/${prodId}`, {
        stock: edit.stock,
        seuilAlerteStock: edit.seuilAlerteStock
      });
      showToast(data.message);
      loadStocks();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    }
  };

  // =========================================================================
  // 7. AVIS CLIENTS & RÉPONSES
  // =========================================================================
  const [reviews, setReviews] = useState([]);
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyReview, setReplyReview] = useState(null);
  const [replyText, setReplyText] = useState('');

  const loadReviews = async () => {
    try {
      const { data } = await api.get('/reviews/seller');
      if (data.success) {
        setReviews(data.data || []);
      }
    } catch {
      setReviews([]);
    }
  };

  const handleOpenReplyModal = (rev) => {
    setReplyReview(rev);
    setReplyText(rev.reponseVendeur?.texte || '');
    setReplyModalOpen(true);
  };

  const handleSaveReply = async (e) => {
    e.preventDefault();
    if (!replyReview) return;
    try {
      const { data } = await api.post(`/reviews/${replyReview._id}/reply`, { texte: replyText });
      showToast(data.message);
      setReplyModalOpen(false);
      loadReviews();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la réponse', 'error');
    }
  };

  const handleDeleteReply = async (revId) => {
    if (!window.confirm('Voulez-vous supprimer votre réponse à cet avis ?')) return;
    try {
      const { data } = await api.delete(`/reviews/${revId}/reply`);
      showToast(data.message);
      loadReviews();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur', 'error');
    }
  };

  // =========================================================================
  // 8. REMBOURSEMENTS
  // =========================================================================
  const [refunds, setRefunds] = useState([]);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundDecision, setRefundDecision] = useState('approuvee');
  const [refundResponse, setRefundResponse] = useState('');

  const loadRefunds = async () => {
    try {
      const { data } = await api.get('/refunds/seller');
      if (data.success) {
        setRefunds(data.data || []);
      }
    } catch {
      setRefunds([]);
    }
  };

  const handleOpenProcessRefund = (refItem, decision) => {
    setSelectedRefund(refItem);
    setRefundDecision(decision);
    setRefundResponse('');
    setRefundModalOpen(true);
  };

  const handleConfirmProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedRefund) return;
    try {
      const { data } = await api.put(`/refunds/seller/${selectedRefund._id}/process`, {
        decision: refundDecision,
        reponseVendeur: refundResponse
      });
      showToast(data.message);
      setRefundModalOpen(false);
      loadRefunds();
      loadStats();
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors du traitement', 'error');
    }
  };

  // =========================================================================
  // EFFETS DE CHARGEMENT PAR ONGLET
  // =========================================================================
  useEffect(() => {
    loadShop();
    loadStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'dashboard') loadStats();
    else if (activeTab === 'shop') loadShop();
    else if (activeTab === 'products' || activeTab === 'promotions') loadProducts();
    else if (activeTab === 'orders') loadOrders();
    else if (activeTab === 'stocks') loadStocks();
    else if (activeTab === 'reviews') loadReviews();
    else if (activeTab === 'refunds') loadRefunds();
  }, [activeTab]);

  return (
    <div className="seller-layout">
      {/* Toast notifications */}
      {toast.text && (
        <div className={`toast ${toast.type === 'error' ? 'alert error' : ''}`} style={{ zIndex: 1100 }}>
          {toast.text}
        </div>
      )}

      {/* ===================== SIDEBAR ===================== */}
      <aside className="seller-sidebar">
        <div className="seller-brand">
          <div className="seller-brand-icon">🏪</div>
          <div className="seller-brand-text">
            <h2>{shop?.nom || 'Espace Vendeur'}</h2>
            <p>{shop ? `Statut : ${shop.statut}` : 'Configuration requise'}</p>
          </div>
        </div>

        <nav className="seller-nav">
          <button
            type="button"
            className={`seller-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setTab('dashboard')}
          >
            <span>📊</span> Tableau de bord
          </button>

          <button
            type="button"
            className={`seller-nav-item ${activeTab === 'shop' ? 'active' : ''}`}
            onClick={() => setTab('shop')}
          >
            <span>🏪</span> Ma Boutique
          </button>

          <button
            type="button"
            className={`seller-nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setTab('products')}
          >
            <span>📦</span> Produits
          </button>

          <button
            type="button"
            className={`seller-nav-item ${activeTab === 'promotions' ? 'active' : ''}`}
            onClick={() => setTab('promotions')}
          >
            <span>🏷️</span> Promotions
          </button>

          <button
            type="button"
            className={`seller-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setTab('orders')}
          >
            <span>🚚</span> Commandes
            {stats?.commandesEnAttente > 0 && (
              <span className="seller-nav-badge">{stats.commandesEnAttente}</span>
            )}
          </button>

          <button
            type="button"
            className={`seller-nav-item ${activeTab === 'stocks' ? 'active' : ''}`}
            onClick={() => setTab('stocks')}
          >
            <span>📈</span> Stocks & Alertes
            {stats?.alertesStock > 0 && (
              <span className="seller-nav-badge" style={{ background: '#f59e0b' }}>
                {stats.alertesStock}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`seller-nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setTab('reviews')}
          >
            <span>⭐</span> Avis clients
          </button>

          <button
            type="button"
            className={`seller-nav-item ${activeTab === 'refunds' ? 'active' : ''}`}
            onClick={() => setTab('refunds')}
          >
            <span>💰</span> Remboursements
          </button>
        </nav>
      </aside>

      {/* ===================== CONTENU PRINCIPAL ===================== */}
      <main className="seller-main">
        {/* ========================================================================= */}
        {/* ONGLET 1 : TABLEAU DE BORD (DASHBOARD) */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="seller-header">
              <div className="seller-title-group">
                <h1>Bonjour, {user?.prenom || user?.nom} 👋</h1>
                <p>Voici l'état des ventes et des activités de votre boutique Shoply.</p>
              </div>
              <div className="seller-header-actions">
                <button type="button" className="btn-seller-primary" onClick={handleOpenAddProduct}>
                  ➕ Nouveau Produit
                </button>
                {shop && (
                  <Link to={`/stores/${shop._id}`} target="_blank" className="btn-seller-secondary">
                    👁️ Voir ma boutique
                  </Link>
                )}
              </div>
            </div>

            {/* KPIs Grid */}
            <div className="kpi-grid">
              <div className="kpi-card">
                <div className="kpi-icon orange">💰</div>
                <div className="kpi-data">
                  <span>Chiffre d'Affaires</span>
                  <strong>{stats ? Number(stats.chiffreAffaires).toFixed(2) : '0.00'} <small style={{ fontSize: 13 }}>TND</small></strong>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon blue">📦</div>
                <div className="kpi-data">
                  <span>Commandes traitées</span>
                  <strong>{stats?.totalCommandes || 0}</strong>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon emerald">🛍️</div>
                <div className="kpi-data">
                  <span>Articles vendus</span>
                  <strong>{stats?.articlesVendus || 0}</strong>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon amber">🏷️</div>
                <div className="kpi-data">
                  <span>Panier moyen</span>
                  <strong>{stats ? Number(stats.panierMoyen).toFixed(2) : '0.00'} <small style={{ fontSize: 13 }}>TND</small></strong>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon purple">⏳</div>
                <div className="kpi-data">
                  <span>Commandes en attente</span>
                  <strong style={{ color: stats?.commandesEnAttente > 0 ? '#ea580c' : 'inherit' }}>
                    {stats?.commandesEnAttente || 0}
                  </strong>
                </div>
              </div>

              <div className="kpi-card">
                <div className="kpi-icon rose">⚠️</div>
                <div className="kpi-data">
                  <span>Alertes stock</span>
                  <strong style={{ color: stats?.alertesStock > 0 ? '#dc2626' : 'inherit' }}>
                    {stats?.alertesStock || 0}
                  </strong>
                </div>
              </div>
            </div>

            {/* Graphique et Top Produits */}
            <div className="seller-grid-2">
              {/* Ventes récentes */}
              <div className="seller-card">
                <div className="seller-card-header">
                  <h3>📊 Progression des ventes (7 derniers jours)</h3>
                </div>
                {stats?.ventesParPeriode && (
                  <div className="chart-bars">
                    {stats.ventesParPeriode.map((bar) => {
                      const maxVal = Math.max(...stats.ventesParPeriode.map((b) => b.total), 50);
                      const heightPct = Math.max(8, Math.round((bar.total / maxVal) * 100));
                      return (
                        <div key={bar.date} className="chart-bar-col">
                          <span className="chart-bar-val">{bar.total > 0 ? `${Math.round(bar.total)}` : ''}</span>
                          <div className="chart-bar" style={{ height: `${heightPct}%` }} />
                          <span className="chart-bar-label">{bar.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Top 5 Produits */}
              <div className="seller-card">
                <div className="seller-card-header">
                  <h3>🔥 Meilleurs produits</h3>
                  <button type="button" className="link-btn" onClick={() => setTab('products')}>
                    Voir tout
                  </button>
                </div>
                {!stats?.meilleursProduits || stats.meilleursProduits.length === 0 ? (
                  <p className="muted" style={{ padding: '20px 0', textAlign: 'center' }}>
                    Aucune vente enregistrée pour le moment.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {stats.meilleursProduits.map((item, idx) => (
                      <div key={item._id || idx} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontWeight: 800, color: '#ea580c', width: 18 }}>#{idx + 1}</span>
                        <img
                          src={item.image || PLACEHOLDER}
                          alt=""
                          style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'contain', background: '#f8fafc' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: 13, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.nom}
                          </strong>
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            {item.quantiteVendue} vente(s) • {Number(item.totalVentes).toFixed(2)} TND
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 2 : MA BOUTIQUE */}
        {/* ========================================================================= */}
        {activeTab === 'shop' && (
          <div style={{ maxWidth: 850 }}>
            <div className="seller-header">
              <div className="seller-title-group">
                <h1>🏪 Gestion de ma boutique</h1>
                <p>Configurez l'identité, les coordonnées et les horaires d'ouverture de votre boutique.</p>
              </div>
              {shop && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to={`/stores/${shop._id}`} target="_blank" className="btn-seller-secondary">
                    👁️ Voir la page publique
                  </Link>
                </div>
              )}
            </div>

            {/* Statut d'ouverture switcher */}
            <div className="seller-card" style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 16 }}>Statut d'ouverture de la boutique</h3>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={shopForm.statut === 'active' ? 'btn-seller-success' : 'btn-seller-secondary'}
                  onClick={() => handleUpdateShopStatus('active')}
                >
                  🟢 Ouverte (Active)
                </button>
                <button
                  type="button"
                  className={shopForm.statut === 'fermee_temporairement' ? 'btn-seller-primary' : 'btn-seller-secondary'}
                  onClick={() => handleUpdateShopStatus('fermee_temporairement')}
                >
                  🟡 Pause temporaire / Vacances
                </button>
                <button
                  type="button"
                  className={shopForm.statut === 'inactive' ? 'btn-seller-danger' : 'btn-seller-secondary'}
                  onClick={() => handleUpdateShopStatus('inactive')}
                >
                  🔴 Fermée (Inactive)
                </button>
              </div>

              {shopForm.statut === 'fermee_temporairement' && (
                <div style={{ marginTop: 14 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
                    Motif de la fermeture temporaire (visible par les clients) :
                  </label>
                  <input
                    className="filter-input"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    placeholder="Ex: Fermé pour congés annuels du 15 au 25 août."
                    value={shopForm.motifFermeture}
                    onChange={(e) => setShopForm({ ...shopForm, motifFermeture: e.target.value })}
                  />
                  <button
                    type="button"
                    className="btn-seller-primary"
                    style={{ marginTop: 8 }}
                    onClick={() => handleUpdateShopStatus('fermee_temporairement')}
                  >
                    Enregistrer le motif
                  </button>
                </div>
              )}
            </div>

            {/* Formulaire des infos de la boutique */}
            <form onSubmit={handleSaveShop} className="seller-card">
              <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Informations Générales</h3>

              <div className="field">
                <label>Nom de la boutique *</label>
                <input
                  required
                  value={shopForm.nom}
                  onChange={(e) => setShopForm({ ...shopForm, nom: e.target.value })}
                  placeholder="Ex: Electro Express Tunis"
                />
              </div>

              <div className="field">
                <label>Description de votre boutique</label>
                <textarea
                  rows={3}
                  value={shopForm.description}
                  onChange={(e) => setShopForm({ ...shopForm, description: e.target.value })}
                  placeholder="Présentez vos spécialités, engagements et garanties..."
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="row2">
                <div className="field">
                  <label>Numéro de téléphone</label>
                  <input
                    value={shopForm.telephone}
                    onChange={(e) => setShopForm({ ...shopForm, telephone: e.target.value })}
                    placeholder="Ex: +216 71 123 456"
                  />
                </div>
                <div className="field">
                  <label>Adresse email professionnelle</label>
                  <input
                    type="email"
                    value={shopForm.email}
                    onChange={(e) => setShopForm({ ...shopForm, email: e.target.value })}
                    placeholder="contact@maboutique.tn"
                  />
                </div>
              </div>

              <div style={{ margin: '20px 0', padding: '16px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>📍 Adresse de la boutique</h4>
                <div className="field">
                  <label>Rue & Numéro</label>
                  <input
                    value={shopForm.rue}
                    onChange={(e) => setShopForm({ ...shopForm, rue: e.target.value })}
                    placeholder="12 Avenue Habib Bourguiba"
                  />
                </div>
                <div className="row2">
                  <div className="field">
                    <label>Ville</label>
                    <input
                      value={shopForm.ville}
                      onChange={(e) => setShopForm({ ...shopForm, ville: e.target.value })}
                      placeholder="Tunis"
                    />
                  </div>
                  <div className="field">
                    <label>Code Postal</label>
                    <input
                      value={shopForm.codePostal}
                      onChange={(e) => setShopForm({ ...shopForm, codePostal: e.target.value })}
                      placeholder="1000"
                    />
                  </div>
                </div>
              </div>

              {/* Logo & Bannière */}
              <div className="row2" style={{ margin: '20px 0' }}>
                <div className="field">
                  <label>Logo de la boutique</label>
                  <ImageUpload
                    value={shopForm.logo}
                    label="Choisir le logo"
                    size={90}
                    onChange={(url) => setShopForm({ ...shopForm, logo: url })}
                  />
                </div>
                <div className="field">
                  <label>Bannière d'en-tête (large)</label>
                  <ImageUpload
                    value={shopForm.banniere}
                    label="Choisir la bannière"
                    size={90}
                    onChange={(url) => setShopForm({ ...shopForm, banniere: url })}
                  />
                </div>
              </div>

              <button type="submit" className="btn-seller-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
                💾 {shop ? 'Enregistrer les modifications' : 'Créer ma boutique'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 3 : PRODUITS */}
        {/* ========================================================================= */}
        {activeTab === 'products' && (
          <div>
            <div className="seller-header">
              <div className="seller-title-group">
                <h1>📦 Gestion des Produits ({products.length})</h1>
                <p>Consultez, recherchez, ajoutez et gérez vos produits en vente.</p>
              </div>
              <button type="button" className="btn-seller-primary" onClick={handleOpenAddProduct}>
                ➕ Ajouter un produit
              </button>
            </div>

            {/* Filtres de recherche */}
            <div className="filter-bar">
              <input
                className="filter-input"
                placeholder="Rechercher par nom..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
              />
              <select
                className="filter-input"
                value={productCat}
                onChange={(e) => setProductCat(e.target.value)}
              >
                <option value="">Toutes les catégories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <select
                className="filter-input"
                value={productStockFilter}
                onChange={(e) => setProductStockFilter(e.target.value)}
              >
                <option value="">Tous les stocks</option>
                <option value="in_stock">En stock suffisant</option>
                <option value="low_stock">Stock faible (alerte)</option>
                <option value="out_of_stock">Rupture de stock</option>
              </select>
              <button type="button" className="btn-seller-secondary" onClick={loadProducts}>
                🔍 Filtrer
              </button>
            </div>

            {/* Table des produits */}
            <div className="seller-table-wrap">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Article</th>
                    <th>Catégorie</th>
                    <th>Prix standard</th>
                    <th>Promotion</th>
                    <th>Stock dispo</th>
                    <th>Statut</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                        Aucun produit trouvé.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const isLow = p.stock > 0 && p.stock <= (p.seuilAlerteStock || 5);
                      const isOut = p.stock <= 0;
                      return (
                        <tr key={p._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img
                                src={p.images?.[0] || PLACEHOLDER}
                                alt=""
                                style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, background: '#f8fafc', border: '1px solid #e2e8f0' }}
                              />
                              <div>
                                <strong style={{ display: 'block', fontSize: 14 }}>{p.nom}</strong>
                                {p.marque && <small style={{ color: '#64748b' }}>{p.marque}</small>}
                              </div>
                            </div>
                          </td>
                          <td>{p.categorie}</td>
                          <td><strong>{Number(p.prix).toFixed(2)} TND</strong></td>
                          <td>
                            {p.promotion?.active && p.promotion?.pourcentage > 0 ? (
                              <span className="badge-status active">
                                -{p.promotion.pourcentage}% ({Number(p.promotion.prixPromo || p.prixFinal).toFixed(2)} TND)
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: 13 }}>Aucune</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge-status ${isOut ? 'rupture' : isLow ? 'alerte' : 'normal'}`}>
                              {p.stock} unités
                            </span>
                          </td>
                          <td>
                            <span className={`badge-status ${p.statut === 'actif' ? 'active' : 'inactive'}`}>
                              {p.statut}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 6 }}>
                              <button
                                type="button"
                                className="btn-seller-secondary"
                                title="Configurer promotion"
                                onClick={() => handleOpenPromoModal(p)}
                              >
                                🏷️ Promo
                              </button>
                              <button
                                type="button"
                                className="btn-seller-secondary"
                                title="Modifier produit"
                                onClick={() => handleOpenEditProduct(p)}
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn-seller-danger"
                                title="Supprimer ou archiver"
                                onClick={() => handleDeleteProduct(p._id)}
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 4 : PROMOTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'promotions' && (
          <div>
            <div className="seller-header">
              <div className="seller-title-group">
                <h1>🏷️ Gestion des Promotions & Rabais</h1>
                <p>Augmentez vos ventes en activant des remises en pourcentage sur votre catalogue.</p>
              </div>
            </div>

            <div className="seller-table-wrap">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Prix Catalogue</th>
                    <th>Rabais (%)</th>
                    <th>Prix Promotionnel</th>
                    <th>Période de Validité</th>
                    <th>État</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                        Aucun produit dans le catalogue.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const hasPromo = p.promotion?.active && p.promotion?.pourcentage > 0;
                      return (
                        <tr key={p._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img
                                src={p.images?.[0] || PLACEHOLDER}
                                alt=""
                                style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, background: '#f8fafc' }}
                              />
                              <strong>{p.nom}</strong>
                            </div>
                          </td>
                          <td>{Number(p.prix).toFixed(2)} TND</td>
                          <td>
                            {hasPromo ? (
                              <strong style={{ color: '#ea580c' }}>-{p.promotion.pourcentage}%</strong>
                            ) : (
                              '0%'
                            )}
                          </td>
                          <td>
                            {hasPromo ? (
                              <strong style={{ color: '#dc2626' }}>
                                {Number(p.promotion.prixPromo || p.prixFinal).toFixed(2)} TND
                              </strong>
                            ) : (
                              `${Number(p.prix).toFixed(2)} TND`
                            )}
                          </td>
                          <td style={{ fontSize: 12, color: '#64748b' }}>
                            {p.promotion?.dateDebut || p.promotion?.dateFin ? (
                              <>
                                {p.promotion.dateDebut ? new Date(p.promotion.dateDebut).toLocaleDateString('fr-FR') : 'Immédiat'}
                                {' au '}
                                {p.promotion.dateFin ? new Date(p.promotion.dateFin).toLocaleDateString('fr-FR') : 'Indéterminé'}
                              </>
                            ) : (
                              'Permanente'
                            )}
                          </td>
                          <td>
                            <span className={`badge-status ${hasPromo ? 'active' : 'inactive'}`}>
                              {hasPromo ? 'En promotion' : 'Prix normal'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: 8 }}>
                              <button
                                type="button"
                                className="btn-seller-secondary"
                                onClick={() => handleOpenPromoModal(p)}
                              >
                                Configurer
                              </button>
                              <button
                                type="button"
                                className={hasPromo ? 'btn-seller-danger' : 'btn-seller-primary'}
                                onClick={() => handleTogglePromo(p)}
                              >
                                {hasPromo ? 'Désactiver' : 'Activer'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 5 : COMMANDES VENDEUR */}
        {/* ========================================================================= */}
        {activeTab === 'orders' && (
          <div>
            <div className="seller-header">
              <div className="seller-title-group">
                <h1>🚚 Suivi & Expédition des Commandes ({orders.length})</h1>
                <p>Traitez les commandes clients contenant vos produits et suivez leur acheminement.</p>
              </div>
            </div>

            {/* Filtres de statut commande */}
            <div className="filter-bar">
              <select
                className="filter-input"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                <option value="en_attente">⏳ En attente</option>
                <option value="confirmee">✅ Confirmée</option>
                <option value="en_preparation">📦 En préparation</option>
                <option value="expediee">🚚 Expédiée</option>
                <option value="livree">🏠 Livrée</option>
                <option value="annulee">❌ Annulée</option>
              </select>

              <input
                className="filter-input"
                placeholder="Numéro de commande (ex: CMD-XXXX)..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
              />

              <button type="button" className="btn-seller-secondary" onClick={loadOrders}>
                🔍 Rechercher
              </button>
            </div>

            {/* Liste des commandes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {orders.length === 0 ? (
                <div className="seller-card empty">
                  <p>Aucune commande trouvée pour ces critères.</p>
                </div>
              ) : (
                orders.map((order) => {
                  return (
                    <div key={order._id} className="seller-card" style={{ padding: 18 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: 12, marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                        <div>
                          <strong style={{ fontSize: 16, color: '#0f172a' }}>
                            {order.numeroCommande}
                          </strong>
                          <span style={{ fontSize: 12, color: '#64748b', marginLeft: 12 }}>
                            Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <span className={`badge-status ${order.statut}`}>
                            {order.statut?.replace('_', ' ')}
                          </span>
                          <strong style={{ fontSize: 16 }}>
                            Part Vendeur : {Number(order.totalVendeur || order.total).toFixed(2)} TND
                          </strong>
                        </div>
                      </div>

                      {/* Destinataire & Articles */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 16 }}>
                        <div>
                          <h4 style={{ margin: '0 0 6px', fontSize: 13, color: '#64748b' }}>DESTINATAIRE & LIVRAISON</h4>
                          <strong style={{ fontSize: 14 }}>{order.adresseLivraison?.nomComplet || `${order.client?.prenom} ${order.client?.nom}`}</strong>
                          <p style={{ margin: '4px 0', fontSize: 13, color: '#334155' }}>
                            📍 {order.adresseLivraison?.rue}, {order.adresseLivraison?.ville} {order.adresseLivraison?.codePostal}
                          </p>
                          <p style={{ margin: '2px 0', fontSize: 13, color: '#334155' }}>
                            📞 Tél : {order.adresseLivraison?.telephone || order.client?.telephone || 'Non renseigné'}
                          </p>
                          {order.adresseLivraison?.instructions && (
                            <p style={{ margin: '4px 0', fontSize: 12, color: '#ea580c', background: '#fff7ed', padding: '4px 8px', borderRadius: 4 }}>
                              💬 Note : {order.adresseLivraison.instructions}
                            </p>
                          )}
                        </div>

                        <div>
                          <h4 style={{ margin: '0 0 6px', fontSize: 13, color: '#64748b' }}>ARTICLES DE VOTRE BOUTIQUE</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {(order.articlesVendeur || order.articles || []).map((item, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <img
                                  src={item.image || PLACEHOLDER}
                                  alt=""
                                  style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'contain', background: '#f8fafc' }}
                                />
                                <div style={{ fontSize: 13, flex: 1 }}>
                                  <strong>{item.nom}</strong> {item.couleur && <span style={{ color: '#ea580c' }}>({item.couleur})</span>}
                                  <div style={{ color: '#64748b' }}>
                                    Qté : {item.quantite} × {Number(item.prix).toFixed(2)} TND
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Boutons d'avancement de commande */}
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end', borderTop: '1px solid #f1f5f9', paddingTop: 12 }}>
                        {order.statut === 'en_attente' && (
                          <button
                            type="button"
                            className="btn-seller-primary"
                            onClick={() => handleAdvanceOrderStatus(order._id, 'confirmee')}
                          >
                            ✅ Confirmer la commande
                          </button>
                        )}

                        {order.statut === 'confirmee' && (
                          <button
                            type="button"
                            className="btn-seller-primary"
                            onClick={() => handleAdvanceOrderStatus(order._id, 'en_preparation')}
                          >
                            📦 Préparer le colis
                          </button>
                        )}

                        {order.statut === 'en_preparation' && (
                          <button
                            type="button"
                            className="btn-seller-primary"
                            onClick={() => handleAdvanceOrderStatus(order._id, 'expediee')}
                          >
                            🚚 Marquer comme expédiée
                          </button>
                        )}

                        {order.statut === 'expediee' && (
                          <button
                            type="button"
                            className="btn-seller-success"
                            onClick={() => handleAdvanceOrderStatus(order._id, 'livree')}
                          >
                            🏠 Confirmer la livraison client
                          </button>
                        )}

                        {!['livree', 'annulee'].includes(order.statut) && (
                          <button
                            type="button"
                            className="btn-seller-danger"
                            onClick={() => handleOpenCancelOrder(order)}
                          >
                            ❌ Annuler la commande
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 6 : STOCKS & ALERTES */}
        {/* ========================================================================= */}
        {activeTab === 'stocks' && (
          <div>
            <div className="seller-header">
              <div className="seller-title-group">
                <h1>📈 Inventaire & Alertes de Stock</h1>
                <p>Surveillez vos niveaux d'approvisionnement et réglez vos seuils d'alerte en temps réel.</p>
              </div>
              <button type="button" className="btn-seller-secondary" onClick={loadStocks}>
                🔄 Actualiser
              </button>
            </div>

            {/* Badges de synthèse */}
            {stockSummary && (
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-icon blue">📦</div>
                  <div className="kpi-data">
                    <span>Références actives</span>
                    <strong>{stockSummary.totalProducts}</strong>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon emerald">📊</div>
                  <div className="kpi-data">
                    <span>Quantité totale en stock</span>
                    <strong>{stockSummary.totalStockQuantity} unités</strong>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon rose">🔴</div>
                  <div className="kpi-data">
                    <span>Ruptures de stock</span>
                    <strong style={{ color: stockSummary.nbRupture > 0 ? '#dc2626' : 'inherit' }}>
                      {stockSummary.nbRupture}
                    </strong>
                  </div>
                </div>
                <div className="kpi-card">
                  <div className="kpi-icon amber">⚠️</div>
                  <div className="kpi-data">
                    <span>Alertes stock faible</span>
                    <strong style={{ color: stockSummary.nbAlerte > 0 ? '#d97706' : 'inherit' }}>
                      {stockSummary.nbAlerte}
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Filtre de niveau de stock */}
            <div className="filter-bar" style={{ marginTop: 12 }}>
              <select
                className="filter-input"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="all">Tous les produits</option>
                <option value="rupture">🔴 En rupture (0)</option>
                <option value="alerte">⚠️ Stock critique (sous le seuil)</option>
                <option value="normal">🟢 Stock normal (suffisant)</option>
              </select>
            </div>

            {/* Tableau d'inventaire */}
            <div className="seller-table-wrap">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Catégorie</th>
                    <th>Prix</th>
                    <th>Quantité en stock</th>
                    <th>Seuil d'alerte</th>
                    <th>État du Stock</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.filter((item) => stockFilter === 'all' || item.statutStock === stockFilter).length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#64748b' }}>
                        Aucun produit trouvé pour ce filtre.
                      </td>
                    </tr>
                  ) : (
                    stocks
                      .filter((item) => stockFilter === 'all' || item.statutStock === stockFilter)
                      .map((item) => {
                      const edit = stockEdits[item._id] || { stock: item.stock, seuilAlerteStock: item.seuilAlerteStock };
                      return (
                        <tr key={item._id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <img
                                src={item.images?.[0] || PLACEHOLDER}
                                alt=""
                                style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 6, background: '#f8fafc' }}
                              />
                              <strong>{item.nom}</strong>
                            </div>
                          </td>
                          <td>{item.categorie}</td>
                          <td>{Number(item.prix).toFixed(2)} TND</td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="filter-input"
                              style={{ width: 80, padding: '6px 8px' }}
                              value={edit.stock}
                              onChange={(e) => handleStockInputChange(item._id, 'stock', e.target.value)}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              min="0"
                              className="filter-input"
                              style={{ width: 80, padding: '6px 8px' }}
                              value={edit.seuilAlerteStock}
                              onChange={(e) => handleStockInputChange(item._id, 'seuilAlerteStock', e.target.value)}
                            />
                          </td>
                          <td>
                            <span className={`badge-status ${item.statutStock}`}>
                              {item.statutStock === 'rupture' ? 'Rupture' : item.statutStock === 'alerte' ? 'Stock critique' : 'Normal'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-seller-primary"
                              onClick={() => handleSaveStockItem(item._id)}
                            >
                              💾 Enregistrer
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 7 : AVIS CLIENTS */}
        {/* ========================================================================= */}
        {activeTab === 'reviews' && (
          <div>
            <div className="seller-header">
              <div className="seller-title-group">
                <h1>⭐ Avis Clients & Réponses Vendeur ({reviews.length})</h1>
                <p>Consultez les retours d'expérience de vos acheteurs et répondez publiquement à leurs avis.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {reviews.length === 0 ? (
                <div className="seller-card empty">
                  <p>Aucun avis reçu pour le moment sur vos produits.</p>
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev._id} className="seller-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <img
                          src={rev.produit?.images?.[0] || PLACEHOLDER}
                          alt=""
                          style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 6, background: '#f8fafc' }}
                        />
                        <div>
                          <strong>{rev.produit?.nom}</strong>
                          <div style={{ fontSize: 13, color: '#64748b' }}>
                            Par <strong>{rev.client ? `${rev.client.prenom} ${rev.client.nom}` : 'Client'}</strong>
                            {rev.achatVerifie && (
                              <span style={{ marginLeft: 8, fontSize: 11, background: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>
                                ✓ Achat vérifié
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <StarRating rating={rev.note} size={16} />
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {new Date(rev.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {rev.titre && <strong style={{ fontSize: 14, display: 'block', margin: '6px 0 2px' }}>{rev.titre}</strong>}
                    <p style={{ margin: '4px 0 12px', fontSize: 14, color: '#334155', lineHeight: 1.5 }}>
                      {rev.commentaire}
                    </p>

                    {/* Réponse vendeur existante */}
                    {rev.reponseVendeur?.texte ? (
                      <div style={{ background: '#fff7ed', padding: 12, borderRadius: 8, borderLeft: '4px solid #ea580c', marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <strong style={{ fontSize: 13, color: '#c2410c' }}>
                            🏪 Votre réponse :
                          </strong>
                          {rev.reponseVendeur.dateReponse && (
                            <span style={{ fontSize: 11, color: '#94a3b8' }}>
                              {new Date(rev.reponseVendeur.dateReponse).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: '#431407' }}>
                          {rev.reponseVendeur.texte}
                        </p>
                      </div>
                    ) : null}

                    {/* Actions de réponse */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-seller-secondary"
                        onClick={() => handleOpenReplyModal(rev)}
                      >
                        {rev.reponseVendeur?.texte ? '✏️ Modifier ma réponse' : '💬 Répondre à cet avis'}
                      </button>
                      {rev.reponseVendeur?.texte && (
                        <button
                          type="button"
                          className="btn-seller-danger"
                          onClick={() => handleDeleteReply(rev._id)}
                        >
                          🗑️ Supprimer ma réponse
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ONGLET 8 : REMBOURSEMENTS */}
        {/* ========================================================================= */}
        {activeTab === 'refunds' && (
          <div>
            <div className="seller-header">
              <div className="seller-title-group">
                <h1>💰 Retours & Remboursements ({refunds.length})</h1>
                <p>Traitez les réclamations et demandes de remboursement des clients pour vos commandes.</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {refunds.length === 0 ? (
                <div className="seller-card empty">
                  <p>Aucune demande de remboursement en cours.</p>
                </div>
              ) : (
                refunds.map((refItem) => (
                  <div key={refItem._id} className="seller-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 10, marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <strong>Commande : {refItem.commande?.numeroCommande}</strong>
                        <span style={{ marginLeft: 12, fontSize: 12, color: '#64748b' }}>
                          Demandé le {new Date(refItem.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span className={`badge-status ${refItem.statut}`}>
                          {refItem.statut?.replace('_', ' ')}
                        </span>
                        <strong style={{ fontSize: 16, color: '#dc2626' }}>
                          {Number(refItem.montant).toFixed(2)} TND
                        </strong>
                      </div>
                    </div>

                    <div style={{ fontSize: 13, marginBottom: 12 }}>
                      <p style={{ margin: '4px 0' }}>
                        Client : <strong>{refItem.client ? `${refItem.client.prenom} ${refItem.client.nom}` : 'Client'}</strong> ({refItem.client?.email || ''})
                      </p>
                      <p style={{ margin: '4px 0' }}>
                        Motif : <strong style={{ color: '#0f172a' }}>{refItem.motif}</strong>
                      </p>
                      {refItem.details && (
                        <p style={{ margin: '4px 0', color: '#475569' }}>
                          Détails : {refItem.details}
                        </p>
                      )}
                    </div>

                    {refItem.reponseVendeur && (
                      <div style={{ background: '#f8fafc', padding: 10, borderRadius: 6, fontSize: 13, border: '1px solid #e2e8f0', marginBottom: 12 }}>
                        <strong>Réponse apportée :</strong> {refItem.reponseVendeur}
                      </div>
                    )}

                    {refItem.statut === 'en_attente' && (
                      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn-seller-success"
                          onClick={() => handleOpenProcessRefund(refItem, 'approuvee')}
                        >
                          ✅ Approuver le remboursement
                        </button>
                        <button
                          type="button"
                          className="btn-seller-danger"
                          onClick={() => handleOpenProcessRefund(refItem, 'rejetee')}
                        >
                          ❌ Rejeter la demande
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL : NOUVEAU / MODIFIER PRODUIT */}
      {/* ========================================================================= */}
      {productModalOpen && (
        <div className="seller-modal-overlay">
          <div className="seller-modal">
            <div className="seller-modal-header">
              <h3>{editingProduct ? 'Modifier le produit' : 'Ajouter un nouveau produit'}</h3>
              <button type="button" className="seller-modal-close" onClick={() => setProductModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="seller-modal-body">
                <div className="field">
                  <label>Nom du produit *</label>
                  <input
                    required
                    value={productForm.nom}
                    onChange={(e) => setProductForm({ ...productForm, nom: e.target.value })}
                    placeholder="Ex: T-Shirt Homme Sport"
                  />
                </div>

                <div className="row2">
                  <div className="field">
                    <label>Marque</label>
                    <input
                      value={productForm.marque}
                      onChange={(e) => setProductForm({ ...productForm, marque: e.target.value })}
                      placeholder="Ex: Nike"
                    />
                  </div>
                  <div className="field">
                    <label>Catégorie *</label>
                    <select
                      className="filter-input"
                      style={{ width: '100%' }}
                      required
                      value={productForm.categorie}
                      onChange={(e) => setProductForm({ ...productForm, categorie: e.target.value })}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="field">
                  <label>Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Détails du produit..."
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div className="row2">
                  <div className="field">
                    <label>Prix (TND) *</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={productForm.prix}
                      onChange={(e) => setProductForm({ ...productForm, prix: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Stock disponible *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    />
                  </div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label>Couleurs (séparées par virgule)</label>
                    <input
                      placeholder="Ex: Noir, Blanc, Bleu"
                      value={productForm.couleurs}
                      onChange={(e) => setProductForm({ ...productForm, couleurs: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Seuil d'alerte de stock</label>
                    <input
                      type="number"
                      min="0"
                      value={productForm.seuilAlerteStock}
                      onChange={(e) => setProductForm({ ...productForm, seuilAlerteStock: e.target.value })}
                    />
                  </div>
                </div>

                {/* ===== PHOTOS SELON LA COULEUR ===== */}
                {(() => {
                  const modalColors = productForm.couleurs
                    .split(',')
                    .map((c) => c.trim())
                    .filter(Boolean);

                  return (
                    <>
                      {modalColors.length > 0 && (
                        <div style={{ background: '#fff7ed', padding: '16px', borderRadius: 10, border: '1px solid #fed7aa', marginBottom: 16 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 18 }}>🎨</span>
                            <strong style={{ fontSize: 14, color: '#9a3412' }}>Photos selon la couleur</strong>
                          </div>
                          <p style={{ margin: '0 0 12px', fontSize: 12, color: '#7c2d12' }}>
                            Téléversez une photo pour chaque couleur. Quand un acheteur sélectionnera cette couleur, sa photo s'affichera immédiatement !
                          </p>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
                            {modalColors.map((c) => {
                              const colorImg = colorVariants[c] || '';
                              return (
                                <div key={c} style={{ background: '#ffffff', padding: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                                    <span className="swatch" style={{ background: colorToCss(c) || '#cbd5e1', width: 16, height: 16 }} />
                                    <strong style={{ fontSize: 13, color: '#1e293b' }}>{c}</strong>
                                    {colorImg && <span style={{ fontSize: 11, color: '#16a34a', marginLeft: 'auto', fontWeight: 600 }}>✓ Définie</span>}
                                  </div>
                                  <ImageUpload
                                    value={colorImg}
                                    label={`Photo pour « ${c} »`}
                                    size={85}
                                    onChange={(url) => handleSetColorImage(c, url)}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* ===== GALERIE ET PHOTOS MULTIPLES DU PRODUIT ===== */}
                      <div className="field" style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid #e2e8f0' }}>
                        <label style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 4, display: 'block' }}>
                          📷 Photos du produit (galerie multiple)
                        </label>
                        <p style={{ margin: '0 0 12px', fontSize: 12, color: '#64748b' }}>
                          Vous pouvez ajouter plusieurs photos. La première photo avec le badge <strong>Principale</strong> est celle affichée en tête de catalogue.
                        </p>

                        {/* Liste des photos déjà ajoutées */}
                        {productForm.images.length > 0 && (
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
                            {productForm.images.map((img, i) => (
                              <div
                                key={i}
                                style={{
                                  position: 'relative',
                                  width: 90,
                                  height: 90,
                                  borderRadius: 8,
                                  overflow: 'hidden',
                                  border: i === 0 ? '2px solid #ff7b00' : '1px solid #cbd5e1',
                                  background: '#ffffff',
                                  boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                                }}
                              >
                                <img src={img} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                {i === 0 && (
                                  <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#ff7b00', color: '#fff', fontSize: 10, fontWeight: 700, textAlign: 'center', padding: '2px 0' }}>
                                    Principale
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveProductImage(i)}
                                  style={{
                                    position: 'absolute',
                                    top: 4,
                                    right: 4,
                                    background: '#dc2626',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: 22,
                                    height: 22,
                                    cursor: 'pointer',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                                  }}
                                  title="Supprimer cette photo"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Uploader pour ajouter une nouvelle photo */}
                        <ImageUpload
                          label="+ Ajouter une photo depuis votre appareil"
                          size={90}
                          onChange={handleAddProductImage}
                        />
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="seller-modal-footer">
                <button type="button" className="btn-seller-secondary" onClick={() => setProductModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-seller-primary">
                  {editingProduct ? 'Enregistrer les modifications' : 'Créer le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : CONFIGURER PROMOTION */}
      {/* ========================================================================= */}
      {promoModalOpen && selectedPromoProduct && (
        <div className="seller-modal-overlay">
          <div className="seller-modal" style={{ maxWidth: 480 }}>
            <div className="seller-modal-header">
              <h3>🏷️ Configuration de la Promotion</h3>
              <button type="button" className="seller-modal-close" onClick={() => setPromoModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSavePromo}>
              <div className="seller-modal-body">
                <p style={{ margin: '0 0 14px', fontSize: 14 }}>
                  Produit : <strong>{selectedPromoProduct.nom}</strong>
                  <br />
                  Prix initial : <strong>{Number(selectedPromoProduct.prix).toFixed(2)} TND</strong>
                </p>

                <div className="field">
                  <label>Pourcentage de remise (%) *</label>
                  <input
                    type="number"
                    min="1"
                    max="90"
                    required
                    value={promoForm.pourcentage}
                    onChange={(e) => setPromoForm({ ...promoForm, pourcentage: e.target.value })}
                  />
                </div>

                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Nouveau prix calculé :</span>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>
                    {(Number(selectedPromoProduct.prix) * (1 - (Number(promoForm.pourcentage) || 0) / 100)).toFixed(2)} TND
                  </div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label>Date de début (optionnelle)</label>
                    <input
                      type="date"
                      value={promoForm.dateDebut}
                      onChange={(e) => setPromoForm({ ...promoForm, dateDebut: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Date de fin (optionnelle)</label>
                    <input
                      type="date"
                      value={promoForm.dateFin}
                      onChange={(e) => setPromoForm({ ...promoForm, dateFin: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="seller-modal-footer">
                <button type="button" className="btn-seller-secondary" onClick={() => setPromoModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-seller-primary">
                  Appliquer la promotion
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : ANNULATION COMMANDE */}
      {/* ========================================================================= */}
      {cancelModalOpen && cancelingOrder && (
        <div className="seller-modal-overlay">
          <div className="seller-modal" style={{ maxWidth: 480 }}>
            <div className="seller-modal-header">
              <h3>❌ Annuler la commande {cancelingOrder.numeroCommande}</h3>
              <button type="button" className="seller-modal-close" onClick={() => setCancelModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmCancelOrder}>
              <div className="seller-modal-body">
                <p style={{ margin: '0 0 12px', fontSize: 13, color: '#dc2626' }}>
                  ⚠️ Cette action annulera la commande et restituera automatiquement les articles dans votre stock.
                </p>

                <div className="field">
                  <label>Motif de l'annulation *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Ex: Rupture inattendue du fournisseur, défaut de fabrication constaté..."
                    value={cancelMotif}
                    onChange={(e) => setCancelMotif(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="seller-modal-footer">
                <button type="button" className="btn-seller-secondary" onClick={() => setCancelModalOpen(false)}>
                  Retour
                </button>
                <button type="submit" className="btn-seller-danger">
                  Confirmer l'annulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : RÉPONDRE À UN AVIS */}
      {/* ========================================================================= */}
      {replyModalOpen && replyReview && (
        <div className="seller-modal-overlay">
          <div className="seller-modal" style={{ maxWidth: 520 }}>
            <div className="seller-modal-header">
              <h3>💬 Réponse officielle de la boutique</h3>
              <button type="button" className="seller-modal-close" onClick={() => setReplyModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveReply}>
              <div className="seller-modal-body">
                <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 14 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#334155' }}>
                    <strong>Avis client ({replyReview.note}/5★) :</strong> "{replyReview.commentaire}"
                  </p>
                </div>

                <div className="field">
                  <label>Votre message de réponse au client *</label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Bonjour, merci pour votre avis..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="seller-modal-footer">
                <button type="button" className="btn-seller-secondary" onClick={() => setReplyModalOpen(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn-seller-primary">
                  Publier la réponse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL : TRAITER UN REMBOURSEMENT */}
      {/* ========================================================================= */}
      {refundModalOpen && selectedRefund && (
        <div className="seller-modal-overlay">
          <div className="seller-modal" style={{ maxWidth: 500 }}>
            <div className="seller-modal-header">
              <h3>
                {refundDecision === 'approuvee' ? '✅ Approuver le remboursement' : '❌ Rejeter le remboursement'}
              </h3>
              <button type="button" className="seller-modal-close" onClick={() => setRefundModalOpen(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmProcessRefund}>
              <div className="seller-modal-body">
                <p style={{ margin: '0 0 10px', fontSize: 14 }}>
                  Commande : <strong>{selectedRefund.commande?.numeroCommande}</strong>
                  <br />
                  Montant : <strong>{Number(selectedRefund.montant).toFixed(2)} TND</strong>
                </p>

                <div className="field">
                  <label>
                    {refundDecision === 'approuvee'
                      ? 'Note / Message au client (optionnel)'
                      : 'Motif du refus (obligatoire pour informer le client) *'}
                  </label>
                  <textarea
                    rows={3}
                    required={refundDecision === 'rejetee'}
                    placeholder={refundDecision === 'approuvee' ? 'Votre remboursement a été accepté.' : 'Veuillez préciser la raison du rejet...'}
                    value={refundResponse}
                    onChange={(e) => setRefundResponse(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: 8, border: '1px solid #cbd5e1' }}
                  />
                </div>
              </div>

              <div className="seller-modal-footer">
                <button type="button" className="btn-seller-secondary" onClick={() => setRefundModalOpen(false)}>
                  Annuler
                </button>
                <button
                  type="submit"
                  className={refundDecision === 'approuvee' ? 'btn-seller-success' : 'btn-seller-danger'}
                >
                  {refundDecision === 'approuvee' ? 'Confirmer l\'approbation' : 'Confirmer le rejet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
