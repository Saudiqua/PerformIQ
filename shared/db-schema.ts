import { pgTable, varchar, timestamp, integer, boolean, text, decimal } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// Teams table
export const teams = pgTable("teams", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }).notNull(),
});

export const insertTeamSchema = createInsertSchema(teams).omit({ id: true });
export type InsertTeam = typeof teams.$inferInsert;
export type SelectTeam = typeof teams.$inferSelect;

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: varchar("role", { length: 50 }).notNull().$type<"employee" | "manager" | "admin">(),
  name: varchar("name", { length: 255 }).notNull(),
  teamId: varchar("team_id").notNull().references(() => teams.id),
  managerId: varchar("manager_id").references(() => users.id),
  avatarUrl: varchar("avatar_url", { length: 500 }).notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export type InsertUser = typeof users.$inferInsert;
export type SelectUser = typeof users.$inferSelect;

// Communications table
export const communications = pgTable("communications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  recipientId: varchar("recipient_id").notNull().references(() => users.id),
  platform: varchar("platform", { length: 50 }).notNull().$type<"email" | "slack">(),
  timestamp: timestamp("timestamp").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  content: text("content").notNull(),
  sentimentScore: decimal("sentiment_score", { precision: 3, scale: 2 }).notNull(),
});

export const insertCommunicationSchema = createInsertSchema(communications).omit({ id: true });
export type InsertCommunication = typeof communications.$inferInsert;
export type SelectCommunication = typeof communications.$inferSelect;

// Metrics table
export const metrics = pgTable("metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  initiativeScore: integer("initiative_score").notNull(),
  collaborationIndex: integer("collaboration_index").notNull(),
  responsivenessRating: integer("responsiveness_rating").notNull(),
  clarityScore: integer("clarity_score").notNull(),
});

export const insertMetricSchema = createInsertSchema(metrics).omit({ id: true });
export type InsertMetric = typeof metrics.$inferInsert;
export type SelectMetric = typeof metrics.$inferSelect;

// Alerts table
export const alerts = pgTable("alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  managerId: varchar("manager_id").notNull().references(() => users.id),
  type: varchar("type", { length: 100 }).notNull().$type<"performance_drop" | "burnout_signal" | "low_engagement" | "negative_sentiment">(),
  severity: varchar("severity", { length: 50 }).notNull().$type<"low" | "medium" | "high">(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolved: boolean("resolved").notNull().default(false),
});

export const insertAlertSchema = createInsertSchema(alerts).omit({ id: true, createdAt: true });
export type InsertAlert = typeof alerts.$inferInsert;
export type SelectAlert = typeof alerts.$inferSelect;

// Thresholds table (for admin configuration)
export const thresholds = pgTable("thresholds", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  performanceDropThreshold: integer("performance_drop_threshold").notNull().default(15),
  burnoutThreshold: integer("burnout_threshold").notNull().default(70),
  engagementThreshold: integer("engagement_threshold").notNull().default(40),
});

export const insertThresholdSchema = createInsertSchema(thresholds).omit({ id: true });
export type InsertThreshold = typeof thresholds.$inferInsert;
export type SelectThreshold = typeof thresholds.$inferSelect;
