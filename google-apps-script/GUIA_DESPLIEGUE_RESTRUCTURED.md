# Guía de Despliegue - Base de Datos Reestructurada

## ✅ Archivos Creados

### Backend (Google Apps Script)
- **`CODIGO_COMPLETO_RESTRUCTURED.gs`** - Nuevo backend con arquitectura relacional

### Frontend (TypeScript)
- **`types.ts`** - Actualizado con interfaces `UserData` y `CartonData`
- **`googleSheetService.ts`** - Actualizado con nuevos métodos API

## 📋 Pasos de Despliegue

### 1. Configurar Google Apps Script

1. **Abrir Google Sheets** y crear un nuevo spreadsheet
2. **Ir a Extensions → Apps Script**
3. **Copiar el contenido** de `CODIGO_COMPLETO_RESTRUCTURED.gs`
4. **Pegar** en el editor de Apps Script (reemplazando Code.gs)
5. **Guardar** el proyecto

### 2. Inicializar la Base de Datos

1. En el editor de Apps Script, **seleccionar la función** `initializeDatabase`
2. **Hacer clic en Run** (ejecutar)
3. **Autorizar** los permisos cuando se solicite
4. **Verificar** que se crearon dos hojas:
   - ✅ `USERS` (con headers: IdUser, Nombre Completo, Email, Teléfono, Usuario, Contraseña, Rol, Fecha Registro)
   - ✅ `CARTONES` (con headers: IdUser, ID_Carton, N1, N2, ..., N24)

### 3. Desplegar como Web App

1. En Apps Script, **hacer clic en Deploy → New deployment**
2. **Seleccionar tipo**: Web app
3. **Configurar**:
   - Description: "Virtual Bingo Pro - Restructured Backend"
   - Execute as: Me
   - Who has access: Anyone
4. **Deploy** y **copiar la URL** del web app

### 4. Actualizar Frontend

1. **Abrir** `App.tsx`
2. **Buscar** la variable `API_URL` (o similar)
3. **Reemplazar** con la nueva URL copiada en el paso 3
4. **Guardar** el archivo

### 5. Limpiar Datos Locales (Fresh Start)

1. **Abrir** la aplicación en el navegador
2. **Abrir DevTools** (F12)
3. **Ir a Console** y ejecutar:
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

### 6. Verificar Funcionamiento

1. **Registrar un usuario de prueba**
2. **Iniciar sesión**
3. **Verificar en Google Sheets**:
   - ✅ Usuario aparece en hoja `USERS` con `IdUser` generado
4. **Comprar un cartón**
5. **Verificar en Google Sheets**:
   - ✅ Cartón aparece en hoja `CARTONES` con `IdUser` y `ID_Carton` correctos
   - ✅ Números N1-N24 están poblados

## 🔑 Endpoints Disponibles

### Gestión de Usuarios
- `action=register` - Registrar nuevo usuario
- `action=login` - Autenticar usuario

### Gestión de Cartones
- `action=create_card` - Crear nuevo cartón
- `action=get_user_cards` - Obtener cartones de un usuario
- `action=get_all_cards` - Obtener todos los cartones (admin)
- `action=delete_card` - Eliminar un cartón

## 📊 Estructura de Datos

### USERS Sheet
```
| IdUser          | Nombre Completo | Email          | Teléfono  | Usuario | Contraseña | Rol    | Fecha Registro     |
|-----------------|----------------|----------------|-----------|---------|------------|--------|-------------------|
| USR-1234-5678   | Juan Pérez     | juan@email.com | 123456789 | juan123 | pass123    | player | 2025-11-23...     |
```

### CARTONES Sheet
```
| IdUser        | ID_Carton     | N1 | N2 | N3 | ... | N24 |
|---------------|---------------|----|----|----|----|-----|
| USR-1234-5678 | CRD-9876-5432 | 5  | 12 | 23 | ... | 67  |
```

## 🚨 Notas Importantes

> [!WARNING]
> Este es un **fresh start**. Los datos anteriores NO se migrarán automáticamente.

> [!IMPORTANT]
> - Los usuarios existentes deben **re-registrarse**
> - Todos los cartones anteriores se perderán
> - Hacer **backup** de datos importantes antes de desplegar

> [!NOTE]
> La arquitectura anterior con `JSON_DATA` y hoja "Participantes" ya no se utiliza. Puede mantener esas hojas como backup pero la aplicación NO las leerá.

## 🔄 Sincronización en Tiempo Real

La sincronización automática seguirá funcionando porque:
- Google Sheets actualiza en tiempo real
- El frontend hace polling periódico
- Las nuevas hojas `USERS` y `CARTONES` son igual de accesibles

## ✅ Verificación de Integridad

Después del deployment, verificar:

1. **Hojas creadas correctamente**
   ```
   ✓ USERS sheet exists
   ✓ CARTONES sheet exists
   ✓ Headers are correct
   ```

2. **IDs generados correctamente**
   ```
   ✓ UserId format: USR-{timestamp}-{random}
   ✓ CardId format: CRD-{timestamp}-{random}
   ```

3. **Relaciones correctas**
   ```
   ✓ CARTONES.IdUser references USERS.IdUser
   ✓ Each card has 24 numbers
   ✓ No orphan cards
   ```

## 🐛 Troubleshooting

### Error: "USERS sheet not found"
- **Solución**: Ejecutar `initializeDatabase()` en Apps Script

### Error: "Card must have exactly 24 numbers"
- **Solución**: Verificar que el frontend genera cartones con 24 números (no 25)

### Error: "Usuario ya existe"
- **Solución**: Usar un nombre de usuario diferente o eliminar la fila del usuario en la hoja USERS

### Los cartones no se muestran
- **Solución**: Verificar que `IdUser` en CARTONES coincide con el del usuario actual

## 📞 Soporte

Para más información, revisar:
- `implementation_plan.md` - Plan técnico detallado
- `task.md` - Checklist de implementación
- Google Apps Script logs - Para errores del backend
