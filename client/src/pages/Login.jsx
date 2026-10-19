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

      // Retour à la page d'où vient l'utilisateur (ex: accueil après "Commander"),
      // sinon : vendeur -> ajout produit, client -> accueil
      navigate(location.state?.from || (data.data.role === 'vendeur' ? '/add-product' : '/'));
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