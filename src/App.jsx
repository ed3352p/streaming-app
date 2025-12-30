import React, { Suspense, lazy, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PasswordChangeGuard from "./components/PasswordChangeGuard";
import NavbarComponent from "./components/NavbarComponent";
import Footer from "./components/Footer";
import { PopunderAd } from "./components/PopunderAd";
import { SocialBar } from "./components/SocialBar";
import AdBlockVerifier from "./components/AdBlockVerifier";
import MobileOptimizer from "./components/MobileOptimizer";
import "./styles/main.css";

// Lazy loading des pages
const Home = lazy(() => import("./pages/Home"));
const Films = lazy(() => import("./pages/Films"));
const Series = lazy(() => import("./pages/Series"));
const Movie = lazy(() => import("./pages/Movie"));
const Player = lazy(() => import("./pages/Player"));
const Iptv = lazy(() => import("./pages/Iptv"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const Subscribe = lazy(() => import("./pages/Subscribe"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AddMovie = lazy(() => import("./pages/admin/AddMovie"));
const EditMovie = lazy(() => import("./pages/admin/EditMovie"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const ManageIPTV = lazy(() => import("./pages/admin/ManageIPTV"));
const AddSeries = lazy(() => import("./pages/admin/AddSeries"));
const ManageSeries = lazy(() => import("./pages/admin/ManageSeries"));
const EditSeries = lazy(() => import("./pages/admin/EditSeries"));
const ManageAds = lazy(() => import("./pages/admin/ManageAds"));
const Analytics = lazy(() => import("./pages/admin/Analytics"));
const UploadVideo = lazy(() => import("./pages/admin/UploadVideo"));
const Search = lazy(() => import("./pages/Search"));
const Watchlist = lazy(() => import("./pages/Watchlist"));
const Payment = lazy(() => import("./pages/Payment"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const AccessCodes = lazy(() => import("./pages/admin/AccessCodes"));
const RedeemCode = lazy(() => import("./pages/RedeemCode"));
const BulkScraper = lazy(() => import("./pages/admin/BulkScraper"));
const ManageMovies = lazy(() => import("./pages/admin/ManageMovies"));

// Loading fallback
function LoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#cbd5e1' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            border: '4px solid rgba(239, 68, 68, 0.2)',
            borderTopColor: '#ef4444',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
        <p>Chargement...</p>
        <style>
          {`@keyframes spin { to { transform: rotate(360deg); } }`}
        </style>
      </div>
    </div>
  );
}

export default function App() {
  const [adBlockVerified, setAdBlockVerified] = useState(false);

  return (
    <AuthProvider>
      <BrowserRouter>
        <PasswordChangeGuard>
          <MobileOptimizer />
          <AdBlockVerifier 
            onVerified={() => setAdBlockVerified(true)}
            onBlocked={() => setAdBlockVerified(false)}
          />
          <PopunderAd />
          <SocialBar />
          <NavbarComponent />
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/films" element={<Films />} />
              <Route path="/series" element={<Series />} />
              <Route path="/movie/:id" element={<Movie />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/subscribe" element={<Subscribe />} />
              <Route path="/search" element={<Search />} />
              <Route path="/watchlist" element={<Watchlist />} />
              <Route path="/payment/:paymentId" element={<Payment />} />
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/redeem-code" element={<ProtectedRoute><RedeemCode /></ProtectedRoute>} />

              {/* Player route */}
              <Route path="/player/:id" element={<Player />} />
              <Route path="/iptv" element={<Iptv />} />

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
              <Route path="/admin/add" element={<ProtectedRoute requireAdmin><AddMovie /></ProtectedRoute>} />
              <Route path="/admin/edit/:id" element={<ProtectedRoute requireAdmin><EditMovie /></ProtectedRoute>} />
              <Route path="/admin/users" element={<ProtectedRoute requireAdmin><ManageUsers /></ProtectedRoute>} />
              <Route path="/admin/iptv" element={<ProtectedRoute requireAdmin><ManageIPTV /></ProtectedRoute>} />
              <Route path="/admin/series" element={<ProtectedRoute requireAdmin><ManageSeries /></ProtectedRoute>} />
              <Route path="/admin/series/add" element={<ProtectedRoute requireAdmin><AddSeries /></ProtectedRoute>} />
              <Route path="/admin/series/edit/:id" element={<ProtectedRoute requireAdmin><EditSeries /></ProtectedRoute>} />
              <Route path="/admin/ads" element={<ProtectedRoute requireAdmin><ManageAds /></ProtectedRoute>} />
              <Route path="/admin/analytics" element={<ProtectedRoute requireAdmin><Analytics /></ProtectedRoute>} />
              <Route path="/admin/upload" element={<ProtectedRoute requireAdmin><UploadVideo /></ProtectedRoute>} />
              <Route path="/admin/access-codes" element={<ProtectedRoute requireAdmin><AccessCodes /></ProtectedRoute>} />
              <Route path="/admin/bulk-scraper" element={<ProtectedRoute requireAdmin><BulkScraper /></ProtectedRoute>} />
              <Route path="/admin/movies" element={<ProtectedRoute requireAdmin><ManageMovies /></ProtectedRoute>} />
              <Route path="/admin/edit-movie/:id" element={<ProtectedRoute requireAdmin><EditMovie /></ProtectedRoute>} />
            </Routes>
          </Suspense>
          <Footer />
        </PasswordChangeGuard>
      </BrowserRouter>
    </AuthProvider>
  );
}
