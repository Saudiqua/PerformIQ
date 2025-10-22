import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles
export type UserRole = "employee" | "manager" | "admin";

// User type
export interface User {
  id: string;
  email: string;
  password: string;
  role: UserRole;
  name: string;
  teamId: string;
  managerId: string | null;
  avatarUrl: string;
}

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["employee", "manager", "admin"]),
  name: z.string(),
  teamId: z.string(),
  managerId: z.string().nullable(),
  avatarUrl: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Team type
export interface Team {
  id: string;
  name: string;
  department: string;
}

export const insertTeamSchema = z.object({
  name: z.string(),
  department: z.string(),
});

export type InsertTeam = z.infer<typeof insertTeamSchema>;

// Communication type
export type CommunicationPlatform = "email" | "slack";

export interface Communication {
  id: string;
  senderId: string;
  recipientId: string;
  platform: CommunicationPlatform;
  timestamp: Date;
  subject: string;
  content: string;
  sentimentScore: number; // -1 to 1
}

export const insertCommunicationSchema = z.object({
  senderId: z.string(),
  recipientId: z.string(),
  platform: z.enum(["email", "slack"]),
  timestamp: z.date(),
  subject: z.string(),
  content: z.string(),
  sentimentScore: z.number().min(-1).max(1),
});

export type InsertCommunication = z.infer<typeof insertCommunicationSchema>;

// Metrics type
export interface Metric {
  id: string;
  userId: string;
  date: Date;
  initiativeScore: number; // 0-100
  collaborationIndex: number; // 0-100
  responsivenessRating: number; // 0-100
  clarityScore: number; // 0-100
}

export const insertMetricSchema = z.object({
  userId: z.string(),
  date: z.date(),
  initiativeScore: z.number().min(0).max(100),
  collaborationIndex: z.number().min(0).max(100),
  responsivenessRating: z.number().min(0).max(100),
  clarityScore: z.number().min(0).max(100),
});

export type InsertMetric = z.infer<typeof insertMetricSchema>;

// Alert type
export type AlertType = "performance_drop" | "burnout_signal" | "low_engagement" | "negative_sentiment";
export type AlertSeverity = "low" | "medium" | "high";

export interface Alert {
  id: string;
  userId: string;
  managerId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  createdAt: Date;
  resolved: boolean;
}

export const insertAlertSchema = z.object({
  userId: z.string(),
  managerId: z.string(),
  type: z.enum(["performance_drop", "burnout_signal", "low_engagement", "negative_sentiment"]),
  severity: z.enum(["low", "medium", "high"]),
  message: z.string(),
  createdAt: z.date(),
  resolved: z.boolean(),
});

export type InsertAlert = z.infer<typeof insertAlertSchema>;

// Login/Signup schemas
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(["employee", "manager", "admin"]),
});

export type SignupData = z.infer<typeof signupSchema>;

// Dashboard response types
export interface EmployeeDashboardData {
  user: User;
  performanceScore: number;
  performanceTrend: number; // percentage change
  communicationStats: {
    avgResponseTime: number; // in hours
    teamAvgResponseTime: number;
    messagesSentThisWeek: number;
    messagesReceivedThisWeek: number;
    messagesSentLastWeek: number;
    messagesReceivedLastWeek: number;
    sentimentBreakdown: {
      positive: number;
      neutral: number;
      negative: number;
    };
    topCollaborators: Array<{
      userId: string;
      name: string;
      avatarUrl: string;
      messageCount: number;
    }>;
  };
  metrics: {
    initiative: { current: number; trend: number };
    collaboration: { current: number; trend: number };
    responsiveness: { current: number; trend: number };
    clarity: { current: number; trend: number };
  };
  weeklyTrends: Array<{
    week: string;
    initiative: number;
    collaboration: number;
    responsiveness: number;
    clarity: number;
  }>;
  aiInsights: {
    strengths: string[];
    growthAreas: string[];
    weeklyHighlight: string;
  };
}

export interface ManagerDashboardData {
  teamHealth: {
    overallScore: number;
    status: "green" | "yellow" | "red";
    highPerformers: number;
    averagePerformers: number;
    needsAttention: number;
    alertCount: number;
  };
  teamMembers: Array<{
    id: string;
    name: string;
    avatarUrl: string;
    performanceScore: number;
    trend: "up" | "down" | "stable";
    trendPercentage: number;
    hasAlert: boolean;
    responseTime: number;
    sentiment: number;
    activityLevel: number;
  }>;
  alerts: Alert[];
  teamAnalytics: {
    sentimentTrend: Array<{
      date: string;
      sentiment: number;
    }>;
    workloadDistribution: Array<{
      userId: string;
      name: string;
      messageCount: number;
    }>;
  };
}

export interface EmployeeDeepDiveData {
  employee: User;
  performanceScore: number;
  metrics: {
    initiative: number;
    collaboration: number;
    responsiveness: number;
  };
  trends: Array<{
    date: string;
    initiative: number;
    collaboration: number;
    responsiveness: number;
  }>;
  communicationExamples: Array<{
    platform: string;
    snippet: string;
    sentiment: number;
    timestamp: Date;
  }>;
  aiSummary: string;
  talkingPoints: string[];
  recommendations: {
    recognize: string[];
    support: string[];
    develop: string[];
  };
}

export interface AdminData {
  users: User[];
  systemAnalytics: {
    totalUsers: number;
    totalCommunications: number;
    avgPerformanceScore: number;
    alertsThisWeek: number;
  };
  thresholds: {
    performanceDropThreshold: number;
    burnoutThreshold: number;
    engagementThreshold: number;
  };
}

// Auth response
export interface AuthResponse {
  token: string;
  user: User;
}
