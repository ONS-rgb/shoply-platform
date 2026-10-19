import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const EMPTY = { items: [], total: 0, nbArticles: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'client') {
      setCart(EMPTY);
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/cart');
      setCart(data.data);
    } catch {
      setCart(EMPTY);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const addToCart = async (produitId, quantite = 1, couleur = '') => {
    const { data } = await api.post('/cart', { produitId, quantite, couleur });
    setCart(data.data);
  };

  // itemId = identifiant de la ligne du panier (produit + couleur)
  const updateQty = async (itemId, quantite) => {
    const { data } = await api.put(`/cart/${itemId}`, { quantite });
    setCart(data.data);
  };

  const removeItem = async (itemId) => {
    const { data } = await api.delete(`/cart/${itemId}`);
    setCart(data.data);
  };

  const clearCart = async () => {
    const { data } = await api.delete('/cart');
    setCart(data.data);
  };

  return (
    <CartContext.Provider value={{ cart, loading, refresh, addToCart, updateQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);