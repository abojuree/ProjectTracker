// Teacher session management with cookies for cross-device access

export interface TeacherSession {
  teacherId: number;
  googleId: string;
  name: string;
  email: string;
  schoolName?: string;
  linkCode: string;
  lastAccess: string;
}

const TEACHER_SESSION_KEY = 'teacher_session';
const SESSION_EXPIRY_DAYS = 30;

export class TeacherSessionManager {
  // Save teacher session to cookies
  static saveSession(teacher: TeacherSession): void {
    try {
      const sessionData = {
        ...teacher,
        lastAccess: new Date().toISOString()
      };
      
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + SESSION_EXPIRY_DAYS);
      
      // Create secure cookie
      document.cookie = `${TEACHER_SESSION_KEY}=${encodeURIComponent(JSON.stringify(sessionData))}; expires=${expiryDate.toUTCString()}; path=/; SameSite=Strict; Secure`;
      
      // Also save to localStorage as backup
      localStorage.setItem(TEACHER_SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Failed to save teacher session:', error);
    }
  }

  // Get teacher session from cookies
  static getSession(): TeacherSession | null {
    try {
      // Try to get from cookies first
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find(cookie => 
        cookie.trim().startsWith(`${TEACHER_SESSION_KEY}=`)
      );
      
      if (sessionCookie) {
        const sessionData = sessionCookie.split('=')[1];
        const decoded = decodeURIComponent(sessionData);
        return JSON.parse(decoded);
      }
      
      // Fallback to localStorage
      const sessionData = localStorage.getItem(TEACHER_SESSION_KEY);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get teacher session:', error);
      return null;
    }
  }

  // Clear teacher session
  static clearSession(): void {
    try {
      // Clear cookie
      document.cookie = `${TEACHER_SESSION_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      
      // Clear localStorage
      localStorage.removeItem(TEACHER_SESSION_KEY);
      
      // Clear any registration data
      sessionStorage.removeItem('teacherRegistrationData');
    } catch (error) {
      console.error('Failed to clear teacher session:', error);
    }
  }

  // Check if session is valid (not expired)
  static isSessionValid(session: TeacherSession): boolean {
    try {
      const lastAccess = new Date(session.lastAccess);
      const now = new Date();
      const daysDiff = (now.getTime() - lastAccess.getTime()) / (1000 * 3600 * 24);
      
      return daysDiff <= SESSION_EXPIRY_DAYS;
    } catch (error) {
      console.error('Failed to validate session:', error);
      return false;
    }
  }

  // Update last access time
  static updateLastAccess(session: TeacherSession): void {
    const updatedSession = {
      ...session,
      lastAccess: new Date().toISOString()
    };
    this.saveSession(updatedSession);
  }

  // Check if user is returning from Google OAuth
  static hasRegistrationData(): boolean {
    try {
      const regData = sessionStorage.getItem('teacherRegistrationData');
      return regData !== null;
    } catch (error) {
      return false;
    }
  }

  // Get registration data from session storage
  static getRegistrationData(): any | null {
    try {
      const regData = sessionStorage.getItem('teacherRegistrationData');
      return regData ? JSON.parse(regData) : null;
    } catch (error) {
      console.error('Failed to get registration data:', error);
      return null;
    }
  }

  // Clear registration data
  static clearRegistrationData(): void {
    try {
      sessionStorage.removeItem('teacherRegistrationData');
    } catch (error) {
      console.error('Failed to clear registration data:', error);
    }
  }
}