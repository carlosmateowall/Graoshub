import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import AppLayout from "@/components/layouts/AppLayout";
import RoleRedirect from "@/components/RoleRedirect";

// Public screens (keep eager for fast first paint)
import LandingPage from "@/components/screens/LandingPage";
import LoginScreen from "@/components/screens/LoginScreen";

import SignupScreen from "@/components/screens/SignupScreen";
import ProfileSelectScreen from "@/components/screens/ProfileSelectScreen";
import ResetPasswordScreen from "@/components/screens/ResetPasswordScreen";

// Lazy-loaded screens
const TermosScreen = lazy(() => import("@/components/screens/TermosScreen"));
const PrivacidadeScreen = lazy(() => import("@/components/screens/PrivacidadeScreen"));
const PublicarCarga = lazy(() => import("@/components/screens/PublicarCarga"));
const MotoristaFretes = lazy(() => import("@/components/screens/MotoristaFretes"));
const MotoristaFretesAtivos = lazy(() => import("@/components/screens/MotoristaFretesAtivos"));
const FreteDetalhe = lazy(() => import("@/components/screens/FreteDetalhe"));
const FreteTimeline = lazy(() => import("@/components/screens/FreteTimeline"));
const ChatScreen = lazy(() => import("@/components/screens/ChatScreen"));
const Marketplace = lazy(() => import("@/components/screens/Marketplace"));
const AnunciarScreen = lazy(() => import("@/components/screens/AnunciarScreen"));
const AnuncioDetalheScreen = lazy(() => import("@/components/screens/AnuncioDetalheScreen"));
const MapaArmazens = lazy(() => import("@/components/screens/MapaArmazens"));
const AdminPanel = lazy(() => import("@/components/screens/AdminPanel"));
const UserProfileScreen = lazy(() => import("@/components/screens/UserProfileScreen"));
const EditProfileScreen = lazy(() => import("@/components/screens/EditProfileScreen"));
const HistoricoFretesScreen = lazy(() => import("@/components/screens/HistoricoFretesScreen"));
const MeusAnunciosScreen = lazy(() => import("@/components/screens/MeusAnunciosScreen"));
const NotificacoesScreen = lazy(() => import("@/components/screens/NotificacoesScreen"));
const PlanosScreen = lazy(() => import("@/components/screens/PlanosScreen"));
const AnalyticsScreen = lazy(() => import("@/components/screens/AnalyticsScreen"));

import NotFound from "@/pages/NotFound";

const LazyFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-background">
    <div className="flex flex-col gap-3 w-full px-6">
      {[1, 2, 3].map(i => <div key={i} className="h-20 skeleton-shimmer" />)}
    </div>
  </div>
);

const AppRoutes = () => (
  <Suspense fallback={<LazyFallback />}>
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      
      <Route path="/login" element={<LoginScreen />} />
      <Route path="/cadastro" element={<SignupScreen />} />
      <Route path="/selecionar-perfil" element={<ProfileSelectScreen />} />
      <Route path="/reset-password" element={<ResetPasswordScreen />} />
      <Route path="/termos" element={<TermosScreen />} />
      <Route path="/privacidade" element={<PrivacidadeScreen />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/painel" element={<RoleRedirect />} />
          <Route path="/publicar" element={<PublicarCarga />} />
          <Route path="/fretes" element={<MotoristaFretes />} />
          <Route path="/fretes/ativos" element={<MotoristaFretesAtivos />} />
          <Route path="/fretes/:id" element={<FreteDetalhe />} />
          <Route path="/fretes/:id/status" element={<FreteTimeline />} />
          <Route path="/fretes/:id/chat" element={<ChatScreen />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/anunciar" element={<AnunciarScreen />} />
          <Route path="/marketplace/anuncio/:id" element={<AnuncioDetalheScreen />} />
          <Route path="/mapa" element={<MapaArmazens />} />
          <Route path="/perfil" element={<UserProfileScreen />} />
          <Route path="/perfil/editar" element={<EditProfileScreen />} />
          <Route path="/historico" element={<HistoricoFretesScreen />} />
          <Route path="/meus-anuncios" element={<MeusAnunciosScreen />} />
          <Route path="/notificacoes" element={<NotificacoesScreen />} />
          <Route path="/planos" element={<PlanosScreen />} />
          <Route path="/analytics" element={<AnalyticsScreen />} />

          {/* Admin-only route */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default AppRoutes;
