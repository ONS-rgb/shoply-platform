import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { PLACEHOLDER } from '../components/ProductCard';
import { colorToCss } from '../constants/colors';
import '../styles/shop.css';

export default function Cart() {
  const { cart, loading, updateQty, removeItem, clearCart } = useCart();
  const [msg, setMsg] = useState({ type: '', text: '' });
  const navigate = useNavigate();

  const run = async (action) => {
    setMsg({ type: '', text: '' });
    try {
      await action();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Une erreur est survenue' });
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="page">
      <div className="cart-layout">
        <div className="box">
          <h1>Mon panier</h1>
          {msg.text && <div className={`alert ${msg.type}`}>{msg.text}</div>}

          {loading ? (
            <p className="muted">Chargement...</p>
          ) : cart.items.length === 0 ? (
            <div className="empty">
              <p>Votre panier est vide.</p>
              <Link to="/">Découvrir les produits</Link>
            </div>
          ) : (
            <>
              <div style={{ textAlign: 'right', marginBottom: 8 }}>
                <button className="link-btn" onClick={() => run(clearCart)}>Vider le panier</button>
              </div>

              {cart.items.map(({ _id, produit, couleur, quantite, sousTotal }) => {
                // Trouver l'image correspondant à la couleur si disponible
                let itemImage = produit.images?.[0] || PLACEHOLDER;
                if (couleur && produit.variantesCouleurs?.length > 0) {
                  const v = produit.variantesCouleurs.find(
                    (varItem) => varItem.couleur?.trim().toLowerCase() === couleur.trim().toLowerCase()
                  );
                  if (v?.image) itemImage = v.image;
                } else if (couleur && produit.couleurs?.length > 0 && produit.images?.length > 1) {
                  const idx = produit.couleurs.findIndex(
                    (c) => c.trim().toLowerCase() === couleur.trim().toLowerCase()
                  );
                  if (idx !== -1 && produit.images[idx]) itemImage = produit.images[idx];
                }

                return (
                  <div className="cart-item" key={_id}>
                    <img
                      src={itemImage}
                      alt={produit.nom}
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
                    />

                    <div className="info">
                      <h3>
                        <Link to={`/product/${produit._id}`} className="plain">{produit.nom}</Link>
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '4px 0' }}>
                        <span className="muted">{produit.categorie}</span>
                        {couleur && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#374151' }}>
                            · Couleur :
                            <span
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                display: 'inline-block',
                                background: colorToCss(couleur) || '#cbd5e1',
                                border: '1px solid #9ca3af'
                              }}
                            />
                            <strong>{couleur}</strong>
                          </span>
                        )}
                      </div>
                      <div className="price">{Number(produit.prix).toFixed(2)} TND</div>

                    <div className="actions">
                      <div className="qty">
                        <button disabled={quantite <= 1}
                          onClick={() => run(() => updateQty(_id, quantite - 1))}>−</button>
                        <span>{quantite}</span>
                        <button disabled={quantite >= produit.stock}
                          onClick={() => run(() => updateQty(_id, quantite + 1))}>+</button>
                      </div>
                      <button className="link-btn" onClick={() => run(() => removeItem(_id))}>
                        Supprimer
                      </button>
                    </div>
                  </div>

                  <div className="subtotal">{sousTotal.toFixed(2)} TND</div>
                </div>
              );
            })}
            </>
          )}
        </div>

        {cart.items.length > 0 && (
          <aside className="box summary">
            <h2>Résumé</h2>
            <p className="muted">{cart.nbArticles} article(s)</p>
            <div className="total">{cart.total.toFixed(2)} TND</div>
            <button className="btn-orange" onClick={handleCheckout}>Passer la commande</button>
          </aside>
        )}
      </div>
    </div>
  );
}