/**
 * VIRTUAL BINGO PRO - RESTRUCTURED BACKEND
 * Clean relational database architecture using Google Sheets
 * 
 * USERS Sheet: Stores user authentication and profiles
 * CARTONES Sheet: Stores bingo cards with individual number columns (N1-N24)
 * ROOMS Sheet: Stores game rooms
 */

// ============================================================
// CONFIGURATION
// ============================================================

const SHEET_NAMES = {
  USERS: 'USERS',
  CARTONES: 'CARTONES',
  ROOMS: 'ROOMS',
  ROOM_PARTICIPANTS: 'ROOM_PARTICIPANTS'
};

// ============================================================
// INITIALIZATION FUNCTIONS
// ============================================================

/**
 * Initialize the USERS sheet with proper headers
 */
function initializeUSERSSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.USERS);
  }
  
  // Clear existing content
  sheet.clear();
  
  // Set headers
  const headers = [
    'IdUser',
    'Nombre Completo',
    'Email',
    'Teléfono',
    'Usuario',
    'Contraseña',
    'Rol',
    'Fecha Registro'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#4285f4')
    .setFontColor('#ffffff');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('USERS sheet initialized successfully');
}

/**
 * Initialize the CARTONES sheet with proper headers
 */
function initializeCARTONESSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.CARTONES);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.CARTONES);
  }
  
  // Clear existing content
  sheet.clear();
  
  // Set headers: IdUser, ID_Carton, N1-N24
  const headers = ['IdUser', 'ID_Carton'];
  for (let i = 1; i <= 24; i++) {
    headers.push('N' + i);
  }
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#0f9d58')
    .setFontColor('#ffffff');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('CARTONES sheet initialized successfully');
}

/**
 * Initialize the ROOMS sheet with proper headers
 */
function initializeROOMSSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.ROOMS);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.ROOMS);
  }
  
  // Clear existing content
  sheet.clear();
  
  // Set headers
  const headers = [
    'IdRoom',
    'Nombre',
    'AdminId',
    'PrecioCarton',
    'Password', // Optional, can be empty
    'IsPrivate', // Boolean
    'FechaCreacion',
    'Estado' // ACTIVE, CLOSED
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Format header row
  sheet.getRange(1, 1, 1, headers.length)
    .setFontWeight('bold')
    .setBackground('#8e24aa') // Purple for rooms
    .setFontColor('#ffffff');
  
  // Freeze header row
  sheet.setFrozenRows(1);
  
  Logger.log('ROOMS sheet initialized successfully');
}

/**
 * Initialize the ROOM_PARTICIPANTS sheet with proper headers
 */
function initializeROOMPARTICIPANTSSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAMES.ROOM_PARTICIPANTS);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAMES.ROOM_PARTICIPANTS);
  }

  sheet.clear();

  const headers = [
    'IdRoom',
    'IdUser',
    'JoinedAt',
    'UserName',
    'UserEmail'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#374151').setFontColor('#ffffff');
  sheet.setFrozenRows(1);

  Logger.log('ROOM_PARTICIPANTS sheet initialized successfully');
}

/**
 * Initialize all sheets (run this once to set up the database)
 */
function initializeDatabase() {
  initializeUSERSSheet();
  initializeCARTONESSheet();
  initializeROOMSSheet();
  initializeROOMPARTICIPANTSSheet();
  Logger.log('Database initialized successfully');
}

// ============================================================
// ID GENERATION FUNCTIONS
// ============================================================

/**
 * Generate a unique user ID
 */
function generateUserId() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return 'USR-' + timestamp + '-' + random;
}

/**
 * Generate a unique card ID
 */
function generateCardId() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return 'CRD-' + timestamp + '-' + random;
}

/**
 * Generate a unique room ID
 */
function generateRoomId() {
  const timestamp = new Date().getTime();
  const random = Math.floor(Math.random() * 10000);
  return 'ROOM-' + timestamp + '-' + random;
}

// ============================================================
// USER MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Register a new user
 */
