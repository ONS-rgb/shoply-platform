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
  const sellerName = product.boutique ? `${product.boutique.prenom || ''} ${product.boutique.nom || ''}`.trim() : '';

  return (
    <article className="prod-card">
      {/* ===== BOUTONS EN HAUT DE LA CARTE ===== */}
      <div className="prod-actions">
        <button className="prod-btn" disabled={outOfStock} onClick={() => onOrder(product)}>
          Commander
        </button>
        <button className="prod-btn cart" disabled={outOfStock} onClick={() => onAdd(product, selectedColor)}>
          🛒 Ajouter au panier
        </button>
      </div>

      <Link to={detailUrl} className="prod-img">
        <img
          src={currentImage}
          alt={product.nom}
          loading="lazy"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = PLACEHOLDER; }}
        />
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="prod-cat">{product.categorie}</span>
        {product.noteMoyenne > 0 && (
          <StarRating rating={product.noteMoyenne} count={product.nbAvis} size={14} />
        )}
      </div>

      <Link to={detailUrl} className="plain">
        <h3 className="prod-name" title={product.nom}>{product.nom}</h3>
      </Link>

      {/* Pastilles de couleurs avec basculement d'image */}
      {product.couleurs?.length > 0 && (
        <div className="swatches" style={{ alignItems: 'center' }}>
          {product.couleurs.slice(0, 6).map((c) => {
            const isSelected = selectedColor.trim().toLowerCase() === c.trim().toLowerCase();
            return (
              <span
                key={c}
                className="swatch"
                title={`Couleur: ${c} (cliquer pour voir)`}
                style={{
                  background: colorToCss(c) || '#e5e7eb',
                  cursor: 'pointer',
                  transform: isSelected ? 'scale(1.3)' : 'scale(1)',
                  boxShadow: isSelected ? '0 0 0 2px #F97316' : 'none',
                  transition: 'transform 0.15s, box-shadow 0.15s'
                }}
                onClick={(e) => handleColorSelect(e, c)}
                onMouseEnter={(e) => handleColorSelect(e, c)}
              />
            );
          })}
          {selectedColor && (
            <span style={{ fontSize: 11, color: '#F97316', fontWeight: 600, marginLeft: 4 }}>
              {selectedColor}
            </span>
          )}
        </div>
      )}

      {sellerName && (
        <p className="prod-seller">
          Vendu par <Link to={`/stores/${sellerId}`} style={{ color: '#0369a1', textDecoration: 'none', fontWeight: 600 }}>{sellerName}</Link>
        </p>
      )}

      <div className="prod-price">{Number(product.prix).toFixed(2)} <small>TND</small></div>

      {outOfStock ? (
        <p className="prod-stock out">Rupture de stock</p>
      ) : product.stock < 10 ? (
        <p className="prod-stock low">Plus que {product.stock} en stock</p>
      ) : (
        <p className="prod-stock ok">En stock</p>
      )}
    </article>
  );
}