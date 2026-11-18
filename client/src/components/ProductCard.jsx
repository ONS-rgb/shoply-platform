import { useState } from 'react';
import { Link } from 'react-router-dom';
import { colorToCss } from '../constants/colors';
import StarRating from './StarRating';

export const PLACEHOLDER =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>
       <rect width='100%' height='100%' fill='#f3f4f6'/>
       <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
             fill='#9ca3af' font-family='Arial' font-size='18'>Pas d'image</text>
     </svg>`
  );

export default function ProductCard({ product, onOrder, onAdd }) {
  const [selectedColor, setSelectedColor] = useState('');
  const outOfStock = product.stock <= 0;
  const detailUrl = `/product/${product._id}${selectedColor ? `?couleur=${encodeURIComponent(selectedColor)}` : ''}`;

  // Image courante basée sur la couleur sélectionnée si applicable
  let currentImage = product.images?.[0] || PLACEHOLDER;
  if (selectedColor && product.variantesCouleurs?.length > 0) {
    const variant = product.variantesCouleurs.find(
      (v) => v.couleur.trim().toLowerCase() === selectedColor.trim().toLowerCase()
    );
    if (variant && variant.image) {
      currentImage = variant.image;
    }
  } else if (selectedColor && product.couleurs?.length > 0 && product.images?.length > 1) {
    const idx = product.couleurs.findIndex(
      (c) => c.trim().toLowerCase() === selectedColor.trim().toLowerCase()
    );
    if (idx !== -1 && product.images[idx]) {
      currentImage = product.images[idx];
    }
  }

  const handleColorSelect = (e, colorName) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedColor(colorName === selectedColor ? '' : colorName);
  };

  const sellerId = product.boutique?._id || product.boutique;
  const sellerName = product.shopName || (product.boutique ? `${product.boutique.prenom || ''} ${product.boutique.nom || ''}`.trim() : '');

  const hasPromo = Boolean(product.enPromotion || (product.promotion?.active && product.promotion?.pourcentage > 0));
  const promoPercent = product.promotion?.pourcentage || (product.enPromotion && product.prix && product.prixFinal ? Math.round((1 - product.prixFinal / product.prix) * 100) : 0);
  const promoPrice = product.prixFinal || product.promotion?.prixPromo || (hasPromo ? Math.round((product.prix * (1 - promoPercent / 100)) * 100) / 100 : product.prix);

  return (
    <article className="prod-card">
      {/* 1. Bouton « Commander » + 2. Bouton « Ajouter au panier » tout en haut */}
      <div className="prod-actions-top">
        <button
          type="button"
          className="prod-btn-commander"
          disabled={outOfStock}
          onClick={() => onOrder(product)}
        >
          Commander
        </button>
        <button
          type="button"
          className="prod-btn-panier"
          disabled={outOfStock}
          onClick={() => onAdd(product, selectedColor)}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          Ajouter au panier
        </button>
      </div>

      {/* 3. Image du produit : centrée sous les deux boutons (avec badge de promotion rouge) */}
      <Link to={detailUrl} className="prod-img-wrap">
        {hasPromo && promoPercent > 0 && (
          <span className="prod-promo-badge">
            -{promoPercent}%
          </span>
        )}
        <img
          src={currentImage}
          alt={product.nom}
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
        />
      </Link>

      {/* 4. Nom de la catégorie : en majuscules, petite taille, gris clair */}
      <div className="prod-category-line">
        <span className="prod-cat-text">{product.categorie}</span>
        {product.noteMoyenne > 0 && (
          <StarRating rating={product.noteMoyenne} count={product.nbAvis} size={13} />
        )}
      </div>

      {/* 5. Titre du produit : en noir, gras */}
      <Link to={detailUrl} className="plain">
        <h3 className="prod-title-text" title={product.nom}>{product.nom}</h3>
      </Link>

      {/* 6. Pastilles de couleurs disponibles */}
      {product.couleurs?.length > 0 ? (
        <div className="prod-swatches-wrap">
          {product.couleurs.slice(0, 6).map((c) => {
            const isSelected = selectedColor.trim().toLowerCase() === c.trim().toLowerCase();
            return (
              <span
                key={c}
                className={`prod-swatch-circle ${isSelected ? 'active' : ''}`}
                title={`Couleur: ${c}`}
                style={{ background: colorToCss(c) || '#333' }}
                onClick={(e) => handleColorSelect(e, c)}
              />
            );
          })}
          {selectedColor && (
            <span className="prod-swatch-name">
              {selectedColor}
            </span>
          )}
        </div>
      ) : (
        <div style={{ height: 18, margin: '2px 0 6px' }} />
      )}

      {/* 7. Mention du vendeur / boutique */}
      {sellerName && (
        <p className="prod-seller-line">
          Vendu par <Link to={`/stores/${sellerId}`} className="prod-seller-link">{sellerName}</Link>
        </p>
      )}

      {/* 8. Prix : en gras, grande taille (en rouge s'il y a promotion) */}
      <div className="prod-price-line">
        {hasPromo ? (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <span className="prod-price-val promo">{Number(promoPrice).toFixed(2)} <span className="currency">TND</span></span>
            <span className="prod-old-price">{Number(product.prix).toFixed(2)} TND</span>
          </div>
        ) : (
          <span className="prod-price-val">{Number(product.prix).toFixed(2)} <span className="currency">TND</span></span>
        )}
      </div>

      {/* 9. Statut de stock : texte vert « En stock » */}
      <div className="prod-stock-line">
        {outOfStock ? (
          <span className="prod-stock-out">Rupture de stock</span>
        ) : product.stock < 10 ? (
          <span className="prod-stock-low">Plus que {product.stock} en stock</span>
        ) : (
          <span className="prod-stock-ok">En stock</span>
        )}
      </div>
    </article>
  );
}
