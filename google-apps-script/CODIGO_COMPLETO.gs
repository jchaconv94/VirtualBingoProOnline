/**
 * ============================================================================
 * BINGO VIRTUAL PRO - Google Apps Script
 * ============================================================================
 * Script completo con:
 * - Sistema de autenticación (login)
 * - Sistema de registro de usuarios
 * - Gestión de participantes
 * - Sincronización en tiempo real
 */

// ============================================================================
// FUNCIONES PRINCIPALES
// ============================================================================

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const lock = LockService.getScriptLock();
  // Esperar hasta 10 segundos para evitar conflictos de escritura simultánea
  lock.tryLock(10000);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    
    // 1. Determinar la acción
    const action = e.parameter.action || 'read';
    
    // 2. Parsear el cuerpo de la solicitud
    let params = {};
    if (e.postData && e.postData.contents) {
      try {
        params = JSON.parse(e.postData.contents);
      } catch (err) {
        // Si falla el parseo, seguimos
      }
    }

    let result = {};

    // --- LÓGICA DE LOGIN ---
    if (action === 'login') {
      return handleLogin(params, spreadsheet);
    }

    // --- NUEVO: LÓGICA DE REGISTRO ---
    if (action === 'register') {
      return handleRegister(params, spreadsheet);
    }

    // --- LÓGICA DE PARTICIPANTES (Hoja 'Participantes') ---
    let sheet = spreadsheet.getSheetByName('Participantes');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Participantes');
      sheet.appendRow(['ID', 'JSON_DATA', 'UPDATED_AT']); // Encabezados
    }
    // Asegurar encabezados si la hoja existe pero está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['ID', 'JSON_DATA', 'UPDATED_AT']);
    }

    if (action === 'read') {
      const data = sheet.getDataRange().getValues();
      const participants = [];
      // Empezamos en 1 para saltar encabezados
      for (let i = 1; i < data.length; i++) {
        // data[i][1] es la columna JSON_DATA
        if (data[i][1]) { 
          try {
            participants.push(JSON.parse(data[i][1]));
          } catch (err) {}
        }
      }
      result = { success: true, data: participants };
    } 
    
    else if (action === 'save') {
      // Esperamos que el payload tenga { participant: { ... } }
      const p = params.participant;
      if (!p || !p.id) {
        throw new Error("Datos de participante inválidos");
      }

      const data = sheet.getDataRange().getValues();
      let rowIndex = -1;

      // Buscar si ya existe por ID (Columna 0)
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(p.id)) {
          rowIndex = i + 1; // +1 porque los índices de fila empiezan en 1
          break;
        }
      }

      const jsonString = JSON.stringify(p);
      const timestamp = new Date();

      if (rowIndex > 0) {
        // Actualizar existente
        sheet.getRange(rowIndex, 2).setValue(jsonString);
        sheet.getRange(rowIndex, 3).setValue(timestamp);
      } else {
        // Crear nuevo
        sheet.appendRow([p.id, jsonString, timestamp]);
      }
      result = { success: true, message: 'Saved' };
    }

    else if (action === 'delete') {
      const id = e.parameter.id || params.id;
      const data = sheet.getDataRange().getValues();
      let deleted = false;
      for (let i = 1; i < data.length; i++) {
        if (String(data[i][0]) === String(id)) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }
      result = { success: true, message: deleted ? 'Deleted' : 'Not Found' };
    }

    else if (action === 'delete_all') {
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      result = { success: true, message: 'All Deleted' };
    }
    
    else {
      result = { success: false, error: 'Acción desconocida: ' + action };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// ============================================================================
// FUNCIÓN DE LOGIN (MODIFICADA)
// ============================================================================

function handleLogin(params, spreadsheet) {
  const { user, pass } = params;
  
  if (!user || !pass) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: 'Usuario y contraseña requeridos' 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Primero: Buscar en la hoja USERS (usuarios registrados)
  let userSheet = spreadsheet.getSheetByName("USERS");
  
  if (userSheet && userSheet.getLastRow() > 1) {
    const data = userSheet.getDataRange().getValues();
    
    // Formato: [Nombre Completo, Email, Teléfono, Usuario, Contraseña, Rol, Fecha Registro]
    for (let i = 1; i < data.length; i++) {
      const savedUser = data[i][3]; // Columna D: Usuario
      const savedPass = data[i][4]; // Columna E: Contraseña
      const role = data[i][5] || 'player'; // Columna F: Rol (por defecto 'player')
      
      if (String(savedUser) === String(user) && String(savedPass) === String(pass)) {
        return ContentService.createTextOutput(JSON.stringify({ 
          success: true,
          message: 'Login exitoso',
          role: role,
          userData: {
            fullName: data[i][0],
            email: data[i][1],
            phone: data[i][2],
            username: savedUser
          }
        })).setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  // Segundo: Buscar en la hoja Admin (usuarios hardcodeados antiguos)
  let authSheet = spreadsheet.getSheetByName("Admin");
  if (!authSheet) {
    authSheet = spreadsheet.insertSheet("Admin");
    authSheet.appendRow(["User", "Password"]);
    // Usuario por defecto
    authSheet.appendRow(["admin", "admin123"]); 
  }

  const adminData = authSheet.getDataRange().getValues();
  // Itera buscando coincidencia (saltando encabezado)
  for (let i = 1; i < adminData.length; i++) {
    // Columna 0 = User, Columna 1 = Password
    if (String(adminData[i][0]) === String(user) && String(adminData[i][1]) === String(pass)) {
      return ContentService.createTextOutput(JSON.stringify({ 
        success: true,
        role: 'admin',
        userData: {
          username: user
        }
      })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ 
    success: false, 
    message: "Credenciales incorrectas" 
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// FUNCIÓN DE REGISTRO (NUEVA)
// ============================================================================

function handleRegister(params, spreadsheet) {
  const { fullName, email, phone } = params;
  
  if (!fullName || !email) {
    return ContentService.createTextOutput(JSON.stringify({ 
      success: false, 
      message: 'Nombre y email son obligatorios' 
    })).setMimeType(ContentService.MimeType.JSON);
  }

  // Obtener o crear la hoja USERS
  let userSheet = spreadsheet.getSheetByName("USERS");
  
  if (!userSheet) {
    userSheet = spreadsheet.insertSheet("USERS");
    // Crear encabezados
    userSheet.getRange(1, 1, 1, 7).setValues([[
      'Nombre Completo', 
      'Email', 
      'Teléfono', 
      'Usuario', 
      'Contraseña', 
      'Rol',
      'Fecha Registro'
    ]]);
    
    // Formatear encabezados
    userSheet.getRange(1, 1, 1, 7)
      .setFontWeight('bold')
      .setBackground('#4299e1')
      .setFontColor('#ffffff');
  }

  // Verificar si el email ya está registrado
  if (userSheet.getLastRow() > 1) {
    const data = userSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]).toLowerCase() === String(email).toLowerCase()) {
        return ContentService.createTextOutput(JSON.stringify({ 
          success: false, 
          message: 'Este email ya está registrado' 
        })).setMimeType(ContentService.MimeType.JSON);
      }
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
    'player', // Rol por defecto para usuarios registrados
    new Date().toISOString()
  ];

  userSheet.appendRow(row);

  // Devolver las credenciales generadas
  return ContentService.createTextOutput(JSON.stringify({ 
    success: true, 
    message: 'Usuario registrado exitosamente',
    credentials: {
      username: username,
      password: password
    }
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================================
// FUNCIONES AUXILIARES DE REGISTRO
// ============================================================================

/**
 * Generar nombre de usuario único
 * Formato: primernombre + últimas 4 cifras del email
 */
function generateUsername(fullName, email) {
  // Tomar primer nombre (normalizar a minúsculas y quitar espacios)
  const firstName = fullName.trim().split(' ')[0].toLowerCase().replace(/[^a-z]/g, '');
  
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
