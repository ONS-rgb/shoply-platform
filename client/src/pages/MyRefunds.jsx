import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/shop.css';

const REFUND_STATUSES = {
  en_attente: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7', icon: '⏳' },
  approuvee: { label: 'Approuvée', color: '#16a34a', bg: '#dcfce7', icon: '✅' },
  rejetee: { label: 'Refusée', color: '#dc2626', bg: '#fee2e2', icon: '❌' },
  remboursee: { label: 'Remboursée', color: '#059669', bg: '#ecfdf5', icon: '💸' }
};

export default function MyRefunds() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRefunds = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/refunds/my');
        setRefunds(data.data || []);
      } catch {
        setRefunds([]);
      } finally {
        setLoading(false);
      }
    };
    loadRefunds();
  }, []);

  return (
    <div className="page" style={{ background: '#EAEDED', minHeight: '85vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <div className="crumbs" style={{ margin: '0 0 6px' }}>
              <Link to="/dashboard">‹ Mon Espace Client</Link>
            </div>
            <h1 style={{ fontSize: 26, margin: 0, color: '#0F172A' }}>
              💰 Mes Demandes de Remboursement
            </h1>
          </div>
          <Link to="/orders" className="link-btn" style={{ fontWeight: 600, fontSize: 14 }}>
            📦 Consulter mes commandes pour faire une demande ›
          </Link>
        </div>

        {loading ? (
          <div className="box"><p className="muted">Chargement de vos demandes...</p></div>
        ) : refunds.length === 0 ? (
          <div className="box empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>💰</span>
            <h3 style={{ margin: '0 0 8px' }}>Aucune demande de remboursement</h3>
            <p className="muted" style={{ margin: '0 0 20px' }}>
              Si une commande tarde à être confirmée ou présente un problème, vous pouvez demander son remboursement directement depuis le détail de la commande.
            </p>
            <Link to="/orders" className="btn-orange" style={{ width: 'auto', display: 'inline-block', padding: '10px 24px' }}>
              Voir mes commandes
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {refunds.map((refItem) => {
              const statusCfg = REFUND_STATUSES[refItem.statut] || REFUND_STATUSES.en_attente;
              const cmd = refItem.commande || {};

              return (
                <div key={refItem._id} className="box" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, borderBottom: '1px solid #f1f5f9', paddingBottom: 14, marginBottom: 14 }}>
                    <div>
                      <span className="muted" style={{ fontSize: 12, display: 'block' }}>COMMANDE CONCERNÉE</span>
                      <Link to={`/orders/${cmd._id}`} style={{ fontSize: 16, fontWeight: 700, color: '#0369a1', textDecoration: 'none' }}>
                        {cmd.numeroCommande || 'Commande'} ↗
                      </Link>
                      <span style={{ fontSize: 12, color: '#64748b', marginLeft: 10 }}>
                        Demandée le {new Date(refItem.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          background: statusCfg.bg,
                          color: statusCfg.color,
                          padding: '4px 14px',
                          borderRadius: 20,
                          fontWeight: 700,
                          fontSize: 13,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6
                        }}
                      >
                        {statusCfg.icon} {statusCfg.label}
                      </span>
                      <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>
                        Montant : {Number(refItem.montant).toFixed(2)} TND
                      </div>
                    </div>
                  </div>

                  <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14 }}>
                    <div style={{ marginBottom: 6 }}>
                      <strong style={{ color: '#334155' }}>Motif :</strong> {refItem.motif}
                    </div>
                    {refItem.details && (
                      <div style={{ color: '#475569' }}>
                        <strong style={{ color: '#334155' }}>Précisions :</strong> {refItem.details}
                      </div>
                    )}
                  </div>

                  {/* Réponse du vendeur / Statut */}
                  {refItem.reponseVendeur ? (
                    <div style={{ marginTop: 14, background: refItem.statut === 'approuvee' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${refItem.statut === 'approuvee' ? '#bbf7d0' : '#fecaca'}`, padding: 14, borderRadius: 8, fontSize: 13 }}>
                      <strong style={{ color: refItem.statut === 'approuvee' ? '#166534' : '#991b1b', display: 'block', marginBottom: 4 }}>
                        🏪 Réponse du vendeur :
                      </strong>
                      <span style={{ color: refItem.statut === 'approuvee' ? '#14532d' : '#7f1d1d' }}>
                        {refItem.reponseVendeur}
                      </span>
                      {refItem.dateReponseVendeur && (
                        <span style={{ display: 'block', fontSize: 11, color: '#64748b', marginTop: 4 }}>
                          Traité le {new Date(refItem.dateReponseVendeur).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                      ⏳ En cours d'analyse par l'équipe et le vendeur. Vous recevrez une notification dès que la demande sera traitée.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