function registerUser(userData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    
    if (!sheet) {
      throw new Error('USERS sheet not found. Please initialize the database first.');
    }
    
    // Check if user already exists
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][4] === userData.usuario) { // Column 4 is Usuario
        return {
          success: false,
          message: 'El nombre de usuario ya existe'
        };
      }
      if (data[i][2] === userData.email) { // Column 2 is Email
        return {
          success: false,
          message: 'El correo electrónico ya está registrado'
        };
      }
    }
    
    // Generate unique user ID
    const userId = generateUserId();
    
    // Prepare row data
    const newRow = [
      userId,
      userData.nombreCompleto || '',
      userData.email || '',
      userData.telefono || '',
      userData.usuario,
      userData.contraseña || userData.password || '',
      userData.rol || 'player',
      new Date().toISOString()
    ];

    sheet.appendRow(newRow);

    return {
      success: true,
      message: 'Usuario registrado exitosamente',
      userId
    };
    
  } catch (error) {
    Logger.log('Error in registerUser: ' + error.toString());
    return {
      success: false,
      message: 'Error al registrar usuario: ' + error.toString()
    };
  }
}

/**
 * Update existing user profile fields
 */
function updateUserProfile(userId, profileData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
    
    if (!sheet) {
      throw new Error('USERS sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Find user row
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        // Columns: IdUser, Nombre Completo, Email, Teléfono, Usuario, Contraseña, Rol, Fecha Registro
        sheet.getRange(i + 1, 2).setValue(profileData.nombreCompleto); // Nombre Completo
        sheet.getRange(i + 1, 3).setValue(profileData.email); // Email
        sheet.getRange(i + 1, 4).setValue(profileData.telefono); // Teléfono
        
        return {
          success: true,
          message: 'Perfil actualizado exitosamente'
        };
      }
    }
    
    return {
      success: false,
      message: 'Usuario no encontrado'
    };
    
  } catch (error) {
    Logger.log('Error in updateUserProfile: ' + error.toString());
    return {
      success: false,
      message: 'Error al actualizar perfil: ' + error.toString()
    };
  }
}

/**
 * Login user against USERS (and legacy Admin) sheets
 */
function loginUser(username, password) {
  try {
    if (!username || !password) {
      return {
        success: false,
        message: 'Usuario y contraseña requeridos'
      };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const usersSheet = ss.getSheetByName(SHEET_NAMES.USERS);

    if (usersSheet && usersSheet.getLastRow() > 1) {
      const data = usersSheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        const savedUsername = data[i][4]; // Columna Usuario
        const savedPassword = data[i][5]; // Columna Contraseña
        if (String(savedUsername) === String(username) && String(savedPassword) === String(password)) {
          const user = {
            idUser: data[i][0],
            nombreCompleto: data[i][1],
            email: data[i][2],
            telefono: data[i][3],
            usuario: savedUsername,
            rol: data[i][6] || 'player'
          };
          return {
            success: true,
            message: 'Login exitoso',
            user
          };
        }
      }
    }

    // Legacy Admin sheet fallback
    let adminSheet = ss.getSheetByName('Admin');
    if (!adminSheet) {
      adminSheet = ss.insertSheet('Admin');
      adminSheet.appendRow(['User', 'Password', 'Rol']);
      adminSheet.appendRow(['admin', 'admin123', 'admin']);
    }

    const adminData = adminSheet.getDataRange().getValues();
    for (let i = 1; i < adminData.length; i++) {
      if (String(adminData[i][0]) === String(username) && String(adminData[i][1]) === String(password)) {
        const user = {
          idUser: adminData[i][0] || 'ADMIN',
          nombreCompleto: 'Administrador',
          email: '',
          telefono: '',
          usuario: adminData[i][0],
          rol: adminData[i][2] || 'admin'
        };
        return {
          success: true,
          message: 'Login administrador exitoso',
          user
        };
      }
    }

    return {
      success: false,
      message: 'Credenciales incorrectas'
    };

  } catch (error) {
    Logger.log('Error in loginUser: ' + error.toString());
    return {
      success: false,
      message: 'Error en login: ' + error.toString()
    };
  }
}

// ============================================================
// CARD MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Create a new bingo card
 */
function createCard(cardData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.CARTONES);
    
    if (!sheet) {
      throw new Error('CARTONES sheet not found. Please initialize the database first.');
    }
    
    // Generate unique card ID
    const cardId = generateCardId();
    
    // Prepare row data: IdUser, ID_Carton, N1-N24
    const newRow = [cardData.idUser, cardId];
    
    // Add the 24 numbers
    if (cardData.numbers && cardData.numbers.length === 24) {
      newRow.push(...cardData.numbers);
    } else {
      throw new Error('Card must have exactly 24 numbers');
    }
    
    // Add new card
    sheet.appendRow(newRow);
    
    return {
      success: true,
      message: 'Cartón creado exitosamente',
      cardId: cardId
    };
    
  } catch (error) {
    Logger.log('Error in createCard: ' + error.toString());
    return {
      success: false,
      message: 'Error al crear cartón: ' + error.toString()
    };
  }
}

