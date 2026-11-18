import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/shop.css';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('toutes');
  const navigate = useNavigate();

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAsRead = async (notif) => {
    if (!notif.lu) {
      try {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, lu: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // silencieux
      }
    }
    if (notif.lien) {
      navigate(notif.lien);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
      setUnreadCount(0);
    } catch {
      // silencieux
    }
  };

  const filtered = notifications.filter((n) => {
    if (filter === 'non_lues') return !n.lu;
    return true;
  });

  return (
    <div className="page" style={{ background: '#EAEDED', minHeight: '85vh', padding: '24px 20px' }}>
      <div style={{ maxWidth: 850, margin: '0 auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="crumbs" style={{ margin: '0 0 6px' }}>
              <Link to="/dashboard">‹ Mon Espace Client</Link>
            </div>
            <h1 style={{ fontSize: 26, margin: 0, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span>🔔</span> Mes Notifications
              {unreadCount > 0 && (
                <span style={{ fontSize: 13, background: '#fee2e2', color: '#b91c1c', padding: '2px 10px', borderRadius: 12, fontWeight: 700 }}>
                  {unreadCount} non lue(s)
                </span>
              )}
            </h1>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="btn-outline"
              style={{ width: 'auto', marginTop: 0, fontSize: 13, padding: '8px 16px' }}
            >
              ✓ Tout marquer comme lu
            </button>
          )}
        </div>

        {/* Filtres */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => setFilter('toutes')}
            style={{
              background: filter === 'toutes' ? '#0F172A' : '#fff',
              color: filter === 'toutes' ? '#fff' : '#374151',
              border: '1px solid #d1d5db',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Toutes ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('non_lues')}
            style={{
              background: filter === 'non_lues' ? '#0F172A' : '#fff',
              color: filter === 'non_lues' ? '#fff' : '#374151',
              border: '1px solid #d1d5db',
              padding: '6px 16px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Non lues ({unreadCount})
          </button>
        </div>

        {loading ? (
          <div className="box"><p className="muted">Chargement de vos notifications...</p></div>
        ) : filtered.length === 0 ? (
          <div className="box empty" style={{ padding: '60px 20px', textAlign: 'center' }}>
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>📭</span>
            <h3 style={{ margin: '0 0 8px' }}>Aucune notification</h3>
            <p className="muted" style={{ margin: '0 0 20px' }}>
              {filter === 'non_lues' ? 'Vous avez lu toutes vos notifications.' : 'Vous n\'avez aucune notification pour le moment.'}
            </p>
            <Link to="/products" className="btn-orange" style={{ width: 'auto', display: 'inline-block', padding: '10px 24px' }}>
              Découvrir les produits
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((n) => (
              <div
                key={n._id}
                onClick={() => handleMarkAsRead(n)}
                className="box"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  cursor: 'pointer',
                  background: n.lu ? '#fff' : '#f0f9ff',
                  border: n.lu ? '1px solid #e2e8f0' : '2px solid #bae6fd',
                  borderRadius: 10,
                  transition: 'all 0.2s',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: 26, flexShrink: 0 }}>
                  {n.type === 'commande' ? '📦' : n.type === 'remboursement' ? '💰' : '🔔'}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 15, color: '#0F172A' }}>{n.titre}</strong>
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>
                      {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <p style={{ margin: '6px 0 0', fontSize: 14, color: '#475569', lineHeight: 1.4 }}>
                    {n.message}
                  </p>
                </div>

                {!n.lu && (
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: '#0284c7',
                      flexShrink: 0
                    }}
                    title="Non lu"
                  />
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
