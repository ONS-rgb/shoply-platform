import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages Publiques & Utilisateurs
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
import SellerDashboard from './pages/SellerDashboard';
import ClientDashboard from './pages/ClientDashboard';
import MyReviews from './pages/MyReviews';
import MyRefunds from './pages/MyRefunds';
import NotificationsPage from './pages/NotificationsPage';

// Pages Administrateur
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminClients from './pages/admin/AdminClients';
import AdminVendors from './pages/admin/AdminVendors';
import AdminShops from './pages/admin/AdminShops';
import AdminProducts from './pages/admin/AdminProducts';
import AdminCategories from './pages/admin/AdminCategories';
import AdminPayments from './pages/admin/AdminPayments';
import AdminCommissions from './pages/admin/AdminCommissions';
import AdminReclamations from './pages/admin/AdminReclamations';
import AdminRefunds from './pages/admin/AdminRefunds';
import AdminStatistics from './pages/admin/AdminStatistics';

// Composant pour masquer la barre de navigation standard quand on est dans l'espace admin
function ConditionalNavbar() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  return <Navbar />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ConditionalNavbar />

      <Routes>
        {/* ================= ROUTES PUBLIQUES ================= */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/stores" element={<Stores />} />
        <Route path="/stores/:id" element={<StoreDetail />} />

        {/* ================= TOUT UTILISATEUR CONNECTÉ ================= */}
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute><NotificationsPage /></ProtectedRoute>
        } />

        {/* ================= CLIENTS UNIQUEMENT ================= */}
        <Route path="/dashboard" element={
          <ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>
        } />
        <Route path="/my-reviews" element={
          <ProtectedRoute roles={['client']}><MyReviews /></ProtectedRoute>
        } />
        <Route path="/my-refunds" element={
          <ProtectedRoute roles={['client']}><MyRefunds /></ProtectedRoute>
        } />
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

        {/* ================= VENDEURS UNIQUEMENT ================= */}
        <Route path="/seller" element={
          <ProtectedRoute roles={['vendeur']}><SellerDashboard /></ProtectedRoute>
        } />
        <Route path="/add-product" element={
          <ProtectedRoute roles={['vendeur']}><AddProduct /></ProtectedRoute>
        } />

        {/* ================= ADMINISTRATEURS UNIQUEMENT ================= */}
        <Route path="/admin" element={
          <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/clients" element={
          <ProtectedRoute roles={['admin']}><AdminClients /></ProtectedRoute>
        } />
        <Route path="/admin/vendors" element={
          <ProtectedRoute roles={['admin']}><AdminVendors /></ProtectedRoute>
        } />
        <Route path="/admin/shops" element={
          <ProtectedRoute roles={['admin']}><AdminShops /></ProtectedRoute>
        } />
        <Route path="/admin/products" element={
          <ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute>
        } />
        <Route path="/admin/categories" element={
          <ProtectedRoute roles={['admin']}><AdminCategories /></ProtectedRoute>
        } />
        <Route path="/admin/payments" element={
          <ProtectedRoute roles={['admin']}><AdminPayments /></ProtectedRoute>
        } />
        <Route path="/admin/commissions" element={
          <ProtectedRoute roles={['admin']}><AdminCommissions /></ProtectedRoute>
        } />
        <Route path="/admin/reclamations" element={
          <ProtectedRoute roles={['admin']}><AdminReclamations /></ProtectedRoute>
        } />
        <Route path="/admin/refunds" element={
          <ProtectedRoute roles={['admin']}><AdminRefunds /></ProtectedRoute>
        } />
        <Route path="/admin/statistics" element={
          <ProtectedRoute roles={['admin']}><AdminStatistics /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
