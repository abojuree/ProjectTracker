import {
  teachers,
  students,
  files,
  captchaQuestions,
  type Teacher,
  type InsertTeacher,
  type Student,
  type InsertStudent,
  type File,
  type InsertFile,
  type CaptchaQuestion,
  type InsertCaptchaQuestion
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Teacher operations
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByGoogleId(googleId: string): Promise<Teacher | undefined>;
  getTeacherByLinkCode(linkCode: string): Promise<Teacher | undefined>;
  getTeacherByEmail(email: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, updates: Partial<InsertTeacher & { lastLogin?: Date }>): Promise<Teacher>;
  validateTeacherPassword(email: string, password: string): Promise<Teacher | null>;
  setTeacherPassword(teacherId: number, passwordHash: string): Promise<void>;

  // Student operations
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByCivilId(civilId: string): Promise<Student | undefined>;
  getStudentsByTeacher(teacherId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  createStudentsBatch(students: InsertStudent[]): Promise<Student[]>;
  updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student>;
  deleteStudent(id: number): Promise<void>;

  // File operations
  getFile(id: number): Promise<File | undefined>;
  getFilesByStudent(studentCivilId: string, teacherId: number): Promise<File[]>;
  getFilesByStudentAndSubject(studentCivilId: string, subject: string, teacherId: number): Promise<File[]>;
  getFilesByCategory(studentCivilId: string, category: string, teacherId: number): Promise<File[]>;
  createFile(file: InsertFile): Promise<File>;
  updateFile(id: number, updates: Partial<InsertFile>): Promise<File>;
  deleteFile(id: number): Promise<void>;

  // Captcha operations
  getRandomCaptcha(): Promise<CaptchaQuestion | undefined>;
  createCaptcha(captcha: InsertCaptchaQuestion): Promise<CaptchaQuestion>;

  // Stats operations
  getTeacherStats(teacherId: number): Promise<{
    totalStudents: number;
    totalFiles: number;
    subjects: string[];
    activeParents: number;
  }>;
  getStudentFileCounts(teacherId: number): Promise<{ studentId: number; fileCount: number }[]>;
}

export class DatabaseStorage implements IStorage {
  // Teacher operations
  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher || undefined;
  }

  async getTeacherByGoogleId(googleId: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.googleId, googleId));
    return teacher || undefined;
  }

  async getTeacherByLinkCode(linkCode: string): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.linkCode, linkCode));
    return teacher || undefined;
  }

  async getTeacherByEmail(email: string): Promise<Teacher | undefined> {
    // Get the most recent teacher with a password hash first, fallback to any teacher
    const [teacherWithPassword] = await db
      .select()
      .from(teachers)
      .where(and(
        eq(teachers.email, email),
        sql`password_hash IS NOT NULL`
      ))
      .orderBy(desc(teachers.createdAt))
      .limit(1);
    
    if (teacherWithPassword) {
      return teacherWithPassword;
    }
    
    // Fallback to any teacher with this email
    const [teacher] = await db.select().from(teachers).where(eq(teachers.email, email));
    return teacher || undefined;
  }

  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const [teacher] = await db
      .insert(teachers)
      .values(teacherData)
      .returning();
    return teacher;
  }

  async updateTeacher(id: number, updates: Partial<InsertTeacher & { lastLogin?: Date }>): Promise<Teacher> {
    const [teacher] = await db
      .update(teachers)
      .set(updates)
      .where(eq(teachers.id, id))
      .returning();
    return teacher;
  }

  // Student operations
  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByCivilId(civilId: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.civilId, civilId));
    return student || undefined;
  }

  async getStudentsByTeacher(teacherId: number): Promise<Student[]> {
    return await db
      .select()
      .from(students)
      .where(and(eq(students.teacherId, teacherId), eq(students.isActive, true)))
      .orderBy(students.studentName);
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const [student] = await db
      .insert(students)
      .values(studentData)
      .returning();
    return student;
  }

  async createStudentsBatch(studentsData: InsertStudent[]): Promise<Student[]> {
    return await db
      .insert(students)
      .values(studentsData)
      .returning();
  }

  async updateStudent(id: number, updates: Partial<InsertStudent>): Promise<Student> {
    const [student] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: number): Promise<void> {
    await db
      .update(students)
      .set({ isActive: false })
      .where(eq(students.id, id));
  }

  // File operations
  async getFile(id: number): Promise<File | undefined> {
    const [file] = await db.select().from(files).where(eq(files.id, id));
    return file || undefined;
  }

  async getFilesByStudent(studentCivilId: string, teacherId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(
        eq(files.studentCivilId, studentCivilId),
        eq(files.teacherId, teacherId),
        eq(files.isActive, true)
      ))
      .orderBy(desc(files.uploadDate));
  }

  async getFilesByStudentAndSubject(studentCivilId: string, subject: string, teacherId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(
        eq(files.studentCivilId, studentCivilId),
        eq(files.subject, subject),
        eq(files.teacherId, teacherId),
        eq(files.isActive, true)
      ))
      .orderBy(desc(files.uploadDate));
  }

  async getFilesByCategory(studentCivilId: string, category: string, teacherId: number): Promise<File[]> {
    return await db
      .select()
      .from(files)
      .where(and(
        eq(files.studentCivilId, studentCivilId),
        eq(files.fileCategory, category),
        eq(files.teacherId, teacherId),
        eq(files.isActive, true)
      ))
      .orderBy(desc(files.uploadDate));
  }

  async createFile(fileData: InsertFile): Promise<File> {
    const [file] = await db
      .insert(files)
      .values(fileData)
      .returning();
    return file;
  }

  async updateFile(id: number, updates: Partial<InsertFile>): Promise<File> {
    const [file] = await db
      .update(files)
      .set(updates)
      .where(eq(files.id, id))
      .returning();
    return file;
  }

  async deleteFile(id: number): Promise<void> {
    await db
      .update(files)
      .set({ isActive: false })
      .where(eq(files.id, id));
  }

  // Captcha operations
  async getRandomCaptcha(): Promise<CaptchaQuestion | undefined> {
    const [captcha] = await db
      .select()
      .from(captchaQuestions)
      .where(eq(captchaQuestions.isActive, true))
      .orderBy(sql`RANDOM()`)
      .limit(1);
    return captcha || undefined;
  }

  async createCaptcha(captchaData: InsertCaptchaQuestion): Promise<CaptchaQuestion> {
    const [captcha] = await db
      .insert(captchaQuestions)
      .values(captchaData)
      .returning();
    return captcha;
  }

  // Stats operations
  async getTeacherStats(teacherId: number): Promise<{
    totalStudents: number;
    totalFiles: number;
    subjects: string[];
    activeParents: number;
  }> {
    // Get total students
    const [studentsCount] = await db
      .select({ count: count() })
      .from(students)
      .where(and(eq(students.teacherId, teacherId), eq(students.isActive, true)));

    // Get total files
    const [filesCount] = await db
      .select({ count: count() })
      .from(files)
      .where(and(eq(files.teacherId, teacherId), eq(files.isActive, true)));

    // Get unique subjects
    const subjectsResult = await db
      .selectDistinct({ subject: students.subject })
      .from(students)
      .where(and(eq(students.teacherId, teacherId), eq(students.isActive, true)));

    return {
      totalStudents: studentsCount.count,
      totalFiles: filesCount.count,
      subjects: subjectsResult.map(s => s.subject),
      activeParents: studentsCount.count // For now, assume all parents are active
    };
  }

  async validateTeacherPassword(email: string, password: string): Promise<Teacher | null> {
    // Get the most recent teacher with a password hash
    const [teacher] = await db
      .select()
      .from(teachers)
      .where(and(
        eq(teachers.email, email),
        sql`password_hash IS NOT NULL`
      ))
      .orderBy(desc(teachers.createdAt))
      .limit(1);
    
    if (!teacher || !teacher.passwordHash) {
      return null;
    }

    const isValid = await bcrypt.compare(password, teacher.passwordHash);
    return isValid ? teacher : null;
  }

  async setTeacherPassword(teacherId: number, passwordHash: string): Promise<void> {
    await db
      .update(teachers)
      .set({ passwordHash })
      .where(eq(teachers.id, teacherId));
  }

  async getStudentFileCounts(teacherId: number): Promise<{ studentId: number; fileCount: number }[]> {
    const result = await db.select({
      studentId: students.id,
      fileCount: sql<number>`cast(count(${files.id}) as int)`
    })
    .from(students)
    .leftJoin(files, and(
      eq(files.studentCivilId, students.civilId),
      eq(files.isActive, true)
    ))
    .where(and(eq(students.teacherId, teacherId), eq(students.isActive, true)))
    .groupBy(students.id);
    
    return result;
  }
}

export const storage = new DatabaseStorage();
