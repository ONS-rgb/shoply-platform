import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  Building2,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  AlertTriangle,
  Clock,
  Ban,
  Package,
  DollarSign
} from 'lucide-react';

export default function AdminShops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentTab, setCurrentTab] = useState('tous'); // 'tous', 'en_attente', 'acceptee', 'refusee'
  const [alert, setAlert] = useState(null);

  // Modals state
  const [selectedShop, setSelectedShop] = useState(null);
  const [shopDetails, setShopDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionAction, setDecisionAction] = useState('accepter'); // 'accepter' | 'refuser'
  const [decisionMotif, setDecisionMotif] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShops();
  }, [currentTab]);

  const fetchShops = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (search) sp.set('search', search);
      if (currentTab !== 'tous') sp.set('statut', currentTab);

      const res = await api.get(`/admin/shops?${sp.toString()}`);
      setShops(res.data?.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du chargement des boutiques' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchShops();
  };

  const handleViewDetails = async (shop) => {
    setSelectedShop(shop);
    setShowDetailsModal(true);
    try {
      const res = await api.get(`/admin/shops/${shop._id}`);
      setShopDetails(res.data?.data || null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors du chargement des détails de la boutique' });
    }
  };

  const openDecisionModal = (shop, action) => {
    setSelectedShop(shop);
    setDecisionAction(action);
    setDecisionMotif(action === 'refuser' ? 'Informations de boutique incomplètes ou non conformes.' : '');
    setShowDecisionModal(true);
  };

  const handleProcessDecision = async (e) => {
    e.preventDefault();
    if (!selectedShop) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/shops/${selectedShop._id}/status`, {
        action: decisionAction,
        motif: decisionMotif
      });
      setAlert({
        type: 'success',
        message: decisionAction === 'accepter'
          ? `La boutique "${selectedShop.nom}" a été acceptée avec succès. Le vendeur a été notifié.`
          : `La boutique "${selectedShop.nom}" a été refusée. Le vendeur a été informé par notification.`
      });
      setShowDecisionModal(false);
      setSelectedShop(null);
      fetchShops();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la mise à jour du statut' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteShop = async () => {
    if (!selectedShop) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/shops/${selectedShop._id}`);
      setAlert({ type: 'success', message: `Boutique "${selectedShop.nom}" supprimée avec succès.` });
      setShowDeleteModal(false);
      setSelectedShop(null);
      fetchShops();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la suppression' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderBadge = (statut) => {
    if (statut === 'en_attente') {
      return <span className="admin-badge warning"><Clock size={12} /> En attente</span>;
    }
    if (statut === 'acceptee' || statut === 'active' || statut === 'approuvee') {
      return <span className="admin-badge success"><CheckCircle2 size={12} /> Acceptée</span>;
    }
    if (statut === 'refusee') {
      return <span className="admin-badge danger"><XCircle size={12} /> Refusée</span>;
    }
    if (statut === 'suspendue') {
      return <span className="admin-badge gray"><Ban size={12} /> Suspendue</span>;
    }
    return <span className="admin-badge gray">{statut}</span>;
  };

  return (
    <AdminLayout
      title="Gestion des Boutiques"
      subtitle="Examinez, acceptez ou refusez les demandes de création de boutique des marchands."
    >
      {alert && (
        <div className={`admin-alert ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      {/* Onglets de Statut de Boutique */}
      <div className="admin-tabs">
        <button
          onClick={() => setCurrentTab('tous')}
          className={`admin-tab-btn ${currentTab === 'tous' ? 'active' : ''}`}
        >
          Toutes les boutiques
        </button>
        <button
          onClick={() => setCurrentTab('en_attente')}
          className={`admin-tab-btn ${currentTab === 'en_attente' ? 'active' : ''}`}
        >
          ⏳ En attente de validation
        </button>
        <button
          onClick={() => setCurrentTab('acceptee')}
          className={`admin-tab-btn ${currentTab === 'acceptee' ? 'active' : ''}`}
        >
          ✅ Acceptées / Actives
        </button>
        <button
          onClick={() => setCurrentTab('refusee')}
          className={`admin-tab-btn ${currentTab === 'refusee' ? 'active' : ''}`}
        >
          ❌ Refusées
        </button>
      </div>

      <div className="admin-card">
        <div className="admin-filter-bar">
          <form onSubmit={handleSearchSubmit} className="admin-search-wrapper">
            <Search />
            <input
              type="text"
              placeholder="Rechercher une boutique par nom, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </form>
        </div>

        {/* Tableau des boutiques */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chargement des boutiques...
            </div>
          ) : shops.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <Building2 size={40} style={{ margin: '0 auto 12px auto', display: 'block' }} />
              Aucune boutique dans cette section.
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Boutique</th>
                  <th>Propriétaire</th>
                  <th>Email & Téléphone</th>
                  <th>Date Création</th>
                  <th>Articles</th>
                  <th>Total Ventes</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Décision & Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map((s) => (
                  <tr key={s._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 8,
                          background: '#fff7ed', color: '#ea580c',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: 16, border: '1px solid #fed7aa'
                        }}>
                          🏪
                        </div>
                        <div>
                          <strong>{s.nom}</strong>
                          {s.description && (
                            <div style={{ fontSize: 11, color: '#64748b', maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {s.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {s.proprietaire ? (
                        <div>
                          <strong>{s.proprietaire.prenom} {s.proprietaire.nom}</strong>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.proprietaire.email}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div>{s.email || '—'}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.telephone || '—'}</div>
                    </td>
                    <td>{new Date(s.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      <span className="admin-badge gray">
                        <Package size={12} /> {s.nbProduits || 0}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#10b981' }}>
                        {Number(s.chiffreAffaires || 0).toFixed(2)} TND
                      </strong>
                    </td>
                    <td>{renderBadge(s.statut)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {/* Bouton Accepter (si en attente ou refusée) */}
                        {s.statut !== 'active' && s.statut !== 'acceptee' && s.statut !== 'approuvee' && (
                          <button
                            onClick={() => openDecisionModal(s, 'accepter')}
                            className="admin-btn admin-btn-sm admin-btn-success"
                            title="Accepter la boutique"
                          >
                            <CheckCircle2 size={13} />
                            <span>Accepter</span>
                          </button>
                        )}

                        {/* Bouton Refuser (si en attente ou active) */}
                        {s.statut !== 'refusee' && (
                          <button
                            onClick={() => openDecisionModal(s, 'refuser')}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            title="Refuser la boutique"
                          >
                            <XCircle size={13} />
                            <span>Refuser</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleViewDetails(s)}
                          className="admin-action-btn"
                          title="Détails de la boutique"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedShop(s);
                            setShowDeleteModal(true);
                          }}
                          className="admin-action-btn delete"
                          title="Supprimer la boutique"
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

      {/* ================= MODAL DÉCISION (ACCEPTER / REFUSER) ================= */}
      {showDecisionModal && selectedShop && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {decisionAction === 'accepter' ? 'Accepter la demande de boutique' : 'Refuser la demande de boutique'}
              </h2>
              <button onClick={() => setShowDecisionModal(false)} className="admin-modal-close">×</button>
            </div>
            <form onSubmit={handleProcessDecision}>
              <div className="admin-modal-body">
                <p style={{ fontSize: 14, color: '#334155', marginTop: 0 }}>
                  Boutique concernée : <strong>{selectedShop.nom}</strong>
                </p>

                {decisionAction === 'accepter' ? (
                  <div style={{ padding: 14, background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', fontSize: 13, color: '#065f46' }}>
                    ✅ En acceptant cette boutique, son statut passera à <strong>Acceptée</strong> et le vendeur recevra une notification lui permettant de commencer à vendre ses articles.
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#0f172a', marginBottom: 6 }}>
                      Motif du refus (transmis au vendeur par notification) *
                    </label>
                    <textarea
                      className="admin-textarea"
                      value={decisionMotif}
                      onChange={(e) => setDecisionMotif(e.target.value)}
                      required
                      placeholder="Expliquez les raisons du refus pour guider le vendeur..."
                    />
                  </div>
                )}
              </div>
              <div className="admin-modal-footer">
                <button
                  type="button"
                  onClick={() => setShowDecisionModal(false)}
                  className="admin-btn admin-btn-secondary"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`admin-btn ${decisionAction === 'accepter' ? 'admin-btn-success' : 'admin-btn-danger'}`}
                >
                  {submitting ? 'Traitement...' : (decisionAction === 'accepter' ? 'Confirmer l\'acceptation' : 'Confirmer le refus')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DÉTAILS BOUTIQUE ================= */}
      {showDetailsModal && selectedShop && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Boutique : {selectedShop.nom}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PROPRIÉTAIRE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {selectedShop.proprietaire?.prenom} {selectedShop.proprietaire?.nom}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>STATUT ACTUEL</div>
                  <div>{renderBadge(selectedShop.statut)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>TÉLÉPHONE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{selectedShop.telephone || 'Non renseigné'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>PRODUITS AU CATALOGUE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{shopDetails?.nbProduits || 0} produit(s)</div>
                </div>
              </div>

              {selectedShop.description && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Description
                  </div>
                  <p style={{ fontSize: 14, color: '#334155', margin: 0, padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                    {selectedShop.description}
                  </p>
                </div>
              )}

              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Articles dans cette boutique</h3>
              {shopDetails?.produits && shopDetails.produits.length > 0 ? (
                <div style={{ maxHeight: 200, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Nom du produit</th>
                        <th>Catégorie</th>
                        <th>Prix</th>
                        <th>Stock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shopDetails.produits.map((p) => (
                        <tr key={p._id}>
                          <td><strong>{p.nom}</strong></td>
                          <td>{p.categorie}</td>
                          <td><strong>{p.prix} TND</strong></td>
                          <td>{p.stock}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucun produit répertorié pour le moment.</p>
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

      {/* ================= MODAL SUPPRESSION BOUTIQUE ================= */}
      {showDeleteModal && selectedShop && (
        <div className="admin-modal-overlay">
          <div className="admin-modal" style={{ maxWidth: 440 }}>
            <div className="admin-modal-header" style={{ borderBottomColor: '#fecaca', background: '#fef2f2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#b91c1c' }}>
                <AlertTriangle size={20} />
                <h2 className="admin-modal-title" style={{ color: '#b91c1c' }}>Supprimer la boutique</h2>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <p style={{ fontSize: 14, color: '#334155', margin: '0 0 12px 0' }}>
                Confirmez-vous la suppression de la boutique <strong>{selectedShop.nom}</strong> ?
              </p>
              <div style={{ padding: 12, background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca', fontSize: 13, color: '#991b1b' }}>
                ⚠️ Cette action est irréversible et informera le vendeur de la fermeture administrative de son établissement.
              </div>
            </div>
            <div className="admin-modal-footer">
              <button onClick={() => setShowDeleteModal(false)} className="admin-btn admin-btn-secondary">
                Annuler
              </button>
              <button onClick={handleDeleteShop} disabled={submitting} className="admin-btn admin-btn-danger">
                {submitting ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