/**
 * Get all cards for a specific user
 */
function getUserCards(userId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.CARTONES);
    
    if (!sheet) {
      throw new Error('CARTONES sheet not found. Please initialize the database first.');
    }
    
    const data = sheet.getDataRange().getValues();
    const cards = [];
    
    // Search for user's cards (skip header row)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) { // Column 0 is IdUser
        const numbers = [];
        for (let j = 2; j < 26; j++) { // Columns 2-25 are N1-N24
          numbers.push(data[i][j]);
        }
        
        cards.push({
          idUser: data[i][0],
          idCarton: data[i][1],
          numbers: numbers
        });
      }
    }
    
    return {
      success: true,
      cards: cards
    };
    
  } catch (error) {
    Logger.log('Error in getUserCards: ' + error.toString());
    return {
      success: false,
      message: 'Error al obtener cartones: ' + error.toString(),
      cards: []
    };
  }
}

/**
 * Get all cards (admin function)
 */
function getAllCards() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.CARTONES);
    
    if (!sheet) {
      throw new Error('CARTONES sheet not found. Please initialize the database first.');
    }
    
    const data = sheet.getDataRange().getValues();
    const cards = [];
    
    // Get all cards (skip header row)
    for (let i = 1; i < data.length; i++) {
      const numbers = [];
      for (let j = 2; j < 26; j++) { // Columns 2-25 are N1-N24
        numbers.push(data[i][j]);
      }
      
      cards.push({
        idUser: data[i][0],
        idCarton: data[i][1],
        numbers: numbers
      });
    }
    
    return {
      success: true,
      cards: cards
    };
    
  } catch (error) {
    Logger.log('Error in getAllCards: ' + error.toString());
    return {
      success: false,
      message: 'Error al obtener cartones: ' + error.toString(),
      cards: []
    };
  }
}

/**
 * Delete a card
 */
function deleteCard(cardId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.CARTONES);
    
    if (!sheet) {
      throw new Error('CARTONES sheet not found. Please initialize the database first.');
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Find and delete the card
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === cardId) { // Column 1 is ID_Carton
        sheet.deleteRow(i + 1);
        return {
          success: true,
          message: 'Cartón eliminado exitosamente'
        };
      }
    }
    
    return {
      success: false,
      message: 'Cartón no encontrado'
    };
    
  } catch (error) {
    Logger.log('Error in deleteCard: ' + error.toString());
    return {
      success: false,
      message: 'Error al eliminar cartón: ' + error.toString()
    };
  }
}

// ============================================================
// ROOM MANAGEMENT FUNCTIONS
// ============================================================

/**
 * Create a new room
 */
function createRoom(roomData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.ROOMS);
    
    if (!sheet) {
      // Auto-initialize if missing
      initializeROOMSSheet();
      return createRoom(roomData);
    }
    
    const roomId = generateRoomId();
    const timestamp = new Date().toISOString();
    
    const pricePerCard = Number(roomData.pricePerCard) || 0;
    const newRow = [
      roomId,
      roomData.name,
      roomData.adminId,
      pricePerCard,
      roomData.password || '',
      roomData.password ? true : false,
      timestamp,
      'ACTIVE'
    ];
    
    sheet.appendRow(newRow);
    
    return {
      success: true,
      message: 'Sala creada exitosamente',
      room: {
        id: roomId,
        name: roomData.name,
        adminId: roomData.adminId,
        isPrivate: !!roomData.password,
        createdAt: timestamp,
        pricePerCard: pricePerCard
      }
    };
    
  } catch (error) {
    Logger.log('Error in createRoom: ' + error.toString());
    return {
      success: false,
      message: 'Error al crear sala: ' + error.toString()
    };
  }
}

/**
 * Get all active rooms
 */
