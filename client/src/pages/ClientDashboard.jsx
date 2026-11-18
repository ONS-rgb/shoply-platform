import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import '../styles/shop.css';

const STATUS_BADGES = {
  en_attente: { label: 'En attente', color: '#f59e0b', bg: '#fef3c7' },
  confirmee: { label: 'Confirmée', color: '#2563eb', bg: '#dbeafe' },
  en_preparation: { label: 'En préparation', color: '#7c3aed', bg: '#ede9fe' },
  expediee: { label: 'Expédiée', color: '#0284c7', bg: '#e0f2fe' },
  livree: { label: 'Livrée', color: '#16a34a', bg: '#dcfce7' },
  annulee: { label: 'Annulée', color: '#dc2626', bg: '#fee2e2' }
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const { cart } = useCart();
  const [stats, setStats] = useState({
    totalOrders: 0,
    activeOrders: 0,
    reviewsCount: 0,
    refundsCount: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [ordersRes, reviewsRes, refundsRes] = await Promise.all([
          api.get('/orders').catch(() => ({ data: { data: [] } })),
          api.get('/reviews/my').catch(() => ({ data: { data: [] } })),
          api.get('/refunds/my').catch(() => ({ data: { data: [] } }))
        ]);

        const orders = ordersRes.data?.data || [];
        const reviews = reviewsRes.data?.data || [];
        const refunds = refundsRes.data?.data || [];

        const activeOrders = orders.filter((o) =>
          ['en_attente', 'confirmee', 'en_preparation', 'expediee'].includes(o.statut)
        ).length;

        setStats({
          totalOrders: orders.length,
          activeOrders,
          reviewsCount: reviews.length,
          refundsCount: refunds.length
        });

        setRecentOrders(orders.slice(0, 3));
      } catch {
        // silencieux
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="page" style={{ background: '#EAEDED', minHeight: '85vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        {/* ===== EN-TÊTE DU DASHBOARD CLIENT ===== */}
        <div
          className="box"
          style={{
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            color: '#fff',
            borderRadius: 12,
            padding: '24px 28px',
            marginBottom: 24,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #F97316'
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: '#F97316',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  fontWeight: 800
                }}
              >
                {(user?.prenom?.[0] || user?.nom?.[0] || 'C').toUpperCase()}
              </div>
            )}

            <div>
              <span style={{ fontSize: 13, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                Espace Client Shoply
              </span>
              <h1 style={{ margin: '4px 0 0', fontSize: 24, color: '#fff', fontWeight: 800 }}>
                Bonjour, {user?.prenom || user?.nom || 'Client'} ! 👋
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: 13, color: '#CBD5E1' }}>
                {user?.email} · Compte vérifié
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link
              to="/profile"
              style={{
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              👤 Modifier mon profil
            </Link>
            <Link
              to="/products"
              style={{
                background: '#F97316',
                color: '#fff',
                padding: '8px 18px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: '0 2px 8px rgba(249,115,22,0.4)'
              }}
            >
              🛍️ Découvrir les produits
            </Link>
          </div>
        </div>

        {/* ===== STATISTIQUES CLÉS ===== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="box" style={{ padding: 18, borderLeft: '4px solid #F97316' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>COMMANDES TOTALES</span>
              <span style={{ fontSize: 22 }}>📦</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginTop: 6 }}>
              {stats.totalOrders}
            </div>
            <Link to="/orders" style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
              Voir l'historique ›
            </Link>
          </div>

          <div className="box" style={{ padding: 18, borderLeft: '4px solid #2563eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>COMMANDES EN COURS</span>
              <span style={{ fontSize: 22 }}>🚚</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb', marginTop: 6 }}>
              {stats.activeOrders}
            </div>
            <Link to="/orders" style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
              Suivre mes colis ›
            </Link>
          </div>

          <div className="box" style={{ padding: 18, borderLeft: '4px solid #eab308' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>MES AVIS PUBLIÉS</span>
              <span style={{ fontSize: 22 }}>⭐</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#ca8a04', marginTop: 6 }}>
              {stats.reviewsCount}
            </div>
            <Link to="/my-reviews" style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
              Gérer mes avis ›
            </Link>
          </div>

          <div className="box" style={{ padding: 18, borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="muted" style={{ fontSize: 13, fontWeight: 600 }}>REMBOURSEMENTS</span>
              <span style={{ fontSize: 22 }}>💰</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#059669', marginTop: 6 }}>
              {stats.refundsCount}
            </div>
            <Link to="/my-refunds" style={{ fontSize: 12, color: '#0369a1', fontWeight: 600, textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
              Consulter mes retours ›
            </Link>
          </div>
        </div>

        {/* ===== RACCOURCIS ET NAVIGATION RAPIDE CLIENT ===== */}
        <div className="box" style={{ marginBottom: 24, padding: 20 }}>
          <h2 style={{ fontSize: 18, margin: '0 0 16px', color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>⚡</span> Raccourcis et Actions rapides
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Link
              to="/orders"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 24 }}>📦</span>
              <div>
                <div>Mes commandes</div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Suivi et historique</span>
              </div>
            </Link>

            <Link
              to="/cart"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 24 }}>🛒</span>
              <div>
                <div>Mon Panier</div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>{cart.nbArticles} article(s)</span>
              </div>
            </Link>

            <Link
              to="/my-reviews"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 24 }}>⭐</span>
              <div>
                <div>Mes Avis & Notes</div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Évaluations produits</span>
              </div>
            </Link>

            <Link
              to="/my-refunds"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 24 }}>💰</span>
              <div>
                <div>Remboursements</div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Suivi des demandes</span>
              </div>
            </Link>

            <Link
              to="/notifications"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 24 }}>🔔</span>
              <div>
                <div>Mes Notifications</div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Alertes et messages</span>
              </div>
            </Link>

            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                borderRadius: 10,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                textDecoration: 'none',
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 14,
                transition: 'all 0.2s'
              }}
            >
              <span style={{ fontSize: 24 }}>📍</span>
              <div>
                <div>Mes Adresses</div>
                <span style={{ fontSize: 11, color: '#64748b', fontWeight: 400 }}>Carnet de livraison</span>
              </div>
            </Link>
          </div>
        </div>

        {/* ===== DERNIÈRES COMMANDES ===== */}
        <div className="box" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📦</span> Mes Dernières Commandes
            </h2>
            <Link to="/orders" style={{ fontSize: 13, color: '#0369a1', fontWeight: 600, textDecoration: 'none' }}>
              Voir toutes les commandes ({stats.totalOrders}) ›
            </Link>
          </div>

          {loading ? (
            <p className="muted">Chargement de vos commandes...</p>
          ) : recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 10px', color: '#64748b' }}>
              <span style={{ fontSize: 36, display: 'block', marginBottom: 8 }}>🛍️</span>
              <p style={{ margin: '0 0 12px' }}>Vous n'avez pas encore passé de commande.</p>
              <Link to="/products" className="btn-orange" style={{ width: 'auto', display: 'inline-block', padding: '8px 20px', fontSize: 13 }}>
                Découvrir le catalogue
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentOrders.map((order) => {
                const badge = STATUS_BADGES[order.statut] || STATUS_BADGES.en_attente;

                return (
                  <div
                    key={order._id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '14px 16px',
                      background: '#f8fafc',
                      borderRadius: 10,
                      border: '1px solid #e2e8f0',
                      flexWrap: 'wrap',
                      gap: 12
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <strong style={{ fontSize: 15, color: '#0369a1' }}>{order.numeroCommande}</strong>
                        <span
                          style={{
                            background: badge.bg,
                            color: badge.color,
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          ● {badge.label}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, color: '#64748b', marginTop: 4, display: 'block' }}>
                        Passée le {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · {order.articles?.length || 0} article(s)
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <strong style={{ fontSize: 16, color: '#111' }}>
                        {Number(order.total).toFixed(2)} TND
                      </strong>
                      <Link
                        to={`/orders/${order._id}`}
                        style={{
                          background: '#fff',
                          border: '1px solid #cbd5e1',
                          padding: '6px 14px',
                          borderRadius: 6,
                          fontSize: 13,
                          color: '#0F172A',
                          fontWeight: 600,
                          textDecoration: 'none'
                        }}
                      >
                        Suivre ›
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
