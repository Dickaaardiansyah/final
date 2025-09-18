import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminAuthProvider } from "../components/admin/auth/AdminAuthContext";
import ProtectedAdminRoute from "../components/admin/auth/ProtectedAdminRoute";

import Layout from "../components/layout/Layout";
import NotFound from "../components/NotFound";

// Pages
import Home from "../pages/Home";
import Toko from "../pages/Toko";
import Register from "../pages/Register";
import Login from "../pages/Login";
import Scan from "../pages/Scan";
import Profile from "../pages/Profile";
import History from "../pages/History";
import Marketplace from "../pages/Marketplace";
import AddKatalogPage from "../pages/AddKatalogPage";

// Admin Pages
import Dashboard from "../pages/admin/Dashboard";
import AdminLogin from "../pages/admin/Login";
import PendingVerification from "../pages/admin/PendingVerification";
import Approved from "../pages/admin/Approved";
import Rejected from "../pages/admin/Rejected";
import FishSellers from "../pages/admin/FishSellers";
import Reports from "../pages/admin/Reports";
import Settings from "../pages/admin/Settings";

export function AppRoutes() {
  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true
      }}
    >
      <AdminAuthProvider>
        <Routes>
          {/* Semua halaman utama dibungkus Layout */}
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/toko" element={<Toko />} />
            <Route path="/scan" element={<Scan />} />
          </Route>

          {/* Halaman tanpa layout */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/history" element={<History/>} />
          <Route path="/marketplace" element={<Marketplace/>} />
          <Route path="/katalog/tambah" element={<AddKatalogPage />} />
          
          {/* Route untuk direct catalog registration */}
          <Route 
            path="/katalog/daftar" 
            element={
              <Marketplace catalogRegistrationMode={true} />
            } 
          />
          
          {/* Admin Routes - Protected */}
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* Main Dashboard */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedAdminRoute>
                <Dashboard />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* Verification Management Routes */}
          <Route 
            path="/admin/pending-verification" 
            element={
              <ProtectedAdminRoute>
                <PendingVerification />
              </ProtectedAdminRoute>
            } 
          />

          <Route 
            path="/admin/approved" 
            element={
              <ProtectedAdminRoute>
                <Approved />
              </ProtectedAdminRoute>
            } 
          />

          <Route 
            path="/admin/rejected" 
            element={
              <ProtectedAdminRoute>
                <Rejected />
              </ProtectedAdminRoute>
            } 
          />

          {/* Fish Sellers Management */}
          <Route 
            path="/admin/fish-sellers" 
            element={
              <ProtectedAdminRoute>
                <FishSellers />
              </ProtectedAdminRoute>
            } 
          />

          {/* Reports */}
          <Route 
            path="/admin/reports" 
            element={
              <ProtectedAdminRoute>
                <Reports />
              </ProtectedAdminRoute>
            } 
          />

          {/* Settings */}
          <Route 
            path="/admin/settings" 
            element={
              <ProtectedAdminRoute>
                <Settings />
              </ProtectedAdminRoute>
            } 
          />
          
          {/* Admin routes dengan role-based access (jika diperlukan nanti) */}
          <Route 
            path="/admin/seller-requests" 
            element={
              <ProtectedAdminRoute requiredRole="seller_verifier">
                <PendingVerification />
              </ProtectedAdminRoute>
            } 
          />

          <Route 
            path="/admin/manage-admins" 
            element={
              <ProtectedAdminRoute requiredRole="super_admin">
                <Settings />
              </ProtectedAdminRoute>
            } 
          />

          {/* 404 page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AdminAuthProvider>
    </BrowserRouter>
  );
}