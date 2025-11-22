# 🔐 Sistema de Registro de Usuarios - Guía de Implementación

## 📋 Resumen

Hemos implementado un sistema de registro automático de usuarios que:
- ✅ Permite a nuevos usuarios registrarse con su nombre, email y teléfono
- ✅ Genera automáticamente usuario y contraseña únicos
- ✅ Almacena los datos en Google Sheets
- ✅ Muestra las credenciales generadas al usuario
- ✅ Permite login con las credenciales generadas

---

## 🚀 Pasos de Implementación

### PASO 1: Actualizar Google Apps Script

1. **Abre tu Google Apps Script:**
   - Ve a https://script.google.com
   - Abre el proyecto que tienes configurado (el de la URL del script)

2. **Agrega el código de registro:**
   - Abre el archivo `google-apps-script/REGISTRO_USUARIOS.gs` que acabamos de crear
   - Copia TODO el código
   - En tu Google Apps Script, agrega las funciones nuevas:
     - `handleRegister(params)` - función principal de registro
     - `generateUsername(fullName, email)` - genera usuario automático
     - `generatePassword()` - genera contraseña aleatoria

3. **Actualiza tu función `doPost` existente:**
   Dentro del switch, agrega el case 'register':
   ```javascript
   case 'register':
     return handleRegister(params);
   ```

4. **Actualiza tu función `handleLogin`:**
   Reemplaza tu función de login hardcodeada con la nueva que busca en la hoja USERS

5. **Guarda y Despliega:**
   - Haz clic en "💾 Guardar"
   - Haz clic en "🚀 Implementar" > "Gestionar implementaciones"
   - Crea una nueva versión o actualiza la existente

---

### PASO 2: Verificar que el Frontend esté actualizado

Ya hemos actualizado automáticamente:
- ✅ Componente `LoginRegister.tsx` creado
- ✅ Servicio `googleSheetService.ts` con método `register()`
- ✅ `App.tsx` actualizado con handler `handleRegisterUser`

El servidor debería haberse reiniciado automáticamente.

---

## 🧪 Cómo Probar

### Prueba 1: Registro de Usuario

1. **Abre la aplicación** en http://localhost:5173

2. **Verás la pantalla de login**

3. **Haz clic en "CREAR CUENTA"**

4. **Completa el formulario:**
   - Nombre Completo: "Juan Pérez"
   - Email: "juan@example.com"
   - Teléfono: "0999123456" (opcional)

5. **Haz clic en "REGISTRARSE"**

6. **Deberías ver:**
   - Mensaje de éxito
   - Usuario generado automáticamente (ej: `juan1234`)
   - Contraseña generada (ej: `Xy8kL2mP`)

7. **IMPORTANTE:** Guarda esas credenciales

### Prueba 2: Verificar en Google Sheets

1. **Abre tu hoja de cálculo** de Google Sheets

2. **Busca la nueva pestaña "USERS"**

3. **Deberías ver:**
   - Encabezados: Nombre Completo | Email | Teléfono | Usuario | Contraseña | Fecha Registro
   - Tu usuario registrado con todos los datos

### Prueba 3: Login con Nuevo Usuario

1. **Regresa al Login** (botón "IR AL LOGIN")

2. **Ingresa las credenciales generadas:**
   - Usuario: el que se generó automáticamente
   - Contraseña: la que se generó automáticamente

3. **Haz clic en "INICIAR SESIÓN"**

4. **Deberías ingresar a la aplicación normalmente**

---

## 🎯 Formato de Generación de Credenciales

### Usuario:
- **Formato:** `primernombre` + `últimas4cifrasEmail`
- **Ejemplo:** 
  - Nombre: "Juan Carlos Pérez"
  - Email: "juan.carlos1234@gmail.com"
  - **Usuario generado:** `juan1234`

### Contraseña:
- **Formato:** 8 caracteres alfanuméricos aleatorios
- **Ejemplo:** `Xy8kL2mP`

---

## 📊 Estructura de la Hoja USERS

| Columna | Campo | Ejemplo |
|---------|-------|---------|
| A | Nombre Completo | Juan Carlos Pérez |
| B | Email | juan@example.com |
| C | Teléfono | 0999123456 |
| D | Usuario | juan1234 |
| E | Contraseña | Xy8kL2mP |
| F | Fecha Registro | 2025-11-22T17:30:00.000Z |

---

## 🔧 Solución de Problemas

### Problema: "Error al registrarse"

**Causa:** El script no está actualizado o no tiene permisos

**Solución:**
1. Verifica que hayas desplegado la nueva versión del script
2. Asegúrate de haber guardado todos los cambios
3. Revisa que la URL del script sea correcta

### Problema: "Este email ya está registrado"

**Causa:** Ya existe un usuario con ese email

**Solución:**
1. Usa un email diferente
2. O elimina el registro existente en la hoja USERS

### Problema: "Credenciales incorrectas" al hacer login

**Causa:** Las credenciales no coinciden

**Solución:**
1. Verifica que estés usando exactamente las credenciales generadas
2. El usuario y contraseña son sensibles a mayúsculas/minúsculas
3. Revisa en la hoja USERS cuáles son las credenciales correctas

---

## ⚡ Características Adicionales

### Seguridad:
- ✅ Validación de email duplicados
- ✅ Validación de campos obligatorios
- ✅ Generación automática de contraseñas seguras

### UX:
- ✅ Interfaz moderna y atractiva
- ✅ Mensajes claros de éxito/error
- ✅ Advertencia para guardar credenciales

### Datos:
- ✅ Almacenamiento centralizado en Google Sheets
- ✅ Registro de fecha de creación
- ✅ Teléfono opcional

---

## 🎨 Capturas del Flujo

### 1. Pantalla de Login
- Botón "CREAR CUENTA" visible

### 2. Formulario de Registro
- Campos: Nombre, Email, Teléfono
- Botón "REGISTRARSE"

### 3. Credenciales Generadas
- Muestra usuario y contraseña
- Advertencia para guardarlas
- Botón "IR AL LOGIN"

### 4. Login Exitoso
- Ingresa a la aplicación normalmente

---

## 💡 Próximas Mejoras Sugeridas

1. **Recuperación de contraseña**
   - Sistema para enviar credenciales por email

2. **Perfiles de usuario**
   - Permitir editar datos del perfil

3. **Roles y permisos**
   - Diferenciar entre usuario normal y administrador

4. **Historial de sesiones**
   - Registrar últimos accesos

---

¿Todo claro? ¡Ahora tienes un sistema completo de registro de usuarios!
