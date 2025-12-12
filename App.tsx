import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  PieChart, 
  CreditCard, 
  User, 
  LogOut, 
  Menu, 
  X 
} from 'lucide-react';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import TicketsPage from './pages/TicketsPage';
import StockPage from './pages/StockPage';
import ConsumptionPage from './pages/ConsumptionPage';
import SubscriptionPage from './pages/SubscriptionPage';
import AccountPage from './pages/AccountPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center text-mint-600">Chargement...</div>;
  if (!user) return <Navigate to="/auth" />;
  return <>{children}</>;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Accueil', icon: LayoutDashboard },
    { path: '/tickets', label: 'Tickets', icon: Receipt },
    { path: '/stock', label: 'Stock', icon: Package },
    { path: '/consommation', label: 'Consommation', icon: PieChart },
    { path: '/abonnements', label: 'Abonnements', icon: CreditCard },
    { path: '/compte', label: 'Compte', icon: User },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans text-warmGray-800">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-warmGray-200 fixed h-full z-10">
        <div className="p-6">
          <h1 className="text-2xl font-display font-bold text-mint-600 tracking-tight">GIVD<span className="text-gray-400 text-sm font-normal">.app</span></h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive(item.path)
                  ? 'bg-aqua-50 text-aqua-600 font-medium shadow-sm'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={20} />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed w-full bg-white border-b border-gray-200 z-20 flex items-center justify-between p-4">
        <h1 className="text-xl font-display font-bold text-mint-600">GIVD</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-10 pt-20 px-4">
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-4 rounded-xl text-lg ${
                   isActive(item.path) ? 'bg-aqua-50 text-aqua-600' : 'text-gray-600'
                }`}
              >
                <item.icon size={24} />
                {item.label}
              </Link>
            ))}
             <button
            onClick={signOut}
            className="flex items-center gap-3 px-4 py-4 w-full text-left text-red-500 mt-8"
          >
            <LogOut size={24} />
            Déconnexion
          </button>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-6 pt-20 md:pt-6 overflow-y-auto">
        <div className="max-w-5xl mx-auto animate-fadeIn">
          {children}
        </div>
      </main>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/tickets" element={<TicketsPage />} />
                    <Route path="/stock" element={<StockPage />} />
                    <Route path="/consommation" element={<ConsumptionPage />} />
                    <Route path="/abonnements" element={<SubscriptionPage />} />
                    <Route path="/compte" element={<AccountPage />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;