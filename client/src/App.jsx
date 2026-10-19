import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import AddProduct from './pages/AddProduct';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import ProductDetail from './pages/ProductDetail';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Stores from './pages/Stores';
import StoreDetail from './pages/StoreDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/stores/:id" element={<StoreDetail />} />

        {/* Tout utilisateur connecté */}
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />

        {/* Clients uniquement */}
        <Route path="/cart" element={
          <ProtectedRoute roles={['client']}><Cart /></ProtectedRoute>
        } />
        <Route path="/checkout" element={
          <ProtectedRoute roles={['client']}><Checkout /></ProtectedRoute>
        } />
        <Route path="/order-success/:id" element={
          <ProtectedRoute roles={['client']}><OrderSuccess /></ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute roles={['client']}><Orders /></ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute roles={['client']}><OrderDetail /></ProtectedRoute>
        } />

        {/* Vendeurs uniquement */}
        <Route path="/add-product" element={
          <ProtectedRoute roles={['vendeur']}><AddProduct /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}