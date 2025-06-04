import { google } from 'googleapis';
import type { Express, Request, Response, NextFunction } from 'express';
import { storage } from './storage';

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/api/auth/google/callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive',
];

function generateLinkCode(teacherName: string): string {
  const cleanName = teacherName.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${cleanName}-${randomSuffix}`;
}

export async function setupGoogleAuth(app: Express) {
  // Setup session middleware
  app.use(require('express-session')({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  }));

  // Google OAuth login route
  app.get('/api/auth/google', (req: Request, res: Response) => {
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent',
    });
    res.redirect(authUrl);
  });

  // Google OAuth callback route
  app.get('/api/auth/google/callback', async (req: Request, res: Response) => {
    try {
      const { code } = req.query;
      
      if (!code) {
        return res.status(400).send('Authorization code not provided');
      }

      const { tokens } = await oauth2Client.getToken(code as string);
      oauth2Client.setCredentials(tokens);

      // Get user info
      const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
      const { data: userInfo } = await oauth2.userinfo.get();

      if (!userInfo.id || !userInfo.email) {
        return res.status(400).send('Failed to get user information');
      }

      // Check if teacher exists
      let teacher = await storage.getTeacherByGoogleId(userInfo.id);
      
      if (!teacher) {
        // Create new teacher
        const linkCode = generateLinkCode(userInfo.name || userInfo.email);
        teacher = await storage.createTeacher({
          googleId: userInfo.id,
          email: userInfo.email,
          name: userInfo.name || userInfo.email,
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
          linkCode,
          driveFolderId: null,
        });
      } else {
        // Update existing teacher's tokens
        teacher = await storage.updateTeacher(teacher.id, {
          accessToken: tokens.access_token || null,
          refreshToken: tokens.refresh_token || null,
          lastLogin: new Date(),
        });
      }

      if (!teacher) {
        return res.status(500).send('Failed to create or update teacher');
      }

      // Store teacher info in session
      (req.session as any).teacherId = teacher.id;
      (req.session as any).teacherGoogleId = teacher.googleId;

      // Redirect to dashboard
      res.redirect('/dashboard');
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // Logout route
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: 'Failed to logout' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });
}

export function requireGoogleAuth(req: Request, res: Response, next: NextFunction) {
  const session = req.session as any;
  
  if (!session.teacherId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  (req as any).user = {
    teacherId: session.teacherId,
    googleId: session.teacherGoogleId,
  };

  next();
}

export async function refreshTokenIfNeeded(teacherId: number): Promise<string | null> {
  try {
    const teacher = await storage.getTeacher(teacherId);
    if (!teacher || !teacher.refreshToken) {
      return null;
    }

    oauth2Client.setCredentials({
      refresh_token: teacher.refreshToken,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (credentials.access_token) {
      await storage.updateTeacher(teacherId, {
        accessToken: credentials.access_token,
      });
      return credentials.access_token;
    }

    return null;
  } catch (error) {
    console.error('Token refresh error:', error);
    return null;
  }
}
