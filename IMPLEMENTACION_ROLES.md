# 🔧 Implementación de Sistema de Roles - Instrucciones Manuales

## ⚠️ Advertencia
Estos cambios deben hacerse manualmente debido a la complejidad del archivo App.tsx.
Sigue estas instrucciones EXACTAMENTE.

---

## CAMBIO 1: Agregar Google Apps Script actualizado

1. Abre https://script.google.com
2. Abre tu proyecto
3. Reemplaza TODO el código con el contenido de `google-apps-script/CODIGO_COMPLETO.gs`
4. Guarda y despliega nueva versión

---

## CAMBIO 2: Actualizar App.tsx

### 2.1 - Agregar estados de rol (línea 53, después de `isLoginLoading`)

```typescript
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  
  // NEW: User role and data
  const [userRole, setUserRole] = useState<'admin' | 'player'>(() => {
    return (sessionStorage.getItem('bingo_user_role') as 'admin' | 'player') || 'admin';
  });
  const [currentUser, setCurrentUser] = useState<{username: string; fullName?: string; email?: string} | null>(() => {
    const saved = sessionStorage.getItem('bingo_user_data');
    return saved ? JSON.parse(saved) : null;
  });
```

### 2.2 - Actualizar handleLogin (reemplazar toda la función, línea ~162)

```typescript
  const handleLogin = async (user: string, pass: string) => {
    if (!sheetUrl) {
      await showAlert({ title: 'Error de Configuración', message: 'Por favor configura la URL del Script de Google Sheets antes de ingresar.', type: 'warning' });
      return false;
    }

    setIsLoginLoading(true);
    try {
      const result = await SheetAPI.login(sheetUrl, user, pass);
      if (result.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem('bingo_auth', 'true');
        
        // NEW: Save user role
        const role = result.role || 'admin';
        setUserRole(role);
        sessionStorage.setItem('bingo_user_role', role);
        
        // NEW: Save user data
        const userData = result.userData || { username: user };
        setCurrentUser(userData);
        sessionStorage.setItem('bingo_user_data', JSON.stringify(userData));
        
        // Cargar datos inmediatamente al loguearse
        loadFromCloud();
        return true;
      } else {
        return false;
      }
    } catch (e) {
      console.error(e);
      return false;
    } finally {
      setIsLoginLoading(false);
    }
  };
```

### 2.3 - Actualizar handleLogout (reemplazar toda la función, línea ~193)

```typescript
  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('admin');
    setCurrentUser(null);
    sessionStorage.removeItem('bingo_auth');
    sessionStorage.removeItem('bingo_user_role');
    sessionStorage.removeItem('bingo_user_data');
    // Opcional: limpiar datos sensibles de la memoria
    // setParticipants([]);
    // setWinners([]);
  };
```

### 2.4 - Filtrar participantes según rol (DESPUÉS del loadFromCloud, antes de usar participants)

Encuentra donde usas `participants` en el render y agrega esto ANTES:

```typescript
  // Filter participants based on role  
  const displayParticipants = userRole === 'player' && currentUser
    ? participants.filter(p => p.email === currentUser.email || p.phone === currentUser.username)
    : participants;
```

Luego REEMPLAZA todas las referencias a `participants` en el JSX por `displayParticipants`.

---

## CAMBIO 3: Agregar email a Participant (opcional, por ahora)

Por ahora, los jugadores NO podrán ver sus propios cartones hasta que agreguemos un campo `email` o `userId` a los participantes.

Para la FASE 1, solo implementaremos:
- ✅ Usuarios con rol
- ✅ Login que devuelve el rol
- ⏸️ Filtrado de participantes (se hará después)

---

## ✅ RESUMEN

### Archivos a editar manualmente:
1. **Google Apps Script** → Copiar `CODIGO_COMPLETO.gs`
2. **App.tsx** → 3 cambios:
   - Agregar estados `userRole` y `currentUser`
   - Actualizar `handleLogin` para guardar rol
   - Actualizar `handleLogout` para limpiar rol

### NO tocar por ahora:
- Filtrado de participantes (requiere más cambios en el modelo de datos)
- Ocultar botones según rol (se hará después)

---

## 🧪 Probar

Después de hacer los cambios:

1. Registra un usuario nuevo (será 'player')
2. Cierra sesión  
3. Inicia sesión con `admin / admin123` (será 'admin')
4. Abre la consola del navegador y escribe:
   ```javascript
   console.log(sessionStorage.getItem('bingo_user_role'))
   ```
5. Deberías ver el rol correcto

---

¿Necesitas ayuda con alguno de estos pasos?