function getActiveRooms() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_NAMES.ROOMS);
    
    if (!sheet) {
      return { success: true, rooms: [] }; // No rooms yet
    }
    
    const data = sheet.getDataRange().getValues();
    const rooms = [];
    
    // Skip header
    for (let i = 1; i < data.length; i++) {
      // Check if active (Column 6 is Estado)
      if (data[i][7] === 'ACTIVE') {
        rooms.push({
          id: data[i][0],
          name: data[i][1],
          adminId: data[i][2],
          pricePerCard: Number(data[i][3]) || 0,
          isPrivate: data[i][5], // Boolean column
          createdAt: data[i][6]
        });
      }
    }
    
    return {
      success: true,
      rooms: rooms
    };
    
  } catch (error) {
    Logger.log('Error in getActiveRooms: ' + error.toString());
    return {
      success: false,
      message: 'Error al obtener salas: ' + error.toString(),
      rooms: []
    };
  }
}

/**
 * Register a user joining a room
 */
function joinRoom(roomId, userId, password) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const roomsSheet = ss.getSheetByName(SHEET_NAMES.ROOMS);

    if (!roomsSheet) {
      return { success: false, message: 'No hay salas disponibles' };
    }

    const roomsData = roomsSheet.getDataRange().getValues();
    let found = null;

    for (let i = 1; i < roomsData.length; i++) {
      if (roomsData[i][0] === roomId && roomsData[i][7] === 'ACTIVE') {
        found = roomsData[i];
        break;
      }
    }

    if (!found) return { success: false, message: 'Sala no encontrada o no activa' };

    const roomPassword = found[4] || '';
    const isPrivate = !!found[5];
    const roomPrice = Number(found[3]) || 0;
    const createdAt = found[6];

    if (isPrivate && String(roomPassword) !== String(password || '')) {
      return { success: false, message: 'Contraseña incorrecta' };
    }

    // Ensure participants sheet exists
    let partSheet = ss.getSheetByName(SHEET_NAMES.ROOM_PARTICIPANTS);
    if (!partSheet) {
      initializeROOMPARTICIPANTSSheet();
      partSheet = ss.getSheetByName(SHEET_NAMES.ROOM_PARTICIPANTS);
    }

    // Optionally fetch user info from USERS sheet
    let userName = '';
    let userEmail = '';
    const usersSheet = ss.getSheetByName(SHEET_NAMES.USERS);
    if (usersSheet) {
      const usersData = usersSheet.getDataRange().getValues();
      for (let j = 1; j < usersData.length; j++) {
        if (usersData[j][0] === userId) {
          userName = usersData[j][1] || '';
          userEmail = usersData[j][2] || '';
          break;
        }
      }
    }

    const joinedAt = new Date().toISOString();
    partSheet.appendRow([roomId, userId, joinedAt, userName, userEmail]);

    const roomInfo = {
      id: found[0],
      name: found[1],
      adminId: found[2],
      pricePerCard: roomPrice,
      isPrivate: isPrivate,
      createdAt: createdAt
    };

    return { success: true, message: 'Unido a la sala', joinedAt, room: roomInfo };

  } catch (error) {
    Logger.log('Error in joinRoom: ' + error.toString());
    return { success: false, message: 'Error al unir a la sala: ' + error.toString() };
  }
}

// ============================================================
// WEB APP ENDPOINTS
// ============================================================

/**
 * Handle GET requests
 */
function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'active',
    message: 'Virtual Bingo Pro API - Restructured Backend',
    version: '2.0'
  })).setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 */
function doPost(e) {
  try {
    Logger.log('doPost iniciado'); // Debug log
    
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No post data received');
    }

    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    
    Logger.log('Received action: ' + action);
    Logger.log('Params: ' + JSON.stringify(params));
    
    let result;
    
    switch (action) {
      case 'register':
        result = registerUser(params.userData);
        break;
        
      case 'login':
        result = loginUser(params.usuario, params.contraseña);
        break;
        
      case 'create_card':
        result = createCard(params.cardData);
        break;
        
      case 'get_user_cards':
        result = getUserCards(params.userId);
        break;
        
      case 'get_all_cards':
        result = getAllCards();
        break;
        
      case 'delete_card':
        result = deleteCard(params.cardId);
        break;
        
      case 'update_profile':
        result = updateUserProfile(params.userId, params.profileData);
        break;

      case 'create_room':
        result = createRoom(params.roomData);
        break;

      case 'get_rooms':
        result = getActiveRooms();
        break;

      case 'join_room':
        result = joinRoom(params.roomId, params.userId, params.password);
        break;
        
      default:
        result = {
          success: false,
          message: 'Acción no reconocida: ' + action
        };
    }
    
    Logger.log('Result: ' + JSON.stringify(result));
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('Error in doPost: ' + error.toString());
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'Error en el servidor: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
