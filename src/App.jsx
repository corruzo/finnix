import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isMockMode } from './services/firebase';
import { useAuthStore } from './store/useAuthStore';
import { useFinanceStore } from './store/useFinanceStore';

import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Dashboard from './pages/Dashboard';
import DynamicIsland from './components/DynamicIsland';
import './index.css';

// Layout transitions for routes
const pageVariants = {
  initial: { opacity: 0, x: -10 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: 10 }
};
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.3 };

// Route Guards
function PrivateRoute({ children }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div className="app-shell flex items-center justify-center"><div className="spinner" /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, isLoading } = useAuthStore();
  if (isLoading) return <div className="app-shell flex items-center justify-center"><div className="spinner" /></div>;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PublicRoute><motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full"><LandingPage /></motion.div></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full"><Login /></motion.div></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full"><SignUp /></motion.div></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition} className="w-full"><Dashboard /></motion.div></PrivateRoute>} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const { setUser, setLoading } = useAuthStore();
  const user = useAuthStore(s => s.user);
  const subscribeRates = useFinanceStore(s => s.subscribeRates);
  const subscribeUserData = useFinanceStore(s => s.subscribeUserData);
  const unsubRatesRef = useRef(null);
  const unsubUserRef = useRef(null);

  // Auth listener
  useEffect(() => {
    if (isMockMode) {
      const stored = localStorage.getItem('finnix_mock_user');
      if (stored) setUser(JSON.parse(stored));
      else setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);

  // Suscripción a tasas de cambio y datos de usuario — se activa al autenticarse
  useEffect(() => {
    if (!user) {
      // Limpiar suscripción al hacer logout
      if (unsubRatesRef.current) {
        unsubRatesRef.current();
        unsubRatesRef.current = null;
      }
      if (unsubUserRef.current) {
        unsubUserRef.current();
        unsubUserRef.current = null;
      }
      return;
    }
    unsubRatesRef.current = subscribeRates();
    unsubUserRef.current = subscribeUserData(user.uid);
    
    return () => {
      if (unsubRatesRef.current) {
        unsubRatesRef.current();
        unsubRatesRef.current = null;
      }
      if (unsubUserRef.current) {
        unsubUserRef.current();
        unsubUserRef.current = null;
      }
    };
  }, [user, subscribeRates, subscribeUserData]);

  return (
    <>
      <DynamicIsland />
      <BrowserRouter>
        <AnimatedRoutes />
      </BrowserRouter>
    </>
  );
}
