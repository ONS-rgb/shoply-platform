import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationBell from '../NotificationBell';
import logo from '../../assets/logo.png';
import '../../styles/admin.css';
import {
  LayoutDashboard,
  Users,
  Store,
  Building2,
  Package,
  Tags,
  CreditCard,
  Percent,
  AlertCircle,
  RotateCcw,
  BarChart3,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import api from '../../services/api';

export default function AdminLayout({ children, title, subtitle }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [counts, setCounts] = useState({
    shopsWaiting: 0,
    reclamationsWaiting: 0,
    refundsWaiting: 0,
    paymentsWaiting: 0
  });

  useEffect(() => {
    // Charger les badges de notification administrative
    const fetchBadges = async () => {
      try {
        const [shopsRes, recRes, refRes, payRes] = await Promise.all([
          api.get('/admin/shops?statut=en_attente').catch(() => ({ data: { count: 0 } })),
          api.get('/admin/reclamations?statut=en_attente').catch(() => ({ data: { count: 0 } })),
          api.get('/admin/refunds?statut=en_attente').catch(() => ({ data: { count: 0 } })),
          api.get('/admin/payments?statut=en_attente').catch(() => ({ data: { count: 0 } }))
        ]);

        setCounts({
          shopsWaiting: shopsRes.data?.count || 0,
          reclamationsWaiting: recRes.data?.count || 0,
          refundsWaiting: refRes.data?.count || 0,
          paymentsWaiting: payRes.data?.count || 0
        });
      } catch (err) {
        // Silently continue
      }
    };
    fetchBadges();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/admin/clients', label: 'Gestion des clients', icon: Users },
    { to: '/admin/vendors', label: 'Gestion des vendeurs', icon: Store },
    {
      to: '/admin/shops',
      label: 'Gestion des boutiques',
      icon: Building2,
      badge: counts.shopsWaiting > 0 ? counts.shopsWaiting : null
    },
    { to: '/admin/products', label: 'Gestion des produits', icon: Package },
    { to: '/admin/categories', label: 'Gestion des catégories', icon: Tags },
    {
      to: '/admin/payments',
      label: 'Gestion des paiements',
      icon: CreditCard,
      badge: counts.paymentsWaiting > 0 ? counts.paymentsWaiting : null
    },
    { to: '/admin/commissions', label: 'Gestion des commissions', icon: Percent },
    {
      to: '/admin/reclamations',
      label: 'Gestion des réclamations',
      icon: AlertCircle,
      badge: counts.reclamationsWaiting > 0 ? counts.reclamationsWaiting : null
    },
    {
      to: '/admin/refunds',
      label: 'Gestion des remboursements',
      icon: RotateCcw,
      badge: counts.refundsWaiting > 0 ? counts.refundsWaiting : null
    },
    { to: '/admin/statistics', label: 'Statistiques globales', icon: BarChart3 },
  ];

  return (
    <div className="admin-layout">
      {/* Overlay pour mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.6)',
            zIndex: 55
          }}
        />
      )}

      {/* ================= SIDEBAR ================= */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-brand">
            <div className="admin-brand-icon">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="admin-brand-title">Shoply Admin</div>
              <div className="admin-brand-subtitle">Panneau d'administration</div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="admin-menu-toggle"
            style={{ color: '#94a3b8', border: 'none', background: 'transparent' }}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav">
          <div className="admin-nav-section-title">Navigation principale</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => `admin-nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon />
                <span>{item.label}</span>
                {item.badge ? (
                  <span className="admin-nav-badge">{item.badge}</span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          <Link
            to="/"
            target="_blank"
            rel="noreferrer"
            className="admin-nav-item"
            style={{ color: '#94a3b8', fontSize: 13 }}
          >
            <ExternalLink size={16} />
            <span>Voir la boutique</span>
          </Link>

          <button onClick={handleLogout} className="admin-nav-logout">
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* ================= MAIN CONTENT AREA ================= */}
      <div className="admin-main">
        {/* ================= HEADER ================= */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              onClick={() => setSidebarOpen(true)}
              className="admin-menu-toggle"
              aria-label="Menu"
            >
              <Menu size={20} />
            </button>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', marginRight: 10 }}>
              <img src={logo} alt="Shoply" style={{ height: 26, objectFit: 'contain' }} />
            </Link>
          </div>

          <div className="admin-header-right">
            {/* Notifications */}
            <NotificationBell />

            {/* Profil Administrateur */}
            <Link to="/profile" className="admin-user-pill" style={{ textDecoration: 'none' }}>
              <div className="admin-user-avatar">
                {user?.prenom ? user.prenom.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="admin-user-info">
                <span className="admin-user-name">
                  {user ? `${user.prenom} ${user.nom}` : 'Administrateur'}
                </span>
                <span className="admin-user-role">Rôle : ADMIN</span>
              </div>
            </Link>
          </div>
        </header>

        {/* Content Body */}
        <main className="admin-content">
          {(title || subtitle) && (
            <div className="admin-page-header">
              <div>
                {title && <h1>{title}</h1>}
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
