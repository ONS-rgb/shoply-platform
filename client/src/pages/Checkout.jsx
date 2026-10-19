import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { PLACEHOLDER } from '../components/ProductCard';
import '../styles/shop.css';

export default function Checkout() {
  const { cart, refresh: refreshCart } = useCart();
  const navigate = useNavigate();

  // Adresses enregistrées
  const [adresses, setAdresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState('');
  const [useNewAddress, setUseNewAddress] = useState(false);

  // Formulaire nouvelle adresse
  const [newAddr, setNewAddr] = useState({
    nomComplet: '', telephone: '', rue: '', ville: '',
    codePostal: '', pays: 'Tunisie', instructions: '',
    enregistrerAdresse: true, estDefaut: false
  });

  // Options de livraison et paiement
  const [shippingMethod, setShippingMethod] = useState('standard');
  const [paymentMethod, setPaymentMethod] = useState('livraison');
  const [cardInfo, setCardInfo] = useState({ numero: '', nom: '', date: '', cvv: '' });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Charger les adresses du client
  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => {
        const u = data.data;
        const addrs = u.adresses || [];
        setAdresses(addrs);

        if (addrs.length > 0) {
          const defaultAddr = addrs.find((a) => a.estDefaut) || addrs[0];
          setSelectedAddrId(defaultAddr._id);
          setUseNewAddress(false);
        } else {
          setUseNewAddress(true);
          setNewAddr((prev) => ({
            ...prev,
            nomComplet: `${u.prenom || ''} ${u.nom || ''}`.trim(),
            telephone: u.telephone || '',
            rue: u.adresse?.rue || '',
            ville: u.adresse?.ville || '',
            codePostal: u.adresse?.codePostal || ''
          }));
        }
      })
      .catch(() => {});
  }, []);

  if (!cart.items || cart.items.length === 0) {
    return (
      <div className="page">
        <div className="box empty" style={{ maxWidth: 500, margin: '40px auto' }}>
          <span style={{ fontSize: 44, display: 'block', marginBottom: 10 }}>🛒</span>
          <h2>Votre panier est vide</h2>
          <p>Ajoutez des articles avant de passer commande.</p>
          <Link to="/" className="btn-orange" style={{ width: 'auto', display: 'inline-block', padding: '10px 24px', marginTop: 10 }}>
            Découvrir les produits
          </Link>
        </div>
      </div>
    );
  }

  // Calculs
  const sousTotal = cart.total;
  const isFreeShipping = sousTotal >= 150 && shippingMethod === 'standard';
  const fraisLivraison = isFreeShipping ? 0 : (shippingMethod === 'express' ? 12 : 7);
  const grandTotal = sousTotal + fraisLivraison;

  // Validation et soumission de la commande
  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setError('');

    // Déterminer l'adresse de destination
    let finalAddress = null;
    let shouldSave = false;

    if (useNewAddress) {
      if (!newAddr.nomComplet || !newAddr.telephone || !newAddr.rue || !newAddr.ville) {
        setError('Veuillez remplir tous les champs obligatoires de l\'adresse de livraison');
        return;
      }
      finalAddress = {
        nomComplet: newAddr.nomComplet,
        telephone: newAddr.telephone,
        rue: newAddr.rue,
        ville: newAddr.ville,
        codePostal: newAddr.codePostal,
        pays: newAddr.pays || 'Tunisie',
        instructions: newAddr.instructions
      };
      shouldSave = newAddr.enregistrerAdresse;
    } else {
      const selected = adresses.find((a) => a._id === selectedAddrId);
      if (!selected) {
        setError('Veuillez sélectionner une adresse de livraison');
        return;
      }
      finalAddress = {
        nomComplet: selected.nomComplet,
        telephone: selected.telephone,
        rue: selected.rue,
        ville: selected.ville,
        codePostal: selected.codePostal,
        pays: selected.pays,
        instructions: selected.instructions
      };
    }

    if (paymentMethod === 'carte') {
      if (!cardInfo.numero || !cardInfo.nom || !cardInfo.date || !cardInfo.cvv) {
        setError('Veuillez renseigner les informations de votre carte bancaire');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        adresseLivraison: finalAddress,
        modeLivraison: {
          nom: shippingMethod === 'express' ? 'Livraison Express' : (isFreeShipping ? 'Livraison Gratuite' : 'Livraison Standard'),
          delai: shippingMethod === 'express' ? '24-48h' : '2-4 jours ouvrables',
          prix: fraisLivraison
        },
        modePaiement: paymentMethod,
        enregistrerAdresse: shouldSave
      };

      const { data } = await api.post('/orders', payload);
      await refreshCart();

      // Rediriger vers la page de succès de commande
      navigate(`/order-success/${data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la validation de la commande');
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ background: '#EAEDED' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h1 style={{ margin: 0, fontSize: 26, color: '#0F172A' }}>
            🔒 Validation de votre commande (Amazon-style)
          </h1>
          <Link to="/cart" style={{ color: '#0369a1', fontSize: 14, fontWeight: 600 }}>
            ‹ Revenir au panier
          </Link>
        </div>

        {error && <div className="alert error">{error}</div>}

        <form onSubmit={handleSubmitOrder} style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* ===== ÉTAPE 1 : ADRESSE DE LIVRAISON (STYLE AMAZON) ===== */}
            <div className="box" style={{ borderTop: '4px solid #F97316' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ background: '#F97316', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>1</span>
                  Adresse où la commande doit arriver
                </h2>
                {adresses.length > 0 && (
                  <button
                    type="button"
                    className="link-btn"
                    onClick={() => setUseNewAddress(!useNewAddress)}
                    style={{ fontWeight: 600 }}
                  >
                    {useNewAddress ? '‹ Choisir parmi mes adresses enregistrées' : '+ Ajouter une autre adresse'}
                  </button>
                )}
              </div>

              {/* Sélection parmi les adresses enregistrées */}
              {!useNewAddress && adresses.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
                  {adresses.map((a) => {
                    const isSelected = selectedAddrId === a._id;
                    return (
                      <label
                        key={a._id}
                        style={{
                          border: isSelected ? '2px solid #F97316' : '1px solid #d1d5db',
                          background: isSelected ? '#fff7ed' : '#fff',
                          borderRadius: 8,
                          padding: 14,
                          cursor: 'pointer',
                          display: 'block',
                          position: 'relative',
                          transition: 'border-color 0.2s, background 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <input
                            type="radio"
                            name="delivery_address"
                            checked={isSelected}
                            onChange={() => setSelectedAddrId(a._id)}
                            style={{ accentColor: '#F97316', transform: 'scale(1.1)' }}
                          />
                          <strong style={{ fontSize: 15 }}>{a.nomComplet}</strong>
                        </div>

                        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#374151', lineHeight: 1.4, paddingLeft: 22 }}>
                          {a.rue}
                          <br />
                          {a.codePostal && `${a.codePostal} `}{a.ville}, {a.pays}
                          <br />
                          📞 {a.telephone}
                        </p>

                        {a.instructions && (
                          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#0369a1', paddingLeft: 22, fontStyle: 'italic' }}>
                            ℹ️ {a.instructions}
                          </p>
                        )}

                        {a.estDefaut && (
                          <span style={{ position: 'absolute', top: 8, right: 8, fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                            Par défaut
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}

              {/* Formulaire nouvelle adresse */}
              {(useNewAddress || adresses.length === 0) && (
                <div style={{ background: '#f9fafb', padding: 18, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                    Saisissez l'adresse de destination pour ce colis :
                  </p>

                  <div className="row2">
                    <div className="field">
                      <label>Nom et prénom du destinataire *</label>
                      <input
                        required
                        placeholder="Ex: Mohamed Ben Salah"
                        value={newAddr.nomComplet}
                        onChange={(e) => setNewAddr({ ...newAddr, nomComplet: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Numéro de téléphone portable *</label>
                      <input
                        required
                        type="tel"
                        placeholder="Ex: +216 20 123 456"
                        value={newAddr.telephone}
                        onChange={(e) => setNewAddr({ ...newAddr, telephone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Adresse exacte (rue, avenue, bâtiment, étage) *</label>
                    <input
                      required
                      placeholder="Ex: 24 Avenue Habib Bourguiba, Apt 3B"
                      value={newAddr.rue}
                      onChange={(e) => setNewAddr({ ...newAddr, rue: e.target.value })}
                    />
                  </div>

                  <div className="row2">
                    <div className="field">
                      <label>Ville *</label>
                      <input
                        required
                        placeholder="Ex: Tunis, Sousse, Sfax..."
                        value={newAddr.ville}
                        onChange={(e) => setNewAddr({ ...newAddr, ville: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Code postal</label>
                      <input
                        placeholder="Ex: 1001"
                        value={newAddr.codePostal}
                        onChange={(e) => setNewAddr({ ...newAddr, codePostal: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Instructions spécifiques de livraison (optionnel)</label>
                    <input
                      placeholder="Ex: Sonner à l'interphone Ben Salah, livrer après 14h"
                      value={newAddr.instructions}
                      onChange={(e) => setNewAddr({ ...newAddr, instructions: e.target.value })}
                    />
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                    <input
                      type="checkbox"
                      checked={newAddr.enregistrerAdresse}
                      onChange={(e) => setNewAddr({ ...newAddr, enregistrerAdresse: e.target.checked })}
                    />
                    <span>Enregistrer cette adresse dans mon carnet pour mes prochains achats</span>
                  </label>
                </div>
              )}
            </div>

            {/* ===== ÉTAPE 2 : MODE DE LIVRAISON ===== */}
            <div className="box" style={{ borderTop: '4px solid #F97316' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#F97316', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>2</span>
                Mode de livraison
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label
                  style={{
                    border: shippingMethod === 'standard' ? '2px solid #F97316' : '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: shippingMethod === 'standard' ? '#fff7ed' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="radio"
                      name="shipping_opt"
                      checked={shippingMethod === 'standard'}
                      onChange={() => setShippingMethod('standard')}
                      style={{ accentColor: '#F97316' }}
                    />
                    <div>
                      <strong>Livraison Standard à domicile</strong>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Livré en 2 à 4 jours ouvrables</div>
                    </div>
                  </div>
                  <strong style={{ color: isFreeShipping ? '#16a34a' : '#111' }}>
                    {isFreeShipping ? 'GRATUIT' : '7.00 TND'}
                  </strong>
                </label>

                <label
                  style={{
                    border: shippingMethod === 'express' ? '2px solid #F97316' : '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: shippingMethod === 'express' ? '#fff7ed' : '#fff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="radio"
                      name="shipping_opt"
                      checked={shippingMethod === 'express'}
                      onChange={() => setShippingMethod('express')}
                      style={{ accentColor: '#F97316' }}
                    />
                    <div>
                      <strong>⚡ Livraison Express Prioritaire</strong>
                      <div style={{ fontSize: 12, color: '#6b7280' }}>Livré en 24 à 48 heures ouvrables</div>
                    </div>
                  </div>
                  <strong>12.00 TND</strong>
                </label>
              </div>

              {sousTotal < 150 && (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#0369a1' }}>
                  💡 Plus que {(150 - sousTotal).toFixed(2)} TND d'achats pour profiter de la <strong>livraison standard gratuite</strong> !
                </p>
              )}
            </div>

            {/* ===== ÉTAPE 3 : MODE DE PAIEMENT ===== */}
            <div className="box" style={{ borderTop: '4px solid #F97316' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ background: '#F97316', color: '#fff', width: 26, height: 26, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>3</span>
                Moyen de paiement
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <label
                  style={{
                    border: paymentMethod === 'livraison' ? '2px solid #F97316' : '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: paymentMethod === 'livraison' ? '#fff7ed' : '#fff'
                  }}
                >
                  <input
                    type="radio"
                    name="pay_opt"
                    checked={paymentMethod === 'livraison'}
                    onChange={() => setPaymentMethod('livraison')}
                    style={{ accentColor: '#F97316' }}
                  />
                  <div>
                    <strong>💵 Paiement en espèces à la livraison</strong>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Réglez au livreur directement lors de la réception de votre colis</div>
                  </div>
                </label>

                <label
                  style={{
                    border: paymentMethod === 'carte' ? '2px solid #F97316' : '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: paymentMethod === 'carte' ? '#fff7ed' : '#fff'
                  }}
                >
                  <input
                    type="radio"
                    name="pay_opt"
                    checked={paymentMethod === 'carte'}
                    onChange={() => setPaymentMethod('carte')}
                    style={{ accentColor: '#F97316' }}
                  />
                  <div>
                    <strong>💳 Carte bancaire sécurisée</strong>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>Visa, Mastercard, CIB (Paiement 100% sécurisé)</div>
                  </div>
                </label>
              </div>

              {paymentMethod === 'carte' && (
                <div style={{ marginTop: 14, background: '#f9fafb', padding: 14, borderRadius: 8, border: '1px solid #e5e7eb' }}>
                  <div className="field">
                    <label>Numéro de carte</label>
                    <input
                      placeholder="XXXX XXXX XXXX XXXX"
                      maxLength={19}
                      value={cardInfo.numero}
                      onChange={(e) => setCardInfo({ ...cardInfo, numero: e.target.value })}
                    />
                  </div>
                  <div className="field">
                    <label>Nom sur la carte</label>
                    <input
                      placeholder="Nom complet"
                      value={cardInfo.nom}
                      onChange={(e) => setCardInfo({ ...cardInfo, nom: e.target.value })}
                    />
                  </div>
                  <div className="row2">
                    <div className="field">
                      <label>Expiration (MM/AA)</label>
                      <input
                        placeholder="MM/AA"
                        maxLength={5}
                        value={cardInfo.date}
                        onChange={(e) => setCardInfo({ ...cardInfo, date: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>CVV (3 chiffres)</label>
                      <input
                        placeholder="123"
                        maxLength={4}
                        value={cardInfo.cvv}
                        onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ===== LISTE DES ARTICLES DE LA COMMANDE ===== */}
            <div className="box">
              <h3 style={{ margin: '0 0 12px', fontSize: 17 }}>Articles dans votre commande ({cart.nbArticles})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {cart.items.map(({ _id, produit, couleur, quantite, sousTotal }) => {
                  let img = produit.images?.[0] || PLACEHOLDER;
                  if (couleur && produit.variantesCouleurs?.length > 0) {
                    const v = produit.variantesCouleurs.find(
                      (varItem) => varItem.couleur?.trim().toLowerCase() === couleur.trim().toLowerCase()
                    );
                    if (v?.image) img = v.image;
                  }

                  return (
                    <div key={_id} style={{ display: 'flex', gap: 12, alignItems: 'center', borderBottom: '1px solid #f3f4f6', paddingBottom: 10 }}>
                      <img src={img} alt="" style={{ width: 55, height: 55, objectFit: 'contain', borderRadius: 6, background: '#f9fafb' }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>{produit.nom}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>
                          Quantité : {quantite} {couleur && `· Couleur : ${couleur}`}
                        </div>
                      </div>
                      <strong style={{ fontSize: 14 }}>{Number(sousTotal).toFixed(2)} TND</strong>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* ===== PANNEAU RÉCAPITULATIF (RÉSUMÉ FINAL) ===== */}
          <aside className="box summary" style={{ position: 'sticky', top: 120 }}>
            <h2 style={{ fontSize: 19, margin: '0 0 14px' }}>Récapitulatif de la commande</h2>

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: 14 }}>
              <span>Sous-total ({cart.nbArticles} articles)</span>
              <strong>{sousTotal.toFixed(2)} TND</strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', fontSize: 14 }}>
              <span>Frais de livraison</span>
              <strong style={{ color: isFreeShipping ? '#16a34a' : '#111' }}>
                {isFreeShipping ? 'Gratuit' : `${fraisLivraison.toFixed(2)} TND`}
              </strong>
            </div>

            <div style={{ borderTop: '2px solid #e5e7eb', margin: '14px 0', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>Total à payer</span>
              <span style={{ fontSize: 24, fontWeight: 800, color: '#c2410c' }}>
                {grandTotal.toFixed(2)} TND
              </span>
            </div>

            <button
              type="submit"
              className="btn-orange"
              disabled={loading}
              style={{ padding: 14, fontSize: 16, marginTop: 10 }}
            >
              {loading ? 'Validation en cours...' : 'Confirmer et commander'}
            </button>

            <p style={{ fontSize: 11, color: '#6b7280', textAlign: 'center', marginTop: 12, lineHeight: 1.4 }}>
              En confirmant votre commande, vous acceptez les conditions de vente de Shoply.
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
