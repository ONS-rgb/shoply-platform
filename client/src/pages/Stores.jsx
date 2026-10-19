import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/shop.css';

export default function Stores() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/shops')
      .then(({ data }) => setShops(data.data || []))
      .catch(() => setShops([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page" style={{ background: '#EAEDED' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0F172A', margin: '0 0 8px' }}>
            🏪 Nos Boutiques et Vendeurs Partenaires
          </h1>
          <p style={{ color: '#4b5563', fontSize: 16 }}>
            Découvrez des créateurs et vendeurs indépendants de confiance sur Shoply.
          </p>
        </div>

        {loading ? (
          <div className="box"><p className="muted">Chargement des boutiques...</p></div>
        ) : shops.length === 0 ? (
          <div className="box empty">
            <span style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>🏪</span>
            <h3>Aucune boutique active pour le moment</h3>
            <Link to="/" style={{ color: '#0369a1', fontWeight: 600 }}>Retour à l'accueil</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {shops.map((shop) => (
              <div
                key={shop._id}
                className="box"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: 24,
                  borderRadius: 12,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  border: '1px solid #e5e7eb'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                  {shop.logo ? (
                    <img
                      src={shop.logo}
                      alt={shop.nom}
                      style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: '2px solid #F97316' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: '#fed7aa',
                        color: '#c2410c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 26,
                        fontWeight: 700
                      }}
                    >
                      🏪
                    </div>
                  )}

                  <div>
                    <h3 style={{ margin: 0, fontSize: 18 }}>{shop.nom}</h3>
                    <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
                      ✓ Vendeur vérifié
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: 14, color: '#4b5563', margin: '0 0 16px', flex: 1, lineHeight: 1.4 }}>
                  {shop.description || 'Boutique certifiée proposant une large sélection de produits de qualité.'}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f3f4f6', paddingTop: 14, marginTop: 'auto' }}>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    📦 <strong>{shop.nbProduits || 0}</strong> produit(s)
                  </span>
                  <Link
                    to={`/stores/${shop._id}`}
                    className="btn-orange"
                    style={{ width: 'auto', padding: '8px 18px', fontSize: 13 }}
                  >
                    Visiter la boutique ›
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
