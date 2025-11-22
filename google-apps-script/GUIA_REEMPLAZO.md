# 🚀 Guía Rápida de Reemplazo - Google Apps Script

## ✅ Pasos para Actualizar tu Script

### PASO 1: Abrir tu Google Apps Script
1. Ve a https://script.google.com
2. Abre tu proyecto existente (el que tiene la URL de tu aplicación)

### PASO 2: Reemplazar TODO el código
1. **ELIMINA TODO** el código actual que tienes en `Code.gs`
2. **Abre el archivo:** `google-apps-script/CODIGO_COMPLETO.gs`
3. **Copia TODO** el contenido
4. **Pégalo** en tu `Code.gs` de Google Apps Script

### PASO 3: Guardar
1. Haz clic en el ícono de **💾 Guardar** (o Ctrl+S)
2. Asegúrate de que no haya errores (arriba debe decir "Guardado")

### PASO 4: Desplegar Nueva Versión
1. Haz clic en **"Implementar"** (arriba a la derecha)
2. Selecciona **"Gestionar implementaciones"**
3. Haz clic en el ícono de **lápiz** (editar) de tu implementación activa
4. En **"Versión"** selecciona **"Nueva versión"**
5. Haz clic en **"Implementar"**
6. Haz clic en **"Listo"**

### PASO 5: Probar
1. Abre tu aplicación: http://localhost:5173
2. Haz clic en **"CREAR CUENTA"**
3. Llena el formulario:
   - Nombre: Tu nombre
   - Email: tu@email.com
   - Teléfono: (opcional)
4. Haz clic en **"REGISTRARSE"**
5. **Guarda las credenciales** que se generen
6. Haz clic en **"IR AL LOGIN"**
7. Inicia sesión con las credenciales generadas

---

## 📊 ¿Qué hace este nuevo script?

### ✅ Acciones Soportadas:

| Acción | Descripción |
|--------|-------------|
| `login` | Busca usuario en hoja USERS y Admin |
| `register` | Crea nuevo usuario con credenciales automáticas |
| `read` | Lee todos los participantes |
| `save` | Guarda/actualiza un participante |
| `delete` | Elimina un participante |
| `delete_all` | Elimina todos los participantes |

### ✅ Hojas que Usa:

| Hoja | Propósito |
|------|-----------|
| **USERS** | Usuarios registrados (nueva) |
| **Admin** | Usuarios hardcodeados antiguos |
| **Participantes** | Participantes del bingo |

### ✅ Flujo de Login:
1. Busca en hoja **USERS** (usuarios nuevos)
2. Si no encuentra, busca en hoja **Admin** (usuarios antiguos)
3. Si encuentra coincidencia, permite el acceso

---

## 🎯 Credenciales Por Defecto

Si NO tienes usuarios registrados aún, puedes usar:

- **Usuario:** `admin`
- **Contraseña:** `admin123`

Estos están en la hoja "Admin" por defecto.

---

## 🔍 Verificar que Funcionó

### En Google Sheets:
1. Abre tu hoja de cálculo
2. Deberías ver las siguientes pestañas:
   - **USERS** (nueva) - Para usuarios registrados
   - **Admin** - Para usuarios hardcodeados
   - **Participantes** - Para participantes del bingo

### En la Aplicación:
1. La pantalla de login debe mostrar:
   - Formulario de login
   - Botón "CREAR CUENTA"
2. Al hacer clic en "CREAR CUENTA" debe aparecer el formulario de registro

---

## ❓ Solución de Problemas

### Problema: "Error al registrarse"
**Solución:** Verifica que hayas desplegado la nueva versión del script.

### Problema: "Credenciales incorrectas" al hacer login
**Solución:** 
1. Verifica que hayas copiado exactamente las credenciales generadas
2. Revisa en la hoja USERS de Google Sheets cuáles son las credenciales
3. Usuario y contraseña son case-sensitive (distinguen mayúsculas/minúsculas)

### Problema: No aparece la hoja USERS
**Solución:** La hoja se crea automáticamente cuando alguien se registra por primera vez.

---

## ✨ ¡Listo!

Tu script ahora tiene:
- ✅ Sistema de login completo
- ✅ Sistema de registro automático
- ✅ Generación de credenciales
- ✅ Gestión de participantes
- ✅ Compatibilidad con usuarios antiguos

**Ahora puedes empezar a registrar usuarios en tu aplicación.**
