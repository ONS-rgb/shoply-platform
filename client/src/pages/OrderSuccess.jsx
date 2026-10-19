import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import '../styles/shop.css';

export default function OrderSuccess() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(({ data }) => setOrder(data.data))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page"><p className="muted">Chargement de votre confirmation...</p></div>;

  return (
    <div className="page" style={{ background: '#EAEDED', padding: '40px 20px' }}>
      <div className="box" style={{ maxWidth: 650, margin: '0 auto', textAlign: 'center', padding: '40px 30px' }}>
        <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#dcfce7', color: '#16a34a', fontSize: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          ✓
        </div>

        <h1 style={{ fontSize: 26, margin: '0 0 8px', color: '#0F172A' }}>
          Merci pour votre commande !
        </h1>

        <p style={{ fontSize: 15, color: '#4b5563', margin: '0 0 20px' }}>
          Votre commande a bien été enregistrée et transmise aux vendeurs.
        </p>

        {order && (
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: 20, textAlign: 'left', margin: '0 0 24px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
              <span className="muted">Numéro de commande :</span>
              <strong style={{ color: '#F97316' }}>{order.numeroCommande}</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
              <span className="muted">Montant total :</span>
              <strong>{Number(order.total).toFixed(2)} TND</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #e5e7eb', paddingBottom: 10 }}>
              <span className="muted">Mode de paiement :</span>
              <span>{order.modePaiement === 'carte' ? '💳 Carte bancaire' : '💵 Espèces à la livraison'}</span>
            </div>

            <div style={{ marginTop: 12 }}>
              <strong style={{ display: 'block', fontSize: 14, marginBottom: 4 }}>
                📍 Adresse où la commande va arriver :
              </strong>
              <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: 1.4 }}>
                <strong>{order.adresseLivraison.nomComplet}</strong>
                <br />
                {order.adresseLivraison.rue}, {order.adresseLivraison.codePostal} {order.adresseLivraison.ville}
                <br />
                Téléphone de contact : {order.adresseLivraison.telephone}
              </p>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to={`/orders/${id}`} className="btn-orange" style={{ width: 'auto', padding: '12px 28px' }}>
            📦 Suivre ma commande
          </Link>
          <Link to="/" className="btn-outline" style={{ width: 'auto', marginTop: 0, padding: '12px 28px' }}>
            Continuer mes achats
          </Link>
        </div>
      </div>
    </div>
  );
}
