/**
 * ==================================================================
 * GOOGLE APPS SCRIPT - SISTEMA DE REGISTRO DE USUARIOS
 * ==================================================================
 * 
 * Este código debe agregarse a tu Google Apps Script existente.
 * Crea una nueva hoja llamada "USERS" para almacenar los usuarios.
 */

// ===== CONFIGURACIÓN =====
const USERS_SHEET_NAME = "USERS"; // Nombre de la hoja para usuarios

/**
 * ==================================================================
 * FUNCIÓN PRINCIPAL - doPost
 * ==================================================================
 * Agregar el case 'register' a tu función doPost existente
 */

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = e.parameter.action;

    switch (action) {
      case 'login':
        return handleLogin(params);
      
      case 'register': // NUEVO: Agregar este case
        return handleRegister(params);
      
      case 'save':
        return handleSave(params);
      
      case 'delete':
        const id = e.parameter.id;
        return handleDelete(id);
      
      case 'delete_all':
        return handleDeleteAll();
      
     default:
        return response({ success: false, error: 'Acción no válida' });
    }
  } catch (error) {
    return response({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  const action = e.parameter.action;
  
  if (action === 'read') {
    return handleRead();
  }
  
  return response({ success: false, error: 'Acción no especificada' });
}

/**
 * ==================================================================
 * FUNCIONES AUXILIARES
 * ==================================================================
 */

function response(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ==================================================================
 * FUNCIONES DE AUTENTICACIÓN Y REGISTRO
 * ==================================================================
 */

/**
 * Manejar login de usuarios
 * Busca en la hoja USERS si existe el usuario con esa contraseña
 */
function handleLogin(params) {
  const { user, pass } = params;
  
  if (!user || !pass) {
    return response({ success: false, message: 'Usuario y contraseña requeridos' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName(USERS_SHEET_NAME);
  
  // Si no existe la hoja USERS, usar credenciales hardcodeadas (fallback)
  if (!userSheet) {
    // Credenciales de administrador por defecto
    if (user === 'admin' && pass === 'bingopro2024') {
      return response({ success: true, message: 'Login exitoso' });
    }
    return response({ success: false, message: 'Credenciales incorrectas' });
  }

  // Buscar usuario en la hoja USERS
  const data = userSheet.getDataRange().getValues();
  
  // Formato esperado: [Nombre Completo, Email, Teléfono, Usuario, Contraseña, Fecha Registro]
  for (let i = 1; i < data.length; i++) { // Empezar en 1 para saltar encabezado
    const row = data[i];
    const savedUser = row[3]; // Columna D: Usuario
    const savedPass = row[4]; // Columna E: Contraseña
    
    if (savedUser === user && savedPass === pass) {
      return response({ 
        success: true, 
        message: 'Login exitoso',
        userData: {
          fullName: row[0],
          email: row[1],
          phone: row[2]
        }
      });
    }
  }
  
  return response({ success: false, message: 'Credenciales incorrectas' });
}

/**
 * Manejar registro de nuevos usuarios
 * Crea credenciales automáticamente y las devuelve
 */
function handleRegister(params) {
  const { fullName, email, phone } = params;
  
  if (!fullName || !email) {
    return response({ success: false, message: 'Nombre y email son obligatorios' });
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName(USERS_SHEET_NAME);
  
  // Si no existe la hoja USERS, crearla
  if (!userSheet) {
    userSheet = ss.insertSheet(USERS_SHEET_NAME);
    // Crear encabezados
    userSheet.getRange(1, 1, 1, 6).setValues([[
      'Nombre Completo', 
      'Email', 
      'Teléfono', 
      'Usuario', 
      'Contraseña', 
      'Fecha Registro'
    ]]);
    
    // Formatear encabezados
    userSheet.getRange(1, 1, 1, 6)
      .setFontWeight('bold')
      .setBackground('#4299e1')
      .setFontColor('#ffffff');
  }

  // Verificar si el email ya está registrado
  const data = userSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) {
      return response({ 
        success: false, 
        message: 'Este email ya está registrado' 
      });
    }
  }

  // Generar credenciales automáticamente
  const username = generateUsername(fullName, email);
  const password = generatePassword();

  // Agregar nuevo usuario a la hoja
  const row = [
    fullName,
    email,
    phone || '',
    username,
    password,
    new Date().toISOString()
  ];

  userSheet.appendRow(row);

  // Devolver las credenciales generadas
  return response({ 
    success: true, 
    message: 'Usuario registrado exitosamente',
    credentials: {
      username: username,
      password: password
    }
  });
}

/**
 * Generar nombre de usuario único
 * Formato: primernombre + últimas 4 cifras del email
 */
function generateUsername(fullName, email) {
  // Tomar primer nombre
  const firstName = fullName.split(' ')[0].toLowerCase();
  
  // Tomar parte del email antes del @
  const emailPart = email.split('@')[0];
  const randomPart = emailPart.slice(-4);
  
  return firstName + randomPart;
}

/**
 * Generar contraseña aleatoria
 * Formato: 8 caracteres alfanuméricos
 */
function generatePassword() {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let password = '';
  
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

/**
 * ==================================================================
 * FUNCIONES EXISTENTES (MANTENER COMO ESTÁN)
 * ==================================================================
 */

/**
 * Las funciones handleSave, handleDelete, handleDeleteAll, handleRead
 * deben permanecer como están en tu código existente.
 */

// ... resto de tus funciones existentes ...
