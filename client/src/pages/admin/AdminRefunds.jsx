import { useState, useEffect } from 'react';
import AdminLayout from '../../components/admin/AdminLayout';
import api from '../../services/api';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CreditCard,
  FileCheck
} from 'lucide-react';

export default function AdminRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [alert, setAlert] = useState(null);

  // Modals state
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [refundDetails, setRefundDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);

  // Form process state
  const [processAction, setProcessAction] = useState('approuve'); // 'approuve' | 'refuse' | 'rembourse'
  const [processResponse, setProcessResponse] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [modeRemboursement, setModeRemboursement] = useState('Passerelle bancaire');
  const [confirmedByGateway, setConfirmedByGateway] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, [statutFilter]);

  const fetchRefunds = async () => {
    setLoading(true);
    try {
      const sp = new URLSearchParams();
      if (search) sp.set('search', search);
      if (statutFilter) sp.set('statut', statutFilter);

      const res = await api.get(`/admin/refunds?${sp.toString()}`);
      setRefunds(res.data?.data || []);
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du chargement des remboursements' });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRefunds();
  };

  const handleViewDetails = async (ref) => {
    setSelectedRefund(ref);
    setShowDetailsModal(true);
    try {
      const res = await api.get(`/admin/refunds/${ref._id}`);
      setRefundDetails(res.data?.data || null);
    } catch (err) {
      setAlert({ type: 'error', message: 'Erreur lors de la récupération des détails' });
    }
  };

  const openProcessModal = (ref, defaultAction = 'approuve') => {
    setSelectedRefund(ref);
    setProcessAction(defaultAction);
    setProcessResponse(ref.reponse || '');
    setTransactionRef(ref.confirmationPaiement?.referenceTransaction || `TX-REF-${Date.now().toString().slice(-6)}`);
    setConfirmedByGateway(ref.confirmationPaiement?.confirme || false);
    setShowProcessModal(true);
  };

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    if (!selectedRefund) return;

    if (processAction === 'rembourse' && (!confirmedByGateway || !transactionRef.trim())) {
      setAlert({
        type: 'error',
        message: 'Conformité financière stricte : Vous devez cocher la confirmation et saisir la référence bancaire pour marquer le remboursement comme "Remboursé".'
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.put(`/admin/refunds/${selectedRefund._id}/process`, {
        action: processAction,
        reponse: processResponse,
        transactionRef,
        modeRemboursement,
        confirmeParSystemePaiement: confirmedByGateway
      });

      setAlert({
        type: 'success',
        message: `Dossier de remboursement mis à jour avec le statut : "${processAction.toUpperCase()}".`
      });
      setShowProcessModal(false);
      setSelectedRefund(null);
      fetchRefunds();
    } catch (err) {
      setAlert({ type: 'error', message: err.response?.data?.message || 'Erreur lors du traitement du remboursement' });
    } finally {
      setSubmitting(false);
    }
  };

  const renderBadge = (statut) => {
    if (statut === 'en_attente') return <span className="admin-badge warning"><Clock size={12} /> En attente</span>;
    if (statut === 'approuve' || statut === 'approuvee') return <span className="admin-badge info"><CheckCircle2 size={12} /> Approuvé</span>;
    if (statut === 'rembourse' || statut === 'remboursee') return <span className="admin-badge success"><CheckCircle2 size={12} /> Remboursé</span>;
    if (statut === 'refuse' || statut === 'rejetee') return <span className="admin-badge danger"><XCircle size={12} /> Refusé</span>;
    return <span className="admin-badge gray">{statut}</span>;
  };

  return (
    <AdminLayout
      title="Gestion des Remboursements"
      subtitle="Examinez les demandes de remboursement liées aux réclamations et validez la confirmation financière."
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
              placeholder="Rechercher par client ou motif..."
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
              <option value="approuve">ℹ️ Approuvé</option>
              <option value="rembourse">✅ Remboursé</option>
              <option value="refuse">❌ Refusé</option>
            </select>
          </div>
        </div>

        {/* Tableau des remboursements */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Chargement des remboursements...
            </div>
          ) : refunds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: '#94a3b8' }}>
              <RotateCcw size={40} style={{ margin: '0 auto 12px auto', display: 'block' }} />
              Aucun remboursement dans cette section
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Commande</th>
                  <th>Paiement Initial</th>
                  <th>Montant</th>
                  <th>Motif</th>
                  <th>Statut</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((ref) => (
                  <tr key={ref._id}>
                    <td>
                      {ref.client ? (
                        <div>
                          <strong>{ref.client.prenom} {ref.client.nom}</strong>
                          <div style={{ fontSize: 11, color: '#94a3b8' }}>{ref.client.email}</div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {ref.commande ? (
                        <div>
                          <strong>{ref.commande.numeroCommande}</strong>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            {ref.commande.modePaiement} ({ref.commande.statutPaiement})
                          </div>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {ref.paiement ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span className="admin-badge gray" style={{ fontSize: 11 }}>
                            {ref.paiement.reference}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>Vérifié sur commande</span>
                      )}
                    </td>
                    <td>
                      <strong style={{ fontSize: 15, color: '#ea580c' }}>
                        {Number(ref.montant).toFixed(2)} TND
                      </strong>
                    </td>
                    <td>
                      <div style={{ maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {ref.motif}
                      </div>
                    </td>
                    <td>{renderBadge(ref.statut)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          onClick={() => openProcessModal(ref)}
                          className="admin-btn admin-btn-sm admin-btn-primary"
                          title="Traiter la demande"
                        >
                          <span>Traiter</span>
                        </button>
                        <button
                          onClick={() => handleViewDetails(ref)}
                          className="admin-action-btn"
                          title="Voir les détails"
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

      {/* ================= MODAL TRAITEMENT DU REMBOURSEMENT ================= */}
      {showProcessModal && selectedRefund && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Traiter la demande de remboursement</h2>
              <button onClick={() => setShowProcessModal(false)} className="admin-modal-close">×</button>
            </div>
            <form onSubmit={handleProcessRefund}>
              <div className="admin-modal-body">
                {/* Vérification du paiement initial */}
                <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, color: '#0f172a', marginBottom: 6 }}>
                    <CreditCard size={18} color="#0284c7" />
                    Vérification du paiement initial de la commande
                  </div>
                  <div style={{ fontSize: 13, color: '#475569' }}>
                    Commande : <strong>{selectedRefund.commande?.numeroCommande}</strong> | Montant à rembourser : <strong style={{ color: '#ea580c' }}>{Number(selectedRefund.montant).toFixed(2)} TND</strong>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label>Action / Statut à attribuer *</label>
                  <select
                    className="admin-input"
                    value={processAction}
                    onChange={(e) => setProcessAction(e.target.value)}
                    required
                  >
                    <option value="approuve">Approuvé (Accord de principe, en attente d'exécution)</option>
                    <option value="rembourse">Remboursé (Opération financière confirmée)</option>
                    <option value="refuse">Refusé (Demande non recevable)</option>
                  </select>
                </div>

                {/* Si l'admin coche 'rembourse' : exiger la confirmation de conformité financière */}
                {processAction === 'rembourse' && (
                  <div style={{ padding: 16, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginBottom: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: '#b45309', marginBottom: 10 }}>
                      <ShieldCheck size={18} />
                      Conformité Stricte du Système de Paiement
                    </div>
                    <p style={{ fontSize: 12, color: '#92400e', margin: '0 0 12px 0' }}>
                      Règle obligatoire : Ne jamais déclarer un remboursement effectué si l'opération financière réelle n'a pas été confirmée par le système de paiement bancaire.
                    </p>

                    <div className="admin-form-row">
                      <div className="admin-form-group">
                        <label>Référence de transaction financière confirmée *</label>
                        <input
                          type="text"
                          className="admin-input"
                          value={transactionRef}
                          onChange={(e) => setTransactionRef(e.target.value)}
                          required
                          placeholder="Ex: TX-GATEWAY-98273"
                        />
                      </div>
                      <div className="admin-form-group">
                        <label>Mode de remboursement</label>
                        <select
                          className="admin-input"
                          value={modeRemboursement}
                          onChange={(e) => setModeRemboursement(e.target.value)}
                        >
                          <option value="Passerelle bancaire">Passerelle bancaire (Carte)</option>
                          <option value="Virement bancaire">Virement bancaire</option>
                          <option value="Bon d'achat / Avoir">Bon d'achat / Avoir</option>
                        </select>
                      </div>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 600, color: '#0f172a', cursor: 'pointer', marginTop: 8 }}>
                      <input
                        type="checkbox"
                        checked={confirmedByGateway}
                        onChange={(e) => setConfirmedByGateway(e.target.checked)}
                        style={{ width: 16, height: 16 }}
                      />
                      <span>Je confirme que l'opération financière a été validée et créditée sur le compte du client.</span>
                    </label>
                  </div>
                )}

                <div className="admin-form-group">
                  <label>Message / Décision notifiée au client *</label>
                  <textarea
                    className="admin-textarea"
                    value={processResponse}
                    onChange={(e) => setProcessResponse(e.target.value)}
                    required
                    placeholder="Détails du traitement du remboursement pour le client..."
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" onClick={() => setShowProcessModal(false)} className="admin-btn admin-btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={submitting} className="admin-btn admin-btn-primary">
                  {submitting ? 'Traitement...' : 'Enregistrer la décision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL DÉTAILS REMBOURSEMENT ================= */}
      {showDetailsModal && selectedRefund && (
        <div className="admin-modal-overlay">
          <div className="admin-modal admin-modal-lg">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">Dossier de Remboursement</h2>
              <button onClick={() => setShowDetailsModal(false)} className="admin-modal-close">×</button>
            </div>
            <div className="admin-modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 20, padding: 16, background: '#f8fafc', borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>MONTANT REMBOURSEMENT</div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: '#ea580c' }}>
                    {Number(selectedRefund.montant).toFixed(2)} TND
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>STATUT</div>
                  <div>{renderBadge(selectedRefund.statut)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>CLIENT</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {selectedRefund.client?.prenom} {selectedRefund.client?.nom}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>COMMANDE</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {selectedRefund.commande?.numeroCommande}
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                  Motif du remboursement
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{selectedRefund.motif}</div>
                {selectedRefund.details && (
                  <p style={{ fontSize: 13, color: '#475569', margin: '6px 0 0 0' }}>{selectedRefund.details}</p>
                )}
              </div>

              {/* Détails de la confirmation financière si effectuée */}
              {selectedRefund.confirmationPaiement?.confirme && (
                <div style={{ padding: 14, background: '#ecfdf5', borderRadius: 8, border: '1px solid #a7f3d0', marginBottom: 16 }}>
                  <div style={{ fontWeight: 700, color: '#065f46', marginBottom: 6 }}>
                    Confirmation financière bancaire enregistrée :
                  </div>
                  <div style={{ fontSize: 13, color: '#065f46' }}>
                    Réf transaction : <strong>{selectedRefund.confirmationPaiement.referenceTransaction}</strong> | Mode : <strong>{selectedRefund.confirmationPaiement.mode}</strong>
                  </div>
                </div>
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
