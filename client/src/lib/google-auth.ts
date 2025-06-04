// Google OAuth configuration for teachers
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID || "your-google-client-id";

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
}

export class GoogleAuth {
  private static instance: GoogleAuth;
  private isInitialized = false;

  static getInstance(): GoogleAuth {
    if (!GoogleAuth.instance) {
      GoogleAuth.instance = new GoogleAuth();
    }
    return GoogleAuth.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    return new Promise((resolve, reject) => {
      // Load Google API script
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        gapi.load('auth2', {
          callback: () => {
            gapi.auth2.init({
              client_id: GOOGLE_CLIENT_ID,
              scope: 'email profile https://www.googleapis.com/auth/drive.file'
            }).then(() => {
              this.isInitialized = true;
              resolve();
            }).catch(reject);
          },
          onerror: reject
        });
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async signIn(): Promise<GoogleUser> {
    await this.initialize();
    
    const authInstance = gapi.auth2.getAuthInstance();
    const user = await authInstance.signIn();
    const profile = user.getBasicProfile();
    
    return {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      picture: profile.getImageUrl()
    };
  }

  async signOut(): Promise<void> {
    if (!this.isInitialized) return;
    
    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signOut();
  }

  async isSignedIn(): Promise<boolean> {
    await this.initialize();
    
    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance.isSignedIn.get();
  }

  async getCurrentUser(): Promise<GoogleUser | null> {
    if (!(await this.isSignedIn())) return null;
    
    const authInstance = gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    const profile = user.getBasicProfile();
    
    return {
      id: profile.getId(),
      email: profile.getEmail(),
      name: profile.getName(),
      picture: profile.getImageUrl()
    };
  }

  async getAccessToken(): Promise<string | null> {
    if (!(await this.isSignedIn())) return null;
    
    const authInstance = gapi.auth2.getAuthInstance();
    const user = authInstance.currentUser.get();
    const authResponse = user.getAuthResponse();
    
    return authResponse.access_token;
  }
}

// Extend Window interface for Google APIs
declare global {
  interface Window {
    gapi: any;
  }
  
  const gapi: any;
}
