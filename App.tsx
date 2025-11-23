import React, { useState, useEffect } from 'react';
import { SheetAPI } from './services/googleSheetService.ts';
import LoginRegister from './components/LoginRegister.tsx';
import PlayerDashboard from './components/PlayerDashboard.tsx';
import GameRoom from './components/GameRoom.tsx';
import ConnectionModal from './components/ConnectionModal.tsx';
import { useAlert } from './contexts/AlertContext.tsx';

// Default configuration
const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbzBi8fC17hQt_xaGbuG-SeAFmaH1W_PpSYVRHP1fCeE3HfurFchw2yQPmUqqLEZWs65/exec";

const App: React.FC = () => {
  const { showAlert } = useAlert();

  // --- Auth State ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; fullName?: string; email?: string; userId?: string; phone?: string } | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'player'>('player');
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // --- Config State ---
  const [sheetUrl, setSheetUrl] = useState<string>(() => localStorage.getItem('bingo_sheet_url_v1') || DEFAULT_SHEET_URL);
  const [autoSync, setAutoSync] = useState<boolean>(true); // Managed by GameRoom/ConnectionModal mostly, but kept here for initial pass
  const [syncInterval, setSyncInterval] = useState<number>(5000);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

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
    localStorage.setItem('bingo_sheet_url_v1', sheetUrl);
  }, [sheetUrl]);

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
        showAlert({ title: 'Éxito', message: 'Usuario registrado correctamente. Por favor inicia sesión.', type: 'success' });
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
    sessionStorage.removeItem('bingo_session');
    sessionStorage.removeItem('bingo_user_data');
  };

  // --- Render ---
  if (!isAuthenticated) {
    return (
      <>
        <LoginRegister
          onLogin={handleLogin}
          onRegister={handleRegisterUser}
          isLoading={isLoginLoading}
          onOpenSettings={() => setShowConnectionModal(true)}
        />
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

  if (userRole === 'player' && currentUser) {
    return (
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
    );
  }

  // Admin View -> GameRoom
  return (
    <GameRoom
      currentUser={currentUser}
      userRole="admin"
      sheetUrl={sheetUrl}
      onLogout={handleLogout}
      isRoomAdmin={true} // Global admin is always room admin
    />
  );
};

export default App;
