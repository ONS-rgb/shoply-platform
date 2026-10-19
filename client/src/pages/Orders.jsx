import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { PLACEHOLDER } from '../components/ProductCard';
import '../styles/shop.css';

const STATUS_LABELS = {
  en_attente: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  confirmee: { label: 'Confirmée', color: '#2563eb', bg: '#dbeafe' },
  en_preparation: { label: 'En préparation', color: '#7c3aed', bg: '#ede9fe' },
  expediee: { label: 'Expédiée', color: '#0284c7', bg: '#e0f2fe' },
  livree: { label: 'Livrée', color: '#16a34a', bg: '#dcfce7' },
  annulee: { label: 'Annulée', color: '#dc2626', bg: '#fee2e2' }
};

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('toutes');
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelMotif, setCancelMotif] = useState('');
  const [actionMsg, setActionMsg] = useState({ type: '', text: '' });

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/orders');
      setOrders(data.data || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async (orderId) => {
    setActionMsg({ type: '', text: '' });
    try {
      await api.put(`/orders/${orderId}/cancel`, { motif: cancelMotif });
      setActionMsg({ type: 'ok', text: 'Commande annulée avec succès ✅' });
      setCancellingId(null);
      setCancelMotif('');
      loadOrders();
    } catch (err) {
      setActionMsg({ type: 'error', text: err.response?.data?.message || 'Erreur lors de l\'annulation' });
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === 'en_cours') return ['en_attente', 'confirmee', 'en_preparation', 'expediee'].includes(o.statut);
    if (filter === 'livree') return o.statut === 'livree';
    if (filter === 'annulee') return o.statut === 'annulee';
    return true;
  });

  return (
    <div className="page" style={{ background: '#EAEDED' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, margin: '0 0 20px', color: '#0F172A' }}>
          Mes commandes et retours
        </h1>

        {actionMsg.text && <div className={`alert ${actionMsg.type}`}>{actionMsg.text}</div>}

        {/* Onglets de filtrage */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #d1d5db', paddingBottom: 10, flexWrap: 'wrap' }}>
          {[
            { id: 'toutes', label: 'Toutes les commandes' },
            { id: 'en_cours', label: 'En cours' },
            { id: 'livree', label: 'Livrées' },
            { id: 'annulee', label: 'Annulées' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              style={{
                background: filter === tab.id ? '#0F172A' : '#fff',
                color: filter === tab.id ? '#fff' : '#374151',
                border: '1px solid #d1d5db',
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="box"><p className="muted">Chargement de vos commandes...</p></div>
        ) : filteredOrders.length === 0 ? (
          <div className="box empty" style={{ padding: '60px 20px' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📦</span>
            <h3 style={{ margin: '0 0 8px' }}>Aucune commande trouvée</h3>
            <p className="muted" style={{ margin: '0 0 20px' }}>
              Vous n'avez pas encore passé de commande dans cette catégorie.
            </p>
            <Link to="/" className="btn-orange" style={{ width: 'auto', display: 'inline-block', padding: '10px 24px' }}>
              Commencer mes achats
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {filteredOrders.map((order) => {
              const statusCfg = STATUS_LABELS[order.statut] || STATUS_LABELS.en_attente;
              const canCancel = ['en_attente', 'confirmee'].includes(order.statut);

              return (
                <div key={order._id} className="box" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Entête de carte commande (Amazon style) */}
                  <div
                    style={{
                      background: '#f9fafb',
                      padding: '14px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderBottom: '1px solid #e5e7eb',
                      flexWrap: 'wrap',
                      gap: 14,
                      fontSize: 13
                    }}
                  >
                    <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                      <div>
                        <span className="muted" style={{ display: 'block' }}>COMMANDE PASSÉE LE</span>
                        <strong>{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                      </div>
                      <div>
                        <span className="muted" style={{ display: 'block' }}>TOTAL</span>
                        <strong>{Number(order.total).toFixed(2)} TND</strong>
                      </div>
                      <div>
                        <span className="muted" style={{ display: 'block' }}>LIVRER À</span>
                        <span title={order.adresseLivraison?.rue}>{order.adresseLivraison?.nomComplet} ▾</span>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span className="muted" style={{ display: 'block' }}>COMMANDE N°</span>
                      <strong style={{ color: '#0369a1' }}>{order.numeroCommande}</strong>
                    </div>
                  </div>

                  {/* Corps de la commande */}
                  <div style={{ padding: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            background: statusCfg.bg,
                            color: statusCfg.color,
                            padding: '4px 12px',
                            borderRadius: 16,
                            fontWeight: 700,
                            fontSize: 13
                          }}
                        >
                          ● {statusCfg.label}
                        </span>
                        <span style={{ fontSize: 13, color: '#6b7280' }}>
                          Mode : {order.modeLivraison?.nom || 'Livraison Standard'}
                        </span>
                      </div>

                      <Link
                        to={`/orders/${order._id}`}
                        className="link-btn"
                        style={{ fontWeight: 600, fontSize: 14 }}
                      >
                        Suivre le colis & Détails ›
                      </Link>
                    </div>

                    {/* Liste des articles */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {order.articles.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                          <img
                            src={item.image || PLACEHOLDER}
                            alt=""
                            style={{ width: 70, height: 70, objectFit: 'contain', background: '#f9fafb', borderRadius: 8, border: '1px solid #e5e7eb' }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <Link to={`/product/${item.produit}`} className="plain" style={{ fontWeight: 600, fontSize: 15 }}>
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
                                padding: '6px 12px',
                                fontSize: 13,
                                color: '#374151',
                                textDecoration: 'none',
                                fontWeight: 600,
                                whiteSpace: 'nowrap'
                              }}
                            >
                              ⭐ Donner votre avis
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Actions d'annulation */}
                    {canCancel && (
                      <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                        {cancellingId === order._id ? (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', maxWidth: 450 }}>
                            <input
                              placeholder="Motif de l'annulation (optionnel)"
                              value={cancelMotif}
                              onChange={(e) => setCancelMotif(e.target.value)}
                              style={{ flex: 1, padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 13 }}
                            />
                            <button
                              type="button"
                              onClick={() => handleCancelOrder(order._id)}
                              style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 6, fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                            >
                              Confirmer
                            </button>
                            <button
                              type="button"
                              onClick={() => setCancellingId(null)}
                              style={{ background: '#e5e7eb', color: '#374151', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="link-btn"
                            style={{ color: '#dc2626', fontSize: 13, fontWeight: 600 }}
                            onClick={() => setCancellingId(order._id)}
                          >
                            ❌ Annuler cette commande
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
