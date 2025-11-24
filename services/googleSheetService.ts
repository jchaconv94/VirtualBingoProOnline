
import { Participant, UserData, CartonData } from '../types.ts';

export interface ApiResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  role?: 'admin' | 'player';
  userId?: string;
  user?: UserData;
  cards?: CartonData[];
  cardId?: string;
  userData?: {
    username: string;
    fullName?: string;
    email?: string;
    phone?: string;
    userId?: string;  // Unique user ID for linking to Participant
  };
  credentials?: {
    username: string;
    password: string;
  };
  room?: {
    id: string;
    name: string;
    adminId: string;
    isPrivate: boolean;
    createdAt: string;
    pricePerCard?: number;
    participantsCount?: number;
    cardsSold?: number;
    totalPot?: number;
  };
  rooms?: {
    id: string;
    name: string;
    adminId: string;
    isPrivate: boolean;
    createdAt: string;
    pricePerCard?: number;
    participantsCount?: number;
    cardsSold?: number;
    totalPot?: number;
  }[];
}


export const SheetAPI = {
  async testConnection(url: string): Promise<{ success: boolean; message: string; count?: number; }> {
    try {
      const endpoint = `${url}?action=read`;
      const response = await fetch(endpoint);
      const json = await response.json();

      if (json.success) {
        const count = Array.isArray(json.data) ? json.data.length : undefined;
        return {
          success: true,
          message: count !== undefined ? `Conexión exitosa. Se encontraron ${count} registros.` : 'Conexión exitosa.',
          count
        };
      }

      if (json.status === 'active') {
        return {
          success: true,
          message: json.message || 'Conexión verificada. El script respondió correctamente.'
        };
      }

      return {
        success: false,
        message: json.message || 'Respuesta inesperada del Apps Script.'
      };
    } catch (error) {
      console.error('Test Connection Error:', error);
      return {
        success: false,
        message: String(error)
      };
    }
  },
  // Método para autenticación
  async login(url: string, user: string, pass: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'login', usuario: user, contraseña: pass }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      console.log("Login Response Raw:", json);
      return json;
    } catch (error) {
      console.error("Login Error:", error);
      return { success: false, error: String(error) };
    }
  },

  // Método para registro de nuevos usuarios
  async register(url: string, fullName: string, email: string, phone: string): Promise<ApiResponse> {
    try {
      // Generate unique username with timestamp to avoid collisions
      const baseUsername = fullName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]/g, '') // Remove special characters
        .substring(0, 8);
      
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const randomSuffix = Math.floor(Math.random() * 1000); // 0-999
      const usuario = baseUsername + timestamp.slice(-3) + randomSuffix;

      // Generate stronger random password (8 characters alphanumeric)
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      let contraseña = '';
      for (let i = 0; i < 8; i++) {
        contraseña += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Clean phone number (remove spaces)
      const cleanPhone = phone ? phone.replace(/\s/g, '') : '';

      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          userData: {
            nombreCompleto: fullName,
            email: email,
            telefono: cleanPhone,
            usuario: usuario,
            contraseña: contraseña,
            rol: 'player'
          }
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();

      // If username collision, retry with different suffix
      if (!json.success && json.message && json.message.includes('nombre de usuario ya existe')) {
        console.log('Username collision detected, retrying with new suffix...');
        const retryRandomSuffix = Math.floor(Math.random() * 10000);
        const retryUsuario = baseUsername + Date.now().toString().slice(-4) + retryRandomSuffix;
        
        const retryResponse = await fetch(url, {
          method: 'POST',
          body: JSON.stringify({
            action: 'register',
            userData: {
              nombreCompleto: fullName,
              email: email,
              telefono: cleanPhone,
              usuario: retryUsuario,
              contraseña: contraseña,
              rol: 'player'
            }
          }),
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
        });
        const retryJson = await retryResponse.json();
        
        if (retryJson.success) {
          retryJson.credentials = {
            username: retryUsuario,
            password: contraseña
          };
        }
        return retryJson;
      }

      // Add credentials to response for display to user
      if (json.success) {
        json.credentials = {
          username: usuario,
          password: contraseña
        };
      }

      return json;
    } catch (error) {
      console.error("Register Error:", error);
      return { success: false, error: String(error) };
    }
  },

  // Método genérico para enviar datos (Google Apps Script requiere POST para payloads JSON o GET para queries simples)
  // Usamos "no-cors" en fetch standard, pero para recibir respuesta JSON de GAS necesitamos un truco.
  // GAS devuelve redirects, fetch los sigue.

  async syncParticipant(url: string, participant: Participant): Promise<ApiResponse> {
    try {
      // Usamos el parámetro ?action=save en la URL y enviamos el body
      const endpoint = `${url}?action=save`;

      // Para evitar problemas de CORS con GAS, usamos text/plain
      const response = await fetch(endpoint, {
        method: 'POST',
        body: JSON.stringify({ participant }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });

      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Sync Error:", error);
      return { success: false, error: String(error) };
    }
  },

  async deleteParticipant(url: string, id: string): Promise<ApiResponse> {
    try {
      const endpoint = `${url}?action=delete&id=${id}`;
      const response = await fetch(endpoint, {
        method: 'POST', // Usamos POST para activar el trigger doPost aunque sea delete
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async deleteAll(url: string): Promise<ApiResponse> {
    try {
      const endpoint = `${url}?action=delete_all`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      return { success: false, error: String(error) };
    }
  },

  async fetchAll(url: string): Promise<Participant[] | null> {
    try {
      const endpoint = `${url}?action=read`;
      const response = await fetch(endpoint);
      const json = await response.json();

      if (json.success && Array.isArray(json.data)) {
        return json.data as Participant[];
      }
      return null;
    } catch (error) {
      console.error("Fetch Error:", error);
      return null;
    }
  },

  // ============================================================
  // NEW RESTRUCTURED DATABASE METHODS
  // ============================================================

  /**
   * Create a new bingo card in the CARTONES sheet
   */
  async createCard(url: string, idUser: string, numbers: number[], roomId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_card',
          cardData: {
            idUser,
            idRoom: roomId,
            numbers
          }
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Create Card Error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Create multiple cards at once (optimized for bulk purchases)
   */
  async createMultipleCards(url: string, idUser: string, cardsData: { numbers: number[]; roomId: string }[]): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_multiple_cards',
          cardsData: cardsData.map(card => ({
            idUser,
            idRoom: card.roomId,
            numbers: card.numbers
          }))
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Create Multiple Cards Error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get all cards for a specific user
   */
  async getUserCards(url: string, userId: string, roomId?: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'get_user_cards', userId, roomId }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Get User Cards Error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get all cards (admin function)
   */
  async getAllCardsNew(url: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'get_all_cards' }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Get All Cards Error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Delete a specific card
   */
  async deleteCardById(url: string, cardId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'delete_card', cardId }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Delete Card Error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(url: string, userId: string, profileData: {
    nombreCompleto: string;
    email: string;
    telefono: string;
  }): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_profile',
          userId,
          profileData
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Update Profile Error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Create a new room
   */
  async createRoom(url: string, roomData: { name: string; password?: string; adminId: string; pricePerCard: number }): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_room',
          roomData
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Create Room Error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Update room data (name, price, password)
   */
  async updateRoom(url: string, roomId: string, roomData: { name?: string; pricePerCard?: number; password?: string }): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'update_room',
          roomId,
          roomData
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Update Room Error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Get all active rooms
   */
  async getRooms(url: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'get_rooms'
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Get Rooms Error:", error);
      return { success: false, error: String(error) };
    }
  },

  /**
   * Join a room (register participant entry)
   */
  async joinRoom(url: string, roomId: string, userId: string, password?: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'join_room',
          roomId,
          userId,
          password
        }),
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
      });
      const json = await response.json();
      return json;
    } catch (error) {
      console.error("Join Room Error:", error);
      return { success: false, error: String(error) };
    }
  }
};
