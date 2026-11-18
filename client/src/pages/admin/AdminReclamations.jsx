import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Layers,
  FileText,
  Paperclip
} from 'lucide-react';

export default function AdminReclamations() {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [alert, setAlert] = useState(null);

  // Modals state
  const [selectedRec, setSelectedRec] = useState(null);
  const [recDetails, setRecDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('en_cours');
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReclamations();
  }, [statutFilter]);

  const fetchReclamations = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (search) sp.set('search', search);
      if (statutFilter) sp.set('statut', statutFilter);

      const res = await api.get(`/admin/reclamations?${sp.toString()}`);
      setReclamations(res.data?.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur de chargement' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchReclamations();
  };

  const handleViewDetails = async (rec) => {
    setSelectedRec(rec);
    setShowDetailsModal(true);
    try {
      const res = await api.get(`/admin/reclamations/${rec._id}`);
      setRecDetails(res.data?.data || null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors de la récupération des détails' });
    }
  };

  const openStatusModal = (rec) => {
    setSelectedRec(rec);
    setTargetStatus(rec.statut === 'en_attente' ? 'en_cours' : 'resolue');
    setAdminResponse(rec.reponseAdmin || '');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedRec) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/reclamations/${selectedRec._id}/status`, {
        statut: targetStatus,
        reponseAdmin: adminResponse
      });
      setAlert({ type: 'success', message: `Réclamation ${selectedRec.numeroReclamation} mise à jour avec succès.` });
      setShowStatusModal(false);
      setSelectedRec(null);
      fetchReclamations();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors de la mise à jour' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderBadge = (statut) => {
    if (statut === 'en_attente') return <span className="admin-badge warning"><Clock size={12} /> En attente</span>;
    if (statut === 'en_cours') return <span className="admin-badge info"><Clock size={12} /> En cours</span>;
    if (statut === 'resolue') return <span className="admin-badge success"><CheckCircle2 size={12} /> Résolue</span>;
    if (statut === 'refusee') return <span className="admin-badge danger"><XCircle size={12} /> Refusée</span>;
    return <span className="admin-badge gray">{statut}</span>;
  };

  return (
    <AdminLayout
      title="Gestion des Réclamations"
      subtitle="Traitez les litiges clients, supervisez les réclamations sur commandes et répondez aux acheteurs."
    >
      {alert && (
        <div className={`admin-alert ${alert.type}`}>
          {alert.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <span>{alert.message}</span>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-filter-bar">
          <form onSubmit={handleSearchSubmit} className="admin-search-wrapper">
            <Search />
            <input
              type="text"
              placeholder="Rechercher par N° dossier (REC-...), sujet ou client..."
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
              <option value="en_attente">⏳ En attente</option>
              <option value="en_cours">🔄 En cours</option>
              <option value="resolue">✅ Résolue</option>
              <option value="refusee">❌ Refusée</option>
            </select>
          </div>
        </div>

        {/* Tableau des réclamations */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chargement des dossiers de réclamations...
            </div>
          ) : reclamations.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <AlertCircle size={40} style={{ margin: '0 auto 12px auto', display: 'block' }} />
              Aucune réclamation trouvée
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>N° Réclamation</th>
                  <th>Client Concerné</th>
                  <th>Commande Concernée</th>
                  <th>Sujet</th>
                  <th>Date d'ouverture</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reclamations.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <strong>{r.numeroReclamation}</strong>
                    </td>
                    <td>
                      {r.client ? (
                        <div>
                          <strong>{r.client.prenom} {r.client.nom}</strong>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{r.client.email}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {r.commande ? (
                        <span className="admin-badge gray">
                          {r.commande.numeroCommande}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div style={{ maxWidth: 260, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {r.sujet}
                      </div>
                    </td>
                    <td>{new Date(r.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>{renderBadge(r.statut)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => openStatusModal(r)}
                          className="admin-btn admin-btn-sm admin-btn-secondary"
                          title="Modifier le statut"
                        >
                          <span>Statut</span>
                        </button>
                        <button
                          onClick={() => handleViewDetails(r)}
                          className="admin-action-btn"
                          title="Voir le dossier complet"
                        >
                          <Eye size={15} />
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

      {/* ================= MODAL STATUT RÉCLAMATION ================= */}
      {showStatusModal && selectedRec && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Gérer la réclamation {selectedRec.numeroReclamation}</h2>
              <button onClick={() => setShowStatusModal(false)} className="admin-modal-close">×</button>
            </div>
            <form onSubmit={handleUpdateStatus}>
              <div className="admin-modal-body">
                <div className="admin-form-group">
                  <label>Nouveau statut du dossier *</label>
                  <select
                    className="admin-input"
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                    required
                  >
                    <option value="en_attente">En attente</option>
                    <option value="en_cours">En cours de traitement</option>
                    <option value="resolue">Résolue</option>
                    <option value="refusee">Refusée</option>
                  </select>
                </div>

                <div className="admin-form-group">
                  <label>Réponse de l'administrateur (notifiée au client) *</label>
                  <textarea
                    className="admin-textarea"
                    value={adminResponse}
                    onChange={(e) => setAdminResponse(e.target.value)}
                    placeholder="Écrivez votre message de réponse au client..."
                    required
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowStatusModal(false)} className="admin-btn admin-btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="admin-btn admin-btn-primary">
                  {submitting ? 'Enregistrement...' : 'Mettre à jour le statut'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DÉTAILS RÉCLAMATION ================= */}
      {showDetailsModal && selectedRec && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Dossier Réclamation : {selectedRec.numeroReclamation}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>CLIENT</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {selectedRec.client?.prenom} {selectedRec.client?.nom}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{selectedRec.client?.telephone || 'Sans tél'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>COMMANDE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {selectedRec.commande?.numeroCommande || 'N/A'}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    Total : {selectedRec.commande?.total || 0} TND
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>STATUT ACTUEL</div>
                  <div>{renderBadge(selectedRec.statut)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>DATE DÉPÔT</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{new Date(selectedRec.createdAt).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                  Sujet de la réclamation
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{selectedRec.sujet}</div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                  Description détaillée du client
                </div>
                <p style={{ fontSize: 14, color: '#334155', background: '#f8fafc', padding: 14, borderRadius: 8, margin: 0 }}>
                  {selectedRec.description}
                </p>
              </div>

              {selectedRec.reponseAdmin && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', marginBottom: 4 }}>
                    Dernière réponse apportée par l'administrateur
                  </div>
                  <p style={{ fontSize: 14, color: '#065f46', background: '#ecfdf5', border: '1px solid #a7f3d0', padding: 14, borderRadius: 8, margin: 0 }}>
                    {selectedRec.reponseAdmin}
                  </p>
                </div>
              )}

              {/* Historique des statuts */}
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Historique des interventions</h3>
              {recDetails?.historiqueStatuts && recDetails.historiqueStatuts.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {recDetails.historiqueStatuts.map((h, i) => (
                    <div key={i} style={{ padding: 10, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        {renderBadge(h.statut)}
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(h.date).toLocaleString('fr-FR')}</span>
                      </div>
                      <div style={{ fontSize: 13, color: '#334155' }}>{h.commentaire}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucun historique disponible.</p>
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
    </AdminLayout>
  );
}
