import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', motDePasse: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb',
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: '#111', marginBottom: 16
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.data);

      let redirectPath = '/';
      if (location.state?.from) {
        redirectPath = location.state.from;
      } else if (data.data.role === 'admin') {
        redirectPath = '/admin';
      } else if (data.data.role === 'vendeur') {
        redirectPath = '/seller';
      }
      navigate(redirectPath);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 110px)', background: '#f9fafb',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        padding: '40px', width: '100%', maxWidth: 450, border: '1px solid #f3f4f6'
      }}>
        <h2 style={{ textAlign: 'center', color: '#0F172A', marginBottom: 30, fontSize: 26, fontWeight: 800 }}>
          Connexion
        </h2>

        {/* Message envoyé par le bouton "Commander" ou le panier */}
        {location.state?.message && !error && (
          <p style={{
            color: '#0369a1', background: '#e0f2fe', padding: 10, borderRadius: 8,
            textAlign: 'center', marginBottom: 20, fontSize: 14
          }}>
            {location.state.message}
          </p>
        )}

        {error && (
          <p style={{
            color: '#dc2626', background: '#fef2f2', padding: 10, borderRadius: 8,
            textAlign: 'center', marginBottom: 20, fontSize: 14
          }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            required
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.motDePasse}
            onChange={e => setForm({ ...form, motDePasse: e.target.value })}
            required
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '16px', background: loading ? '#64748b' : '#0F172A', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', marginTop: 10
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        {/* Boutons de remplissage rapide pour test */}
        <div style={{
          marginTop: 24,
          padding: '12px 14px',
          background: '#f8fafc',
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          fontSize: 13
        }}>
          <div style={{ color: '#64748b', fontWeight: 600, marginBottom: 8 }}>
            Comptes de test rapides :
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setForm({ email: 'client@shoply.tn', motDePasse: 'Client123456!' })}
              style={{
                padding: '6px 10px', background: '#e0f2fe', color: '#0369a1',
                border: '1px solid #bae6fd', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}
            >
              👤 Client
            </button>
            <button
              type="button"
              onClick={() => setForm({ email: 'vendeur@shoply.tn', motDePasse: 'Vendeur123456!' })}
              style={{
                padding: '6px 10px', background: '#fef3c7', color: '#92400e',
                border: '1px solid #fde68a', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}
            >
              🏪 Vendeur
            </button>
            <button
              type="button"
              onClick={() => setForm({ email: 'admin@shoply.tn', motDePasse: 'Admin123456!' })}
              style={{
                padding: '6px 10px', background: '#fee2e2', color: '#991b1b',
                border: '1px solid #fecaca', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}
            >
              👑 Admin
            </button>
          </div>
        </div>

        <p style={{ textAlign: 'center', marginTop: 25, color: '#6b7280', fontSize: 14 }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: '#E11D48', fontWeight: 600, textDecoration: 'none' }}>
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}