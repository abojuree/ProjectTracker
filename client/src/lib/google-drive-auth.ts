// Modern Google Drive authentication using Google Identity Services
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  accessToken: string;
}

export class GoogleDriveAuth {
  private static instance: GoogleDriveAuth;
  private isInitialized = false;

  static getInstance(): GoogleDriveAuth {
    if (!GoogleDriveAuth.instance) {
      GoogleDriveAuth.instance = new GoogleDriveAuth();
    }
    return GoogleDriveAuth.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Google Auth only works in browser environment'));
        return;
      }

      // Load Google Identity Services
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.onload = () => {
        this.isInitialized = true;
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<GoogleUser> {
    if (!this.isInitialized) {
      throw new Error('Google Auth not initialized');
    }

    return new Promise((resolve, reject) => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'profile email https://www.googleapis.com/auth/drive.file',
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error(response.error));
            return;
          }

          try {
            // Store the access token
            localStorage.setItem('google_access_token', response.access_token);

            // Get user profile using the access token
            const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
              headers: {
                Authorization: `Bearer ${response.access_token}`
              }
            });

            if (!profileResponse.ok) {
              throw new Error('Failed to fetch user profile');
            }

            const profile = await profileResponse.json();

            resolve({
              id: profile.id,
              email: profile.email,
              name: profile.name,
              picture: profile.picture,
              accessToken: response.access_token
            });
          } catch (error) {
            reject(error);
          }
        }
      });

      client.requestAccessToken();
    });
  }

  async signOut(): Promise<void> {
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('teacherId');
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    const token = localStorage.getItem('google_access_token');
    if (!token) return null;

    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        localStorage.removeItem('google_access_token');
        return null;
      }

      const profile = await response.json();

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        picture: profile.picture,
        accessToken: token
      };
    } catch {
      localStorage.removeItem('google_access_token');
      return null;
    }
  }

  async getAccessToken(): Promise<string | null> {
    return localStorage.getItem('google_access_token');
  }

  // Google Drive API methods
  async createFolder(name: string, parentId?: string): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('No access token available');

    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined
    };

    const response = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      throw new Error('Failed to create folder');
    }

    const result = await response.json();
    return result.id;
  }

  async uploadFile(file: File, fileName: string, folderId?: string): Promise<string> {
    const token = await this.getAccessToken();
    if (!token) throw new Error('No access token available');

    const metadata = {
      name: fileName,
      parents: folderId ? [folderId] : undefined
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: form
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const result = await response.json();
    return result.id;
  }

  async getFileUrl(fileId: string): Promise<string> {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
}

declare global {
  interface Window {
    google: any;
  }
}