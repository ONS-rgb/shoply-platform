import api from './api';

export const getProducts = async () => {
  const { data } = await api.get('/products');
  return data.data;
};

export const createProduct = async (productData) => {
  const { data } = await api.post('/products', productData);
  return data.data;
};