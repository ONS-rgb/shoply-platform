import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  CreditCard,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Calendar,
  AlertCircle
} from 'lucide-react';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [alert, setAlert] = useState(null);

  // Modals state
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validationAction, setValidationAction] = useState('valide'); // 'valide' | 'refuse'
  const [validationComment, setValidationComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [statutFilter, methodFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (search) sp.set('search', search);
      if (statutFilter) sp.set('statut', statutFilter);
      if (methodFilter) sp.set('methode', methodFilter);

      const res = await api.get(`/admin/payments?${sp.toString()}`);
      setPayments(res.data?.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du chargement des paiements' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleViewDetails = async (pay) => {
    setSelectedPayment(pay);
    setShowDetailsModal(true);
    try {
      const res = await api.get(`/admin/payments/${pay._id}`);
      setPaymentDetails(res.data?.data || null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors de la récupération des détails du paiement' });
    }
  };

  const openValidateModal = (pay, action) => {
    setSelectedPayment(pay);
    setValidationAction(action);
    setValidationComment(action === 'valide' ? 'Paiement vérifié et validé par l\'administrateur' : 'Règlement non honoré ou rejeté');
    setShowValidateModal(true);
  };

  const handleProcessValidation = async (e) => {
    e.preventDefault();
    if (!selectedPayment) return;
    setSubmitting(true);
    try {
      await api.put(`/admin/payments/${selectedPayment._id}/validate`, {
        action: validationAction,
        commentaire: validationComment
      });
      setAlert({
        type: 'success',
        message: `Paiement ${selectedPayment.reference} ${validationAction === 'valide' ? 'validé' : 'refusé'} avec succès.`
      });
      setShowValidateModal(false);
      setSelectedPayment(null);
      fetchPayments();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du traitement du paiement' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderBadge = (statut) => {
    if (statut === 'valide') return <span className="admin-badge success"><CheckCircle2 size={12} /> Validé</span>;
    if (statut === 'en_attente') return <span className="admin-badge warning"><Clock size={12} /> En attente</span>;
    if (statut === 'refuse') return <span className="admin-badge danger"><XCircle size={12} /> Refusé</span>;
    return <span className="admin-badge gray">{statut}</span>;
  };

  return (
    <AdminLayout
      title="Gestion des Paiements"
      subtitle="Contrôlez les transactions des commandes, validez les paiements à la livraison ou en ligne."
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
              placeholder="Rechercher par référence (PAY-...) ou nom client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="admin-search-input"
            />
          </form>

          <div className="admin-filter-group">
            {/* Statut filter */}
            <select
              value={statutFilter}
              onChange={(e) => setStatutFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">Tous les statuts</option>
              <option value="en_attente">⏳ En attente</option>
              <option value="valide">✅ Validé</option>
              <option value="refuse">❌ Refusé</option>
            </select>

            {/* Méthode filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="admin-select"
            >
              <option value="">Toutes méthodes</option>
              <option value="livraison">🚚 À la livraison</option>
              <option value="carte">💳 Carte bancaire</option>
              <option value="virement">🏦 Virement</option>
            </select>
          </div>
        </div>

        {/* Tableau des paiements */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chargement des paiements...
            </div>
          ) : payments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <CreditCard size={40} style={{ margin: '0 auto 12px auto', display: 'block' }} />
              Aucun paiement ne correspond à ces critères
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client Concerné</th>
                  <th>Commande</th>
                  <th>Montant</th>
                  <th>Date</th>
                  <th>Méthode</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td>
                      <strong>{p.reference}</strong>
                    </td>
                    <td>
                      {p.client ? (
                        <div>
                          <strong>{p.client.prenom} {p.client.nom}</strong>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.client.email}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {p.commande ? (
                        <span className="admin-badge gray">
                          {p.commande.numeroCommande}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <strong style={{ fontSize: 15, color: '#0f172a' }}>
                        {Number(p.montant).toFixed(2)} TND
                      </strong>
                    </td>
                    <td>
                      {new Date(p.datePaiement || p.createdAt).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <span className="admin-badge gray">
                        {p.methodePaiement === 'livraison' ? '🚚 Livraison' : '💳 Carte bancaire'}
                      </span>
                    </td>
                    <td>{renderBadge(p.statut)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        {/* Bouton de validation rapide */}
                        {p.statut !== 'valide' && (
                          <button
                            onClick={() => openValidateModal(p, 'valide')}
                            className="admin-btn admin-btn-sm admin-btn-success"
                            title="Valider le paiement"
                          >
                            <CheckCircle2 size={13} />
                            <span>Valider</span>
                          </button>
                        )}

                        {p.statut !== 'refuse' && (
                          <button
                            onClick={() => openValidateModal(p, 'refuse')}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            title="Refuser le paiement"
                          >
                            <XCircle size={13} />
                            <span>Refuser</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleViewDetails(p)}
                          className="admin-action-btn"
                          title="Détails du paiement"
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

      {/* ================= MODAL VALIDATION PAIEMENT ================= */}
      {showValidateModal && selectedPayment && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {validationAction === 'valide' ? 'Valider le paiement' : 'Refuser le paiement'}
              </h2>
              <button onClick={() => setShowValidateModal(false)} className="admin-modal-close">×</button>
            </div>
            <form onSubmit={handleProcessValidation}>
              <div className="admin-modal-body">
                <p style={{ fontSize: 14, color: '#334155', marginTop: 0 }}>
                  Paiement : <strong>{selectedPayment.reference}</strong> pour un montant de{' '}
                  <strong style={{ color: '#ea580c' }}>{Number(selectedPayment.montant).toFixed(2)} TND</strong>.
                </p>

                <div className="admin-form-group">
                  <label>Commentaire de validation / motif d'enregistrement</label>
                  <textarea
                    className="admin-textarea"
                    value={validationComment}
                    onChange={(e) => setValidationComment(e.target.value)}
                    required
                  />
                </div>

                <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#64748b' }}>
                  ℹ️ Cette décision mettra à jour instantanément le statut du paiement dans la base de données et mettra à jour la commande associée en mode <strong>{validationAction === 'valide' ? 'Payée' : 'En attente'}</strong>.
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowValidateModal(false)} className="admin-btn admin-btn-secondary">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`admin-btn ${validationAction === 'valide' ? 'admin-btn-success' : 'admin-btn-danger'}`}
                >
                  {submitting ? 'Enregistrement...' : (validationAction === 'valide' ? 'Confirmer la validation' : 'Confirmer le refus')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DÉTAILS PAIEMENT ================= */}
      {showDetailsModal && selectedPayment && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Paiement : {selectedPayment.reference}</h2>
              <button onClick={() => setShowDetailsModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>MONTANT</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#ea580c' }}>
                    {Number(selectedPayment.montant).toFixed(2)} TND
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>STATUT</div>
                  <div>{renderBadge(selectedPayment.statut)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>CLIENT</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {selectedPayment.client?.prenom} {selectedPayment.client?.nom}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>MÉTHODE</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedPayment.methodePaiement}</div>
                </div>
              </div>

              {/* Historique des statuts du paiement */}
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Historique des validations</h3>
              {paymentDetails?.historique && paymentDetails.historique.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {paymentDetails.historique.map((h, i) => (
                    <div key={i} style={{ padding: 12, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        {renderBadge(h.statut)}
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>
                          {new Date(h.date).toLocaleString('fr-FR')}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: '#334155' }}>{h.commentaire || 'Aucun commentaire'}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: '#94a3b8', fontSize: 13 }}>Aucune modification enregistrée.</p>
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
