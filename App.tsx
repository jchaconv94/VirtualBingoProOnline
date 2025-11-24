import React, { useState, useEffect } from 'react';
import { SheetAPI } from './services/googleSheetService.ts';
import LoginRegister from './components/LoginRegister.tsx';
import PlayerDashboard from './components/PlayerDashboard.tsx';
import GameRoom from './components/GameRoom.tsx';
import ConnectionModal from './components/ConnectionModal.tsx';
import LandingPage from './components/LandingPage.tsx';
import { useAlert } from './contexts/AlertContext.tsx';
import { PlayerCardsProvider } from './contexts/PlayerCardsContext.tsx';

// Default configuration

const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbxTBicDYEjZEi_FX4EKaNQzlpKFQHJWd6ClBUwAYs79wGwtVap83SJl_Pz5Y11pVqAp/exec";
const SYNC_INTERVAL_KEY = 'bingo_sync_interval_v1';

const App: React.FC = () => {
  const { showAlert } = useAlert();

  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; fullName?: string; email?: string; userId?: string; phone?: string } | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'player'>('player');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // --- Config State ---
  const [sheetUrl, setSheetUrl] = useState<string>(DEFAULT_SHEET_URL);
  const [autoSync, setAutoSync] = useState<boolean>(true); // Managed by GameRoom/ConnectionModal mostly, but kept here for initial pass
  const [syncInterval, setSyncInterval] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SYNC_INTERVAL_KEY);
      if (saved) {
        const parsed = Number(JSON.parse(saved));
        return Number.isFinite(parsed) ? parsed : 2000;
      }
    }
    return 2000;
  });
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // --- Global Settings ---
  // These might be moved to GameRoom or fetched from backend, but for now kept for title consistency if needed before login
  const [bingoTitle, setBingoTitle] = useState<string>("VIRTUAL BINGO PRO");
  const [bingoSubtitle, setBingoSubtitle] = useState<string>("Aplicación web de bingo virtual");

  // --- Effects ---
  useEffect(() => {
    const savedSession = sessionStorage.getItem('bingo_session');
    const savedUser = sessionStorage.getItem('bingo_user_data');

    if (savedSession === 'true' && savedUser) {
      const user = JSON.parse(savedUser);
      setCurrentUser(user);
      setUserRole(user.role || 'player');
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(SYNC_INTERVAL_KEY, JSON.stringify(syncInterval));
    } catch (err) {
      console.warn('No se pudo guardar la frecuencia de sync', err);
    }
  }, [syncInterval]);

  // No persistence: the URL stays tied to the constant unless changed during the current session

  // --- Handlers ---
  const handleLogin = async (user: string, pass: string): Promise<boolean> => {
    if (!sheetUrl) {
      showAlert({ message: "Configura la URL de la Hoja de Cálculo primero.", type: 'warning' });
      return false;
    }

    setIsLoginLoading(true);
    try {
      const response = await SheetAPI.login(sheetUrl, user, pass);

      if (response.success && response.user) {
        const userData = {
          username: response.user.usuario,
          fullName: response.user.nombreCompleto,
          email: response.user.email,
          userId: response.user.idUser,
          role: response.user.rol,
          phone: response.user.telefono
        };

        setCurrentUser(userData);
        setUserRole(response.user.rol as 'admin' | 'player');
        setIsAuthenticated(true);
        setShowAuthModal(false);

        sessionStorage.setItem('bingo_session', 'true');
        sessionStorage.setItem('bingo_user_data', JSON.stringify(userData));

        showAlert({ title: 'Bienvenido', message: `Hola ${response.user.nombreCompleto}`, type: 'success' });
        return true;
      } else {
        showAlert({ title: 'Error', message: response.message || 'Credenciales inválidas', type: 'danger' });
        return false;
      }
    } catch (error) {
      console.error(error);
      showAlert({ title: 'Error', message: 'Error de conexión con el servidor', type: 'danger' });
      return false;
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleRegisterUser = async (data: any): Promise<{ success: boolean; message?: string; credentials?: { username: string; password: string; } }> => {
    if (!sheetUrl) {
      showAlert({ message: "Configura la URL de la Hoja de Cálculo primero.", type: 'warning' });
      return { success: false, message: "URL no configurada" };
    }

    setIsLoginLoading(true);
    try {
      const response = await SheetAPI.register(sheetUrl, data.fullName, data.email, data.phone);
      if (response.success) {
        // No mostrar alert aquí - el modal de credenciales ya indica el éxito
        return { success: true, credentials: response.credentials };
      } else {
        showAlert({ title: 'Error', message: response.message || 'Error al registrar usuario', type: 'danger' });
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error(error);
      showAlert({ title: 'Error', message: 'Error de conexión al registrar', type: 'danger' });
      return { success: false, message: String(error) };
    } finally {
      setIsLoginLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setShowAuthModal(false);
    sessionStorage.removeItem('bingo_session');
    sessionStorage.removeItem('bingo_user_data');
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const requireAuth = (mode: 'login' | 'register' = 'login') => {
    openAuthModal(mode);
  };

  // --- Render ---
  if (!isAuthenticated) {
    return (
      <>
        <LandingPage
          sheetUrl={sheetUrl}
          onLoginClick={() => openAuthModal('login')}
          onRegisterClick={() => openAuthModal('register')}
          onRequireAuth={() => requireAuth('login')}
          onOpenSettings={() => setShowConnectionModal(true)}
        />
        {showAuthModal && (
          <LoginRegister
            onLogin={async (user, pass) => {
              const success = await handleLogin(user, pass);
              if (success) {
                setShowAuthModal(false);
              }
              return success;
            }}
            onRegister={async (data) => {
              const result = await handleRegisterUser(data);
              // No cambiar a login aquí - dejar que el usuario vea las credenciales
              // El cambio a login se hace cuando el usuario hace clic en "IR AL LOGIN" en el modal de credenciales
              return result;
            }}
            isLoading={isLoginLoading}
            onOpenSettings={() => setShowConnectionModal(true)}
            variant="modal"
            initialMode={authMode}
            onClose={() => setShowAuthModal(false)}
          />
        )}
        {showConnectionModal && (
          <ConnectionModal
            currentUrl={sheetUrl}
            currentAutoSync={autoSync}
            currentInterval={syncInterval}
            onSave={(url, newAutoSync, newInterval) => {
              setSheetUrl(url);
              setAutoSync(newAutoSync);
              setSyncInterval(newInterval);
            }}
            onClose={() => setShowConnectionModal(false)}
            onSyncNow={() => { }}
          />
        )}
      </>
    );
  }

  const authenticatedView = userRole === 'player' && currentUser ? (
    <PlayerDashboard
      currentUser={{
        idUser: currentUser.userId || currentUser.username,
        nombreCompleto: currentUser.fullName || currentUser.username,
        email: currentUser.email || '',
        usuario: currentUser.username,
        telefono: currentUser.phone
      }}
      sheetUrl={sheetUrl}
      onLogout={handleLogout}
      bingoTitle={bingoTitle}
      bingoSubtitle={bingoSubtitle}
    />
  ) : (
    <GameRoom
      currentUser={currentUser}
      userRole="admin"
      sheetUrl={sheetUrl}
      onLogout={handleLogout}
      isMaster={true}
    />
  );

  return (
    <PlayerCardsProvider sheetUrl={sheetUrl} userId={currentUser?.userId}>
      {authenticatedView}
    </PlayerCardsProvider>
  );
};

export default App;
