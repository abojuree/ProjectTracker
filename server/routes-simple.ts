// Simple routes for testing without Google OAuth
import type { Express } from "express";

export function registerSimpleRoutes(app: Express) {
  // Simple teacher creation for testing
  app.post('/api/teacher/simple-register', async (req, res) => {
    try {
      const { name, schoolName } = req.body;
      
      if (!name || !schoolName) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const teacherData = {
        id: Date.now(),
        name: name.trim(),
        schoolName: schoolName.trim(),
        email: `${name.replace(/\s+/g, '.')}@${schoolName.replace(/\s+/g, '.')}.local`,
        linkCode: `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}`,
        googleId: null,
        accessToken: null,
        isActive: true,
        createdAt: new Date()
      };

      res.json(teacherData);
    } catch (error) {
      console.error('Error creating simple teacher:', error);
      res.status(500).json({ message: 'Failed to create teacher' });
    }
  });

  // Get teacher data for demo purposes
  app.get('/api/teacher/demo/:teacherId', async (req, res) => {
    try {
      const teacherId = req.params.teacherId;
      
      const demoTeacher = {
        id: parseInt(teacherId),
        name: "معلم تجريبي",
        schoolName: "مدرسة تجريبية",
        email: "demo@school.local",
        linkCode: `demo-teacher-${teacherId}`,
        googleId: null,
        accessToken: null,
        isActive: true,
        createdAt: new Date()
      };

      res.json(demoTeacher);
    } catch (error) {
      console.error('Error getting demo teacher:', error);
      res.status(500).json({ message: 'Failed to get teacher' });
    }
  });

  // Get teacher stats for demo
  app.get('/api/teacher/demo/:teacherId/stats', async (req, res) => {
    try {
      const stats = {
        totalStudents: 0,
        totalFiles: 0,
        subjects: [],
        activeParents: 0
      };

      res.json(stats);
    } catch (error) {
      console.error('Error getting demo stats:', error);
      res.status(500).json({ message: 'Failed to get stats' });
    }
  });

  // Get students for demo teacher
  app.get('/api/teacher/demo/:teacherId/students', async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error('Error getting demo students:', error);
      res.status(500).json({ message: 'Failed to get students' });
    }
  });
}