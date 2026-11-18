import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  Tags,
  Search,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Package,
  Layers
} from 'lucide-react';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [alert, setAlert] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryDetails, setCategoryDetails] = useState(null);

  // Form state
  const [form, setForm] = useState({
    nom: '',
    description: '',
    icone: '📦'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (search) sp.set('search', search);

      const res = await api.get(`/categories?${sp.toString()}`);
      setCategories(res.data?.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du chargement des catégories' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCategories();
  };

  const handleViewDetails = async (cat) => {
    setSelectedCategory(cat);
    setShowDetailsModal(true);
    try {
      const res = await api.get(`/categories/${cat._id}`);
      setCategoryDetails(res.data?.data || null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors de la récupération des détails' });
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/categories', form);
      setAlert({ type: 'success', message: `Catégorie "${form.nom}" ajoutée avec succès` });
      setShowAddModal(false);
      setForm({ nom: '', description: '', icone: '📦' });
      fetchCategories();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de l\'ajout de la catégorie' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      await api.delete(`/categories/${selectedCategory._id}`);
      setAlert({ type: 'success', message: `Catégorie "${selectedCategory.nom}" supprimée.` });
      setShowDeleteModal(false);
      setSelectedCategory(null);
      fetchCategories();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Suppression impossible' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Gestion des Catégories"
      subtitle="Organisez les rayons du catalogue, ajoutez de nouvelles catégories et contrôlez l'intégrité référentielle."
    >
      {alert && (
        <div className={`admin-alert ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-filter-bar">
          <form onSubmit={handleSearchSubmit} className="admin-search-wrapper">
            <Search />
            <input
              type="text"
              placeholder="Rechercher une catégorie..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </form>

          <button onClick={() => setShowAddModal(true)} className="admin-btn admin-btn-primary">
            <Plus size={16} />
            <span>Nouvelle catégorie</span>
          </button>
        </div>

        {/* Tableau des catégories */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chargement des catégories...
            </div>
          ) : categories.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <Tags size={40} style={{ margin: '0 auto 12px auto', display: 'block' }} />
              Aucune catégorie trouvée
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Catégorie</th>
                  <th>Description</th>
                  <th>Produits Rattachés</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 8,
                          background: '#fff7ed', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontSize: 20, border: '1px solid #fed7aa'
                        }}>
                          {c.icone || '📦'}
                        </div>
                        <div>
                          <strong style={{ fontSize: 15 }}>{c.nom}</strong>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>slug: {c.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{c.description || '—'}</td>
                    <td>
                      <span className={`admin-badge ${c.nbProduits > 0 ? 'purple' : 'gray'}`}>
                        <Package size={12} /> {c.nbProduits || 0} produit(s)
                      </span>
                    </td>
                    <td>
                      <span className="admin-badge success">
                        <span className="admin-badge-dot" /> Actif
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleViewDetails(c)}
                          className="admin-action-btn"
                          title="Consulter les détails et produits associés"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCategory(c);
                            setShowDeleteModal(true);
                          }}
                          className="admin-action-btn delete"
                          title="Supprimer la catégorie"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= MODAL AJOUT CATÉGORIE ================= */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Créer une catégorie</h2>
              <button onClick={() => setShowAddModal(false)} className="admin-modal-close">×</button>
            </div>
            <form onSubmit={handleAddCategory}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Nom de la catégorie *</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    required
                    placeholder="Ex: Beauté & Bien-être"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Émoji / Icône</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={form.icone}
                    onChange={(e) => setForm({ ...form, icone: e.target.value })}
                    placeholder="Ex: 💄, 🎮, 📚"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Description</label>
                  <textarea
                    className="admin-textarea"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description du rayon..."
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowAddModal(false)} className="admin-btn admin-btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="admin-btn admin-btn-primary">
                  {submitting ? 'Création...' : 'Créer la catégorie'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DÉTAILS CATÉGORIE ================= */}
      {showDetailsModal && selectedCategory && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {selectedCategory.icone} {selectedCategory.nom}
              </h2>
              <button onClick={() => setShowDetailsModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: '#64748b', margin: '0 0 16px 0' }}>
                {selectedCategory.description || 'Aucune description disponible.'}
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                Produits enregistrés dans cette catégorie ({categoryDetails?.nbProduits || 0})
              </h3>

              {categoryDetails?.produits && categoryDetails.produits.length > 0 ? (
                <div style={{ maxHeight: 240, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Prix</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryDetails.produits.map((p) => (
                        <tr key={p._id}>
                          <td><strong>{p.nom}</strong></td>
                          <td><strong>{p.prix} TND</strong></td>
                          <td>{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucun produit n'est actuellement rattaché à cette catégorie.</p>
              )}
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDetailsModal(false)} className="admin-btn admin-btn-secondary">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL SUPPRESSION CATÉGORIE AVEC INTÉGRITÉ ================= */}
      {showDeleteModal && selectedCategory && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 460 }}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca', background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b91c1c' }}>
                <AlertTriangle size={20} />
                <h2 className="admin-modal-title" style={{ color: '#b91c1c' }}>Supprimer la catégorie</h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 14, color: '#334155', margin: '0 0 12px 0' }}>
                Supprimer définitivement la catégorie : <strong>{selectedCategory.nom}</strong> ?
              </p>

              {selectedCategory.nbProduits > 0 ? (
                <div style={{ padding: 14, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13, color: '#991b1b' }}>
                  <strong>⚠️ Suppression impossible :</strong>
                  <br />
                  Il existe actuellement <strong>{selectedCategory.nbProduits} produit(s)</strong> associés à cette catégorie.
                  Par mesure d'intégrité de la base de données, vous devez réassigner ou supprimer ces produits au préalable.
                </div>
              ) : (
                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, color: '#475569' }}>
                  Aucun produit n'est rattaché à cette catégorie. Elle peut être supprimée en toute sécurité.
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="admin-btn admin-btn-secondary">
                Annuler
              </button>
              <button
                onClick={handleDeleteCategory}
                disabled={submitting || selectedCategory.nbProduits > 0}
                className="admin-btn admin-btn-danger"
                style={{ opacity: selectedCategory.nbProduits > 0 ? 0.5 : 1, cursor: selectedCategory.nbProduits > 0 ? 'not-allowed' : 'pointer' }}
              >
                {submitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
