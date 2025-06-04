import { 
  pgTable, 
  text, 
  serial, 
  integer, 
  boolean, 
  timestamp, 
  bigint,
  varchar,
  index
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Teachers table
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  googleId: varchar("google_id", { length: 255 }).unique().notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  profileImageUrl: varchar("profile_image_url", { length: 500 }),
  driveFolderId: varchar("drive_folder_id", { length: 255 }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  linkCode: varchar("link_code", { length: 50 }).unique(),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true)
}, (table) => [
  index("idx_teachers_google_id").on(table.googleId),
  index("idx_teachers_link_code").on(table.linkCode)
]);

// Students table
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  civilId: varchar("civil_id", { length: 10 }).notNull(),
  studentName: varchar("student_name", { length: 255 }).notNull(),
  grade: varchar("grade", { length: 100 }).notNull(),
  classNumber: integer("class_number").notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  teacherId: integer("teacher_id").notNull(),
  folderCreated: boolean("folder_created").default(false),
  createdDate: timestamp("created_date").defaultNow(),
  isActive: boolean("is_active").default(true)
}, (table) => [
  index("idx_students_civil_id").on(table.civilId),
  index("idx_students_teacher_subject").on(table.teacherId, table.subject),
  index("idx_students_teacher_id").on(table.teacherId)
]);

// Files table
export const files = pgTable("files", {
  id: serial("id").primaryKey(),
  studentCivilId: varchar("student_civil_id", { length: 10 }).notNull(),
  subject: varchar("subject", { length: 100 }).notNull(),
  fileCategory: varchar("file_category", { length: 50 }).notNull(),
  originalName: varchar("original_name", { length: 500 }).notNull(),
  systemName: varchar("system_name", { length: 500 }).notNull(),
  filePath: text("file_path").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: bigint("file_size", { mode: "number" }),
  fileType: varchar("file_type", { length: 10 }),
  uploadDate: timestamp("upload_date").defaultNow(),
  teacherId: integer("teacher_id").notNull(),
  description: text("description"),
  viewCount: integer("view_count").default(0),
  isActive: boolean("is_active").default(true)
}, (table) => [
  index("idx_files_student_subject").on(table.studentCivilId, table.subject),
  index("idx_files_category").on(table.studentCivilId, table.fileCategory),
  index("idx_files_upload_date").on(table.uploadDate),
  index("idx_files_full_search").on(table.studentCivilId, table.subject, table.fileCategory, table.uploadDate),
  index("idx_files_teacher_id").on(table.teacherId)
]);

// Captcha questions table
export const captchaQuestions = pgTable("captcha_questions", {
  id: serial("id").primaryKey(),
  question: varchar("question", { length: 255 }).notNull(),
  answer: varchar("answer", { length: 50 }).notNull(),
  isActive: boolean("is_active").default(true)
});

// Relations
export const teachersRelations = relations(teachers, ({ many }) => ({
  students: many(students),
  files: many(files)
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  teacher: one(teachers, {
    fields: [students.teacherId],
    references: [teachers.id]
  }),
  files: many(files)
}));

export const filesRelations = relations(files, ({ one }) => ({
  teacher: one(teachers, {
    fields: [files.teacherId],
    references: [teachers.id]
  }),
  student: one(students, {
    fields: [files.studentCivilId],
    references: [students.civilId]
  })
}));

// Insert schemas
export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdDate: true,
  lastLogin: true
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdDate: true
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  uploadDate: true,
  viewCount: true
});

export const insertCaptchaSchema = createInsertSchema(captchaQuestions).omit({
  id: true
});

// Types
export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type File = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;
export type CaptchaQuestion = typeof captchaQuestions.$inferSelect;
export type InsertCaptchaQuestion = z.infer<typeof insertCaptchaSchema>;

// File categories enum
export const FILE_CATEGORIES = {
  EXAMS: "اختبارات",
  GRADES: "درجات", 
  HOMEWORK: "واجبات",
  NOTES: "ملاحظات",
  ALERTS: "إنذارات",
  PARTICIPATION: "مشاركات",
  CERTIFICATES: "شهادات",
  ATTENDANCE: "حضور وغياب",
  BEHAVIOR: "سلوك",
  OTHER: "أخرى"
} as const;

export type FileCategory = typeof FILE_CATEGORIES[keyof typeof FILE_CATEGORIES];
