import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  Store,
  Search,
  Plus,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Building2,
  Package,
  DollarSign
} from 'lucide-react';

export default function AdminVendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [alert, setAlert] = useState(null);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);

  // Form state
  const [form, setForm] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    telephone: '',
    nomBoutique: '',
    descriptionBoutique: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchVendors();
  }, [statutFilter]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (search) sp.set('search', search);
      if (statutFilter) sp.set('statut', statutFilter);

      const res = await api.get(`/admin/vendors?${sp.toString()}`);
      setVendors(res.data?.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du chargement des vendeurs' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVendors();
  };

  const handleViewDetails = async (vendor) => {
    setSelectedVendor(vendor);
    setShowDetailsModal(true);
    try {
      const res = await api.get(`/admin/vendors/${vendor._id}`);
      setVendorDetails(res.data?.data || null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors de la récupération des détails' });
    }
  };

  const handleAddVendor = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    try {
      await api.post('/admin/vendors', form);
      setAlert({ type: 'success', message: 'Vendeur et sa boutique créés avec succès' });
      setShowAddModal(false);
      setForm({ nom: '', prenom: '', email: '', motDePasse: '', telephone: '', nomBoutique: '', descriptionBoutique: '' });
      fetchVendors();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de l\'ajout du vendeur' });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteVendor = async () => {
    if (!selectedVendor) return;
    setFormSubmitting(true);
    try {
      await api.delete(`/admin/vendors/${selectedVendor._id}`);
      setAlert({ type: 'success', message: `Vendeur ${selectedVendor.prenom} ${selectedVendor.nom} supprimé avec succès` });
      setShowDeleteModal(false);
      setSelectedVendor(null);
      fetchVendors();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la suppression' });
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <AdminLayout
      title="Gestion des Vendeurs"
      subtitle="Supervisez les marchands, leurs boutiques affiliées et leurs catalogues de produits."
    >
      {alert && (
        <div className={`admin-alert ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle size={18} /> : <XCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Barre de filtre et d'action */}
      <div className="admin-card">
        <div className="admin-filter-bar">
          <form onSubmit={handleSearchSubmit} className="admin-search-wrapper">
            <Search />
            <input
              type="text"
              placeholder="Rechercher vendeur par nom, email, téléphone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </form>

          <div className="admin-filter-group">
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">Tous les statuts</option>
              <option value="actif">Actif</option>
              <option value="false">Inactif</option>
            </select>

            <button
              onClick={() => setShowAddModal(true)}
              className="admin-btn admin-btn-primary"
            >
              <Plus size={16} />
              <span>Nouveau vendeur</span>
            </button>
          </div>
        </div>

        {/* Tableau des vendeurs */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chargement des vendeurs...
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <Store size={40} style={{ margin: '0 auto 12px auto', display: 'block' }} />
              Aucun vendeur trouvé
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Vendeur</th>
                  <th>Boutique Associée</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Articles Actifs</th>
                  <th>Chiffre d'affaires</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((v) => (
                  <tr key={v._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: '#f5f3ff', color: '#7c3aed',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 13
                        }}>
                          {v.prenom ? v.prenom[0].toUpperCase() : 'V'}
                        </div>
                        <div>
                          <strong>{v.prenom} {v.nom}</strong>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>Inscrit le {new Date(v.createdAt).toLocaleDateString('fr-FR')}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {v.boutique ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Building2 size={14} color="#ea580c" />
                          <strong style={{ color: '#0f172a' }}>{v.boutique.nom}</strong>
                        </div>
                      ) : (
                        <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 13 }}>Sans boutique</span>
                      )}
                    </td>
                    <td>{v.email}</td>
                    <td>{v.telephone || '—'}</td>
                    <td>
                      <span className="admin-badge gray">
                        <Package size={12} />
                        {v.nbProduits || 0} produit(s)
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981' }}>
                        {Number(v.chiffreAffaires || 0).toFixed(2)} TND
                      </strong>
                    </td>
                    <td>
                      <span className={`admin-badge ${v.actif ? 'success' : 'danger'}`}>
                        <span className="admin-badge-dot" />
                        {v.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => handleViewDetails(v)}
                          className="admin-action-btn"
                          title="Consulter le profil et ses produits"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedVendor(v);
                            setShowDeleteModal(true);
                          }}
                          className="admin-action-btn delete"
                          title="Supprimer le vendeur"
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

      {/* ================= MODAL AJOUT VENDEUR ================= */}
      {showAddModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Inscrire un nouveau vendeur</h2>
              <button onClick={() => setShowAddModal(false)} className="admin-modal-close">×</button>
            </div>
            <form onSubmit={handleAddVendor}>
              <div className="admin-modal-body">
                <div className="admin-form-row">
                  <div className="admin-form-group">
                    <label>Prénom *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={form.prenom}
                      onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                      required
                    />
                  </div>
                  <div className="admin-form-group">
                    <label>Nom *</label>
                    <input
                      type="text"
                      className="admin-input"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    className="admin-input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>

                <div className="admin-form-group">
                  <label>Mot de passe provisoire *</label>
                  <input
                    type="password"
                    className="admin-input"
                    value={form.motDePasse}
                    onChange={(e) => setForm({ ...form, motDePasse: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>

                <div className="admin-form-group">
                  <label>Téléphone professionnel</label>
                  <input
                    type="tel"
                    className="admin-input"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  />
                </div>

                <div className="admin-form-group" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 14 }}>
                  <label>Nom de la boutique (Optionnel)</label>
                  <input
                    type="text"
                    className="admin-input"
                    value={form.nomBoutique}
                    onChange={(e) => setForm({ ...form, nomBoutique: e.target.value })}
                    placeholder="Ex: Électro Plus Express"
                  />
                </div>

                <div className="admin-form-group">
                  <label>Description de la boutique</label>
                  <textarea
                    className="admin-textarea"
                    value={form.descriptionBoutique}
                    onChange={(e) => setForm({ ...form, descriptionBoutique: e.target.value })}
                    placeholder="Courte présentation de la boutique..."
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="admin-btn admin-btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="admin-btn admin-btn-primary"
                >
                  {formSubmitting ? 'Enregistrement...' : 'Créer le vendeur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DÉTAILS VENDEUR ================= */}
      {showDetailsModal && selectedVendor && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Profil Marchand : {selectedVendor.prenom} {selectedVendor.nom}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>EMAIL</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedVendor.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>TÉLÉPHONE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedVendor.telephone || 'Non renseigné'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>BOUTIQUE ASSOCIÉE</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ea580c' }}>
                    {vendorDetails?.boutique?.nom || 'Aucune boutique'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>ARTICLES EN VENTE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {vendorDetails?.produits?.length || 0} produit(s)
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Articles publiés par ce vendeur</h3>
              {vendorDetails?.produits && vendorDetails.produits.length > 0 ? (
                <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Produit</th>
                        <th>Prix</th>
                        <th>Stock</th>
                        <th>Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendorDetails.produits.map((p) => (
                        <tr key={p._id}>
                          <td>
                            <strong>{p.nom}</strong>
                            <div style={{ fontSize: 11, color: '#64748b' }}>{p.categorie}</div>
                          </td>
                          <td><strong>{p.prix} TND</strong></td>
                          <td>{p.stock} unité(s)</td>
                          <td><span className="admin-badge success">{p.statut}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Ce vendeur n'a aucun produit publié actuellement.</p>
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

      {/* ================= MODAL SUPPRESSION VENDEUR ================= */}
      {showDeleteModal && selectedVendor && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 440 }}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca', background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b91c1c' }}>
                <AlertTriangle size={20} />
                <h2 className="admin-modal-title" style={{ color: '#b91c1c' }}>Confirmer la suppression</h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 14, color: '#334155', margin: '0 0 12px 0' }}>
                Supprimer le vendeur <strong>{selectedVendor.prenom} {selectedVendor.nom}</strong> ?
              </p>
              <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13, color: '#991b1b' }}>
                ⚠️ Cette action supprimera également sa boutique associée et désactivera ses produits du catalogue.
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="admin-btn admin-btn-secondary">
                Annuler
              </button>
              <button onClick={handleDeleteVendor} disabled={formSubmitting} className="admin-btn admin-btn-danger">
                {formSubmitting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
