import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { PLACEHOLDER } from '../components/ProductCard';
import '../styles/shop.css';

const TRACKING_STEPS = [
  { key: 'en_attente', label: 'Commande passée', icon: '📝' },
  { key: 'confirmee', label: 'Confirmée', icon: '✅' },
  { key: 'en_preparation', label: 'En préparation', icon: '📦' },
  { key: 'expediee', label: 'Expédiée', icon: '🚚' },
  { key: 'livree', label: 'Livrée', icon: '🏠' }
];

export default function OrderDetail() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Annulation
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelMotif, setCancelMotif] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Remboursement
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundForm, setRefundForm] = useState({
    motif: 'Commande non traitée dans les délais impartis',
    details: ''
  });
  const [refundStatus, setRefundStatus] = useState(null);

  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadOrder = async () => {
    try {
      const { data } = await api.get(`/orders/${id}`);
      setOrder(data.data);

      // Vérifier si un remboursement existe déjà
      try {
        const refRes = await api.get('/refunds/my');
        const match = (refRes.data.data || []).find(
          (r) => (r.commande?._id || r.commande) === id
        );
        if (match) setRefundStatus(match);
      } catch {
        // silencieux
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Commande introuvable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await api.put(`/orders/${id}/cancel`, { motif: cancelMotif });
      showToast('Commande annulée avec succès ✅');
      setShowCancelModal(false);
      loadOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de l\'annulation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefundSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const { data } = await api.post('/refunds', {
        commandeId: id,
        motif: refundForm.motif,
        details: refundForm.details
      });
      setRefundStatus(data.data);
      setShowRefundModal(false);
      showToast('Demande de remboursement transmise avec succès ✅');
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la demande de remboursement');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="page"><p className="muted">Chargement des détails de la commande...</p></div>;

  if (error || !order) {
    return (
      <div className="page">
        <div className="box empty" style={{ maxWidth: 500, margin: '40px auto' }}>
          <h2>{error || 'Commande introuvable'}</h2>
          <Link to="/orders" className="btn-orange" style={{ width: 'auto', display: 'inline-block', padding: '10px 24px', marginTop: 10 }}>
            Retour à mes commandes
          </Link>
        </div>
      </div>
    );
  }

  const isCancelled = order.statut === 'annulee';
  const currentStepIdx = isCancelled ? -1 : TRACKING_STEPS.findIndex((s) => s.key === order.statut);
  const canCancel = ['en_attente', 'confirmee'].includes(order.statut);
  const canRefund = !isCancelled && !refundStatus;

  return (
    <div className="page" style={{ background: '#EAEDED' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div className="crumbs" style={{ margin: 0 }}>
            <Link to="/orders">‹ Mes commandes</Link> › Commande {order.numeroCommande}
          </div>
          <button type="button" onClick={loadOrder} className="link-btn" style={{ fontSize: 13 }}>
            🔄 Actualiser le statut
          </button>
        </div>

        {toast && <div className="toast">{toast}</div>}

        {/* ===== STEPPER VISUEL DE SUIVI (STYLE AMAZON TRACKING) ===== */}
        <div className="box" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h1 style={{ fontSize: 22, margin: 0 }}>
                Suivi du colis : <span style={{ color: '#F97316' }}>{order.numeroCommande}</span>
              </h1>
              <span className="muted">
                Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {isCancelled ? (
              <span style={{ background: '#fee2e2', color: '#dc2626', padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: 14 }}>
                ❌ Commande annulée
              </span>
            ) : (
              <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '6px 14px', borderRadius: 20, fontWeight: 700, fontSize: 14 }}>
                Mode : {order.modeLivraison?.nom || 'Livraison Standard'}
              </span>
            )}
          </div>

          {/* Stepper graphique */}
          {isCancelled ? (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 16, color: '#991b1b', fontSize: 14 }}>
              <strong>Cette commande a été annulée.</strong> Le stock des articles a été automatiquement réintégré et aucun prélèvement n'est dû.
            </div>
          ) : (
            <div style={{ padding: '20px 10px', overflowX: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 600, position: 'relative' }}>
                {TRACKING_STEPS.map((step, idx) => {
                  const isCompleted = idx <= currentStepIdx;
                  const isCurrent = idx === currentStepIdx;

                  return (
                    <div
                      key={step.key}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        flex: 1,
                        position: 'relative',
                        zIndex: 2
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: isCompleted ? (isCurrent ? '#F97316' : '#16a34a') : '#e5e7eb',
                          color: isCompleted ? '#fff' : '#9ca3af',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 20,
                          fontWeight: 700,
                          boxShadow: isCurrent ? '0 0 0 4px #ffedd5' : 'none',
                          transition: 'all 0.3s'
                        }}
                      >
                        {isCompleted && !isCurrent ? '✓' : step.icon}
                      </div>

                      <span
                        style={{
                          marginTop: 8,
                          fontSize: 13,
                          fontWeight: isCurrent ? 700 : 500,
                          color: isCurrent ? '#F97316' : isCompleted ? '#111' : '#9ca3af',
                          textAlign: 'center'
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  );
                })}

                {/* Barre de progression derrière les étapes */}
                <div
                  style={{
                    position: 'absolute',
                    top: 22,
                    left: '10%',
                    right: '10%',
                    height: 4,
                    background: '#e5e7eb',
                    zIndex: 1
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      background: '#16a34a',
                      width: `${(currentStepIdx / (TRACKING_STEPS.length - 1)) * 100}%`,
                      transition: 'width 0.4s ease'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Statut de remboursement le cas échéant */}
          {refundStatus && (
            <div style={{ marginTop: 16, background: '#fefce8', border: '1px solid #fef08a', padding: 14, borderRadius: 8, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>💰 Demande de remboursement en cours :</strong>
                <span style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: 12, background: '#fef08a', color: '#854d0e', padding: '2px 8px', borderRadius: 10 }}>
                  {refundStatus.statut.replace('_', ' ')}
                </span>
              </div>
              <p style={{ margin: '6px 0 0', color: '#713f12' }}>
                Motif : {refundStatus.motif} ({Number(refundStatus.montant).toFixed(2)} TND)
              </p>
            </div>
          )}
        </div>

        {/* ===== INFORMATIONS DÉTAILLÉES DE LA COMMANDE ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Adresse où la commande doit arriver (Amazon style) */}
            <div className="box">
              <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📍</span> Adresse où la commande va arriver
              </h2>
              <div style={{ background: '#f9fafb', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 14, lineHeight: 1.5 }}>
                <strong style={{ fontSize: 15, display: 'block', color: '#111827' }}>
                  {order.adresseLivraison?.nomComplet}
                </strong>
                <span style={{ color: '#374151' }}>{order.adresseLivraison?.rue}</span>
                <br />
                <span style={{ color: '#374151' }}>
                  {order.adresseLivraison?.codePostal && `${order.adresseLivraison.codePostal} `}
                  {order.adresseLivraison?.ville}, {order.adresseLivraison?.pays || 'Tunisie'}
                </span>
                <div style={{ marginTop: 6, color: '#4b5563' }}>
                  📞 Téléphone : <strong>{order.adresseLivraison?.telephone}</strong>
                </div>
                {order.adresseLivraison?.instructions && (
                  <div style={{ marginTop: 8, fontStyle: 'italic', color: '#0369a1', background: '#eff6ff', padding: '6px 10px', borderRadius: 4 }}>
                    Instructions de livraison : {order.adresseLivraison.instructions}
                  </div>
                )}
              </div>
            </div>

            {/* Articles commandés */}
            <div className="box">
              <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 16 }}>Articles dans le colis</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {order.articles.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: 14 }}>
                    <img
                      src={item.image || PLACEHOLDER}
                      alt=""
                      style={{ width: 80, height: 80, objectFit: 'contain', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Link to={`/product/${item.produit}`} className="plain" style={{ fontWeight: 700, fontSize: 15 }}>
                        {item.nom}
                      </Link>
                      <div style={{ fontSize: 13, color: '#6b7280', margin: '4px 0' }}>
                        Quantité : {item.quantite} {item.couleur && `· Couleur : ${item.couleur}`}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>
                        {Number(item.prix).toFixed(2)} TND
                      </div>
                    </div>

                    <div>
                      <Link
                        to={`/product/${item.produit}#reviews`}
                        style={{
                          display: 'inline-block',
                          border: '1px solid #d1d5db',
                          borderRadius: 6,
                          padding: '8px 14px',
                          fontSize: 13,
                          color: '#374151',
                          textDecoration: 'none',
                          fontWeight: 600,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ⭐ Évaluer cet article
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Historique chronologique des statuts */}
            <div className="box">
              <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 12 }}>Historique des événements</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.historiqueStatuts?.map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                    <span style={{ color: '#9ca3af', minWidth: 130 }}>
                      {new Date(h.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div>
                      <strong>{h.statut.replace('_', ' ')}</strong>
                      {h.commentaire && <span className="muted" style={{ marginLeft: 8 }}>— {h.commentaire}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ===== COLONNE DE DROITE : PAIEMENT & ACTIONS ===== */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="box">
              <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 14 }}>Détails du paiement</h3>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: 14 }}>
                <span className="muted">Mode de paiement :</span>
                <strong>{order.modePaiement === 'carte' ? '💳 Carte bancaire' : '💵 À la livraison'}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: 14 }}>
                <span className="muted">Statut paiement :</span>
                <span style={{ textTransform: 'capitalize', fontWeight: 600, color: order.statutPaiement === 'paye' ? '#16a34a' : '#b45309' }}>
                  {order.statutPaiement.replace('_', ' ')}
                </span>
              </div>

              <div style={{ borderTop: '1px solid #f3f4f6', margin: '12px 0', paddingTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: 14 }}>
                  <span className="muted">Sous-total :</span>
                  <span>{Number(order.sousTotal).toFixed(2)} TND</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0', fontSize: 14 }}>
                  <span className="muted">Frais de livraison :</span>
                  <span>{order.fraisLivraison > 0 ? `${Number(order.fraisLivraison).toFixed(2)} TND` : 'Gratuit'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: '2px solid #e5e7eb', fontSize: 17 }}>
                  <strong>Total TTC :</strong>
                  <strong style={{ color: '#F97316' }}>{Number(order.total).toFixed(2)} TND</strong>
                </div>
              </div>

              {/* Bouton d'annulation si éligible */}
              {canCancel && (
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#fff',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 12
                  }}
                >
                  ❌ Annuler cette commande
                </button>
              )}

              {/* Bouton de remboursement si éligible */}
              {canRefund && (
                <button
                  type="button"
                  onClick={() => setShowRefundModal(true)}
                  style={{
                    width: '100%',
                    padding: 10,
                    background: '#fff',
                    color: '#0369a1',
                    border: '1px solid #0369a1',
                    borderRadius: 8,
                    fontWeight: 700,
                    cursor: 'pointer',
                    marginTop: 8
                  }}
                >
                  💰 Demander un remboursement
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MODAL D'ANNULATION */}
        {showCancelModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <div className="box" style={{ maxWidth: 450, width: '100%' }}>
              <h3 style={{ marginTop: 0 }}>Confirmer l'annulation</h3>
              <p style={{ fontSize: 14, color: '#4b5563' }}>
                Êtes-vous sûr de vouloir annuler la commande <strong>{order.numeroCommande}</strong> ? Le stock sera automatiquement remis en rayon.
              </p>
              <div className="field">
                <label>Motif d'annulation (optionnel)</label>
                <input placeholder="Ex: Changement d'avis, erreur d'adresse..." value={cancelMotif} onChange={(e) => setCancelMotif(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn-outline" style={{ width: 'auto', marginTop: 0 }} onClick={() => setShowCancelModal(false)}>
                  Fermer
                </button>
                <button type="button" onClick={handleCancel} disabled={actionLoading} style={{ background: '#dc2626', color: '#fff', border: 'none', borderRadius: 20, padding: '10px 20px', fontWeight: 700, cursor: 'pointer' }}>
                  {actionLoading ? 'Annulation...' : 'Oui, annuler'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL DE DEMANDE DE REMBOURSEMENT */}
        {showRefundModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <form onSubmit={handleRefundSubmit} className="box" style={{ maxWidth: 500, width: '100%' }}>
              <h3 style={{ marginTop: 0 }}>Demande de remboursement</h3>
              <p style={{ fontSize: 14, color: '#4b5563' }}>
                Conformément à la politique d'achat de Shoply, vous pouvez demander le remboursement intégral de <strong>{Number(order.total).toFixed(2)} TND</strong>.
              </p>

              <div className="field">
                <label>Motif de la demande *</label>
                <select
                  value={refundForm.motif}
                  onChange={(e) => setRefundForm({ ...refundForm, motif: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff' }}
                >
                  <option value="Commande non traitée dans les délais impartis">Commande non traitée dans les délais impartis</option>
                  <option value="Article défectueux ou non conforme à la description">Article défectueux ou non conforme</option>
                  <option value="Retard de livraison excessif">Retard de livraison excessif</option>
                  <option value="Autre motif">Autre motif</option>
                </select>
              </div>

              <div className="field">
                <label>Précisions complémentaires</label>
                <textarea
                  rows={3}
                  placeholder="Décrivez votre situation en détail..."
                  value={refundForm.details}
                  onChange={(e) => setRefundForm({ ...refundForm, details: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: 8, border: '1px solid #d1d5db' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
                <button type="button" className="btn-outline" style={{ width: 'auto', marginTop: 0 }} onClick={() => setShowRefundModal(false)}>
                  Annuler
                </button>
                <button type="submit" disabled={actionLoading} className="btn-orange" style={{ width: 'auto' }}>
                  {actionLoading ? 'Transmission...' : 'Envoyer ma demande'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
