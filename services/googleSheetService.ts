
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
}


export const SheetAPI = {
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
      return json;
    } catch (error) {
      console.error("Login Error:", error);
      return { success: false, error: String(error) };
    }
  },

  // Método para registro de nuevos usuarios
  async register(url: string, fullName: string, email: string, phone: string): Promise<ApiResponse> {
    try {
      // Generate username and password (similar to old backend)
      const baseUsername = fullName.toLowerCase().replace(/\s+/g, '').substring(0, 10);
      const randomSuffix = Math.floor(Math.random() * 10000);
      const usuario = baseUsername + randomSuffix;

      // Generate random password
      const contraseña = Math.random().toString(36).substring(2, 10);

      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          userData: {
            nombreCompleto: fullName,
            email: email,
            telefono: phone,
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
  async createCard(url: string, idUser: string, numbers: number[]): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          action: 'create_card',
          cardData: {
            idUser,
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
   * Get all cards for a specific user
   */
  async getUserCards(url: string, userId: string): Promise<ApiResponse> {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({ action: 'get_user_cards', userId }),
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
  }
};
