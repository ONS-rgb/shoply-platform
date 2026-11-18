import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  Package,
  Search,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Store,
  Tag
} from 'lucide-react';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('tous');
  const [vendorFilter, setVendorFilter] = useState('tous');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [alert, setAlert] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productDetails, setProductDetails] = useState(null);

  // Form state
  const [form, setForm] = useState({
    nom: '',
    description: '',
    prix: '',
    stock: '',
    categorie: '',
    marque: '',
    images: '',
    boutiqueId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAuxiliaryData();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [categoryFilter, vendorFilter, availabilityFilter]);

  const fetchAuxiliaryData = async () => {
    try {
      const [catRes, venRes] = await Promise.all([
        api.get('/categories'),
        api.get('/admin/vendors')
      ]);
      setCategories(catRes.data?.data || []);
      setVendors(venRes.data?.data || []);
    } catch (err) {
      // Ignore
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (search) sp.set('search', search);
      if (categoryFilter !== 'tous') sp.set('categorie', categoryFilter);
      if (vendorFilter !== 'tous') sp.set('vendeur', vendorFilter);
      if (availabilityFilter) sp.set('disponibilite', availabilityFilter);

      const res = await api.get(`/admin/products?${sp.toString()}`);
      setProducts(res.data?.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du chargement des produits' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleViewDetails = async (product) => {
    setSelectedProduct(product);
    setShowDetailsModal(true);
    try {
      const res = await api.get(`/admin/products/${product._id}`);
      setProductDetails(res.data?.data || null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors de la récupération des détails du produit' });
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const imagesArr = form.images
        ? form.images.split('\n').map(s => s.trim()).filter(Boolean)
        : [];

      await api.post('/admin/products', {
        nom: form.nom,
        description: form.description,
        prix: Number(form.prix),
        stock: Number(form.stock),
        categorie: form.categorie,
        marque: form.marque,
        images: imagesArr,
        boutiqueId: form.boutiqueId || undefined
      });

      setAlert({ type: 'success', message: 'Produit ajouté avec succès au catalogue' });
      setShowAddModal(false);
      setForm({ nom: '', description: '', prix: '', stock: '', categorie: '', marque: '', images: '', boutiqueId: '' });
      fetchProducts();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de l\'ajout du produit' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/products/${selectedProduct._id}`);
      setAlert({ type: 'success', message: `Produit "${selectedProduct.nom}" retiré du catalogue.` });
      setShowDeleteModal(false);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la suppression' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Gestion des Produits"
      subtitle="Supervisez le catalogue global, filtrez par catégorie ou vendeur et gérez les disponibilités."
    >
      {alert && (
        <div className={`admin-alert ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Barre de filtres et recherche */}
      <div className="admin-card">
        <div className="admin-filter-bar">
          <form onSubmit={handleSearchSubmit} className="admin-search-wrapper">
            <Search />
            <input
              type="text"
              placeholder="Rechercher par nom, marque, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </form>

          <div className="admin-filter-group">
            {/* Filtre par catégorie */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="admin-select"
            >
              <option value="tous">Toutes les catégories</option>
              {categories.map((c) => (
                <option key={c._id} value={c.nom}>{c.nom}</option>
              ))}
            </select>

            {/* Filtre par vendeur */}
            <select
              value={vendorFilter}
              onChange={(e) => setVendorFilter(e.target.value)}
              className="admin-select"
            >
              <option value="tous">Tous les vendeurs</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>{v.prenom} {v.nom} ({v.boutique?.nom || 'Sans boutique'})</option>
              ))}
            </select>

            {/* Filtre par disponibilité */}
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">Toute disponibilité</option>
              <option value="in_stock">En stock (&gt; 5)</option>
              <option value="low_stock">Stock faible (1 à 5)</option>
              <option value="out_of_stock">Rupture de stock (0)</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="admin-btn admin-btn-primary"
            >
              <Plus size={16} />
              <span>Nouveau produit</span>
            </button>
          </div>
        </div>

        {/* Tableau des produits */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chargement des produits...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <Package size={40} style={{ margin: '0 auto 12px auto', display: 'block' }} />
              Aucun produit ne correspond à ces critères
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th>Catégorie</th>
                  <th>Vendeur / Boutique</th>
                  <th>Prix</th>
                  <th>Quantité en Stock</th>
                  <th>Disponibilité</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const hasImage = p.images && p.images.length > 0;
                  const imgUrl = hasImage ? p.images[0] : '';
                  return (
                    <tr key={p._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {imgUrl ? (
                            <img
                              src={imgUrl}
                              alt={p.nom}
                              style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                            />
                          ) : (
                            <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                              📦
                            </div>
                          )}
                          <div>
                            <strong>{p.nom}</strong>
                            {p.marque && <div style={{ fontSize: 11, color: '#64748b' }}>Marque : {p.marque}</div>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="admin-badge gray">
                          <Tag size={12} /> {p.categorie}
                        </span>
                      </td>
                      <td>
                        <div>
                          <strong>{p.nomBoutique || 'Shoply'}</strong>
                          {p.boutique && (
                            <div style={{ fontSize: 11, color: '#94a3b8' }}>
                              {p.boutique.prenom} {p.boutique.nom}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong style={{ fontSize: 15, color: '#0f172a' }}>
                          {Number(p.prix).toFixed(2)} TND
                        </strong>
                      </td>
                      <td>
                        <strong>{p.stock}</strong> unité(s)
                      </td>
                      <td>
                        {p.stock > 5 ? (
                          <span className="admin-badge success">En stock</span>
                        ) : p.stock > 0 ? (
                          <span className="admin-badge warning">Stock faible</span>
                        ) : (
                          <span className="admin-badge danger">Rupture</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                          <button
                            onClick={() => handleViewDetails(p)}
                            className="admin-action-btn"
                            title="Consulter les détails"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(p);
                              setShowDeleteModal(true);
                            }}
                            className="admin-action-btn delete"
                            title="Retirer le produit"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= MODAL AJOUT PRODUIT ================= */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Ajouter un produit au catalogue</h2>
              <button onClick={() => setShowAddModal(false)} className="admin-modal-close">×</button>
            </div>
            <form onSubmit={handleAddProduct}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Nom du produit *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    required
                    placeholder="Ex: iPhone 15 Pro Max 256Go"
                  />
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Catégorie *</label>
                    <select
                      className="admin-input"
                      value={form.categorie}
                      onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c.nom}>{c.icone} {c.nom}</option>
                      ))}
                    </select>
                  </div>
                  <div className="admin-form-group">
                    <label>Marque</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={form.marque}
                      onChange={(e) => setForm({ ...form, marque: e.target.value })}
                      placeholder="Apple, Samsung, Nike..."
                    />
                  </div>
                </div>

                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Prix (TND) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="admin-input"
                      value={form.prix}
                      onChange={(e) => setForm({ ...form, prix: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Quantité en stock *</label>
                    <input
                      type="number"
                      min="0"
                      className="admin-input"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Vendeur / Marchand associé *</label>
                  <select
                    className="admin-input"
                    value={form.boutiqueId}
                    onChange={(e) => setForm({ ...form, boutiqueId: e.target.value })}
                  >
                    <option value="">Plateforme Shoply (Par défaut)</option>
                    {vendors.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.prenom} {v.nom} — {v.boutique?.nom || 'Compte Marchand'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Description du produit *</label>
                  <textarea
                    className="admin-textarea"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    required
                    placeholder="Description détaillée du produit, caractéristiques techniques, garantie..."
                  />
                </div>

                <div className="admin-form-group">
                  <label>URL de l'image (une par ligne)</label>
                  <textarea
                    className="admin-textarea"
                    style={{ minHeight: 60 }}
                    value={form.images}
                    onChange={(e) => setForm({ ...form, images: e.target.value })}
                    placeholder="https://images.unsplash.com/photo-..."
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="admin-btn admin-btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="admin-btn admin-btn-primary">
                  {submitting ? 'Ajout...' : 'Publier le produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DÉTAILS PRODUIT ================= */}
      {showDetailsModal && selectedProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Fiche Produit : {selectedProduct.nom}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'flex', gap: 20, marginBottom: 20, alignItems: 'flex-start' }}>
                {selectedProduct.images?.[0] ? (
                  <img
                    src={selectedProduct.images[0]}
                    alt={selectedProduct.nom}
                    style={{ width: 140, height: 140, borderRadius: 10, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                  />
                ) : (
                  <div style={{ width: 140, height: 140, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
                    📦
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: 18, fontWeight: 800 }}>{selectedProduct.nom}</h3>
                  <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                    Catégorie : <strong>{selectedProduct.categorie}</strong> | Marque : <strong>{selectedProduct.marque || 'N/A'}</strong>
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#ea580c', marginBottom: 8 }}>
                    {Number(selectedProduct.prix).toFixed(2)} TND
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <span className="admin-badge gray">Stock : {selectedProduct.stock}</span>
                    <span className="admin-badge success">{selectedProduct.statut}</span>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                  Description
                </div>
                <p style={{ fontSize: 14, color: '#334155', background: '#f8fafc', padding: 14, borderRadius: 8, margin: 0 }}>
                  {selectedProduct.description}
                </p>
              </div>

              <div style={{ padding: 12, background: '#f1f5f9', borderRadius: 8, fontSize: 13 }}>
                <strong>Vendeur / Propriétaire : </strong>
                {selectedProduct.boutique ? `${selectedProduct.boutique.prenom} ${selectedProduct.boutique.nom} (${selectedProduct.boutique.email})` : 'Shoply'}
                <br />
                <strong>Boutique : </strong>{selectedProduct.nomBoutique || 'Boutique officielle'}
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDetailsModal(false)} className="admin-btn admin-btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SUPPRESSION PRODUIT ================= */}
      {showDeleteModal && selectedProduct && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 440 }}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca', background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b91c1c' }}>
                <AlertTriangle size={20} />
                <h2 className="admin-modal-title" style={{ color: '#b91c1c' }}>Retirer le produit</h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 14, color: '#334155', margin: '0 0 12px 0' }}>
                Êtes-vous sûr de vouloir supprimer le produit <strong>{selectedProduct.nom}</strong> ?
              </p>
              <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13, color: '#991b1b' }}>
                Le produit sera archivé et masqué immédiatement du catalogue public et des résultats de recherche.
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="admin-btn admin-btn-secondary">
                Annuler
              </button>
              <button onClick={handleDeleteProduct} disabled={submitting} className="admin-btn admin-btn-danger">
                {submitting ? 'Suppression...' : 'Supprimer du catalogue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
