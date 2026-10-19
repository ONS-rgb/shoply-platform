import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silencieux
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Actualiser toutes les 30s
    return () => clearInterval(interval);
  }, [user]);

  // Fermer quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        // ignorer
      }
    }
    setOpen(false);
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
      // ignorer
    }
  };

  if (!user) return null;

  return (
    <div className="nb-notif-wrap" ref={menuRef} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="nb-item"
        style={{
          background: 'none',
          border: '1px solid transparent',
          color: '#fff',
          cursor: 'pointer',
          position: 'relative',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}
        title="Notifications"
        aria-label="Notifications"
      >
        <span style={{ fontSize: 18 }}>🔔</span>
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              background: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              minWidth: 18,
              height: 18,
              fontSize: 11,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              boxShadow: '0 0 4px rgba(0,0,0,0.5)'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '100%',
            width: 320,
            maxHeight: 420,
            background: '#fff',
            color: '#111',
            borderRadius: 10,
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            zIndex: 300,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #e5e7eb'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f9fafb'
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔔 Notifications</span>
              {unreadCount > 0 && (
                <span style={{ fontSize: 12, background: '#fee2e2', color: '#b91c1c', padding: '2px 8px', borderRadius: 12 }}>
                  {unreadCount} nouvelle(s)
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#0369a1',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '30px 16px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                <span style={{ fontSize: 30, display: 'block', marginBottom: 8 }}>📭</span>
                Aucune notification pour le moment
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleMarkAsRead(n)}
                  style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f3f4f6',
                    cursor: 'pointer',
                    background: n.lu ? '#fff' : '#eff6ff',
                    transition: 'background 0.2s',
                    display: 'flex',
                    gap: 12,
                    alignItems: 'start'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = n.lu ? '#f9fafb' : '#e0e7ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = n.lu ? '#fff' : '#eff6ff')}
                >
                  <span style={{ fontSize: 20, flexShrink: 0, marginTop: 2 }}>
                    {n.type === 'commande' ? '📦' : n.type === 'remboursement' ? '💰' : '🔔'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong style={{ fontSize: 13, color: '#111827' }}>{n.titre}</strong>
                      {!n.lu && (
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#2563eb' }} />
                      )}
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4b5563', lineHeight: 1.3 }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, display: 'block' }}>
                      {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
