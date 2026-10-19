import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [form, setForm] = useState({ 
    nom: '', prenom: '', email: '', motDePasse: '', 
    role: 'client', telephone: '' 
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Styles cohérents avec le reste du site
  const inputStyle = {
    width: '100%', padding: '14px 16px', border: '1px solid #e5e7eb',
    borderRadius: 8, fontSize: 15, outline: 'none', boxSizing: 'border-box',
    background: '#fff', color: '#111', marginBottom: 16, transition: 'border-color 0.2s'
  };

  const labelStyle = {
    display: 'block', marginBottom: 6, fontWeight: 600, color: '#374151', fontSize: 14
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      alert('Compte créé avec succès ! Connectez-vous maintenant.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    }
  };

  return (
    <div style={{ 
      minHeight: 'calc(100vh - 85px)', background: '#f9fafb', 
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' 
    }}>
      <div style={{
        background: '#fff', borderRadius: 16, boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        padding: '40px', width: '100%', maxWidth: 500, border: '1px solid #f3f4f6'
      }}>
        <h2 style={{ textAlign: 'center', color: '#0F172A', marginBottom: 30, fontSize: 26, fontWeight: 800 }}>
          Créer un compte
        </h2>
        
        {error && (
          <div style={{ background: '#fef2f2', color: '#dc2626', padding: 12, borderRadius: 8, marginBottom: 20, textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 15 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Nom</label>
              <input placeholder="Votre nom" value={form.nom} onChange={e => setForm({...form, nom: e.target.value})} required style={{...inputStyle, marginBottom: 0}} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Prénom</label>
              <input placeholder="Votre prénom" value={form.prenom} onChange={e => setForm({...form, prenom: e.target.value})} required style={{...inputStyle, marginBottom: 0}} />
            </div>
          </div>
          <br />

          <label style={labelStyle}>Email</label>
          <input type="email" placeholder="exemple@email.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required style={inputStyle} />

          <label style={labelStyle}>Mot de passe</label>
          <input type="password" placeholder="••••••••" value={form.motDePasse} onChange={e => setForm({...form, motDePasse: e.target.value})} required style={inputStyle} />

          <label style={labelStyle}>Téléphone</label>
          <input type="tel" placeholder="+216 XX XXX XXX" value={form.telephone} onChange={e => setForm({...form, telephone: e.target.value})} style={inputStyle} />

          <label style={labelStyle}>Type de compte</label>
          <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} style={{...inputStyle, cursor: 'pointer'}}>
            <option value="client">Client</option>
            <option value="vendeur">Vendeur</option>
          </select>

          <button type="submit" style={{ 
            width: '100%', padding: '16px', background: '#F97316', color: '#fff',
            border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 10
          }}>
            S'inscrire
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 25, color: '#6b7280', fontSize: 14 }}>
          Déjà un compte ? <Link to="/login" style={{ color: '#E11D48', fontWeight: 600, textDecoration: 'none' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}