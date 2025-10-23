import { eq, and, or, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users, teams, communications, metrics, alerts, thresholds,
  type SelectUser, type InsertUser,
  type SelectTeam, type InsertTeam,
  type SelectCommunication, type InsertCommunication,
  type SelectMetric, type InsertMetric,
  type SelectAlert, type InsertAlert,
} from "@shared/db-schema";
import { IStorage } from "./storage";

// Type adapters to convert between DB schema and API schema
function toUser(dbUser: SelectUser): any {
  return {
    id: dbUser.id,
    email: dbUser.email,
    password: dbUser.password,
    role: dbUser.role,
    name: dbUser.name,
    teamId: dbUser.teamId,
    managerId: dbUser.managerId || null,
    avatarUrl: dbUser.avatarUrl,
  };
}

function toTeam(dbTeam: SelectTeam): any {
  return dbTeam;
}

function toCommunication(dbComm: SelectCommunication): any {
  return {
    id: dbComm.id,
    senderId: dbComm.senderId,
    recipientId: dbComm.recipientId,
    platform: dbComm.platform,
    timestamp: new Date(dbComm.timestamp),
    subject: dbComm.subject,
    content: dbComm.content,
    sentimentScore: parseFloat(dbComm.sentimentScore as string),
  };
}

function toMetric(dbMetric: SelectMetric): any {
  return {
    id: dbMetric.id,
    userId: dbMetric.userId,
    date: new Date(dbMetric.date),
    initiativeScore: dbMetric.initiativeScore,
    collaborationIndex: dbMetric.collaborationIndex,
    responsivenessRating: dbMetric.responsivenessRating,
    clarityScore: dbMetric.clarityScore,
  };
}

function toAlert(dbAlert: SelectAlert): any {
  return {
    id: dbAlert.id,
    userId: dbAlert.userId,
    managerId: dbAlert.managerId,
    type: dbAlert.type,
    severity: dbAlert.severity,
    message: dbAlert.message,
    createdAt: new Date(dbAlert.createdAt),
    resolved: dbAlert.resolved,
  };
}

export class PostgresStorage implements IStorage {
  // User operations
  async getUser(id: string) {
    const results = await db.select().from(users).where(eq(users.id, id));
    return results[0] ? toUser(results[0]) : undefined;
  }

  async getUserByEmail(email: string) {
    const results = await db.select().from(users).where(eq(users.email, email));
    return results[0] ? toUser(results[0]) : undefined;
  }

  async createUser(insertUser: InsertUser) {
    const results = await db.insert(users).values(insertUser).returning();
    return toUser(results[0]);
  }

  async getAllUsers() {
    const results = await db.select().from(users);
    return results.map(toUser);
  }

  // Team operations
  async getTeam(id: string) {
    const results = await db.select().from(teams).where(eq(teams.id, id));
    return results[0] ? toTeam(results[0]) : undefined;
  }

  async createTeam(insertTeam: InsertTeam) {
    const results = await db.insert(teams).values(insertTeam).returning();
    return toTeam(results[0]);
  }

  async getAllTeams() {
    const results = await db.select().from(teams);
    return results.map(toTeam);
  }

  // Communication operations
  async getCommunication(id: string) {
    const results = await db.select().from(communications).where(eq(communications.id, id));
    return results[0] ? toCommunication(results[0]) : undefined;
  }

  async createCommunication(insertCommunication: InsertCommunication) {
    const results = await db.insert(communications).values({
      ...insertCommunication,
      sentimentScore: insertCommunication.sentimentScore.toString(),
    }).returning();
    return toCommunication(results[0]);
  }

  async getCommunicationsByUser(userId: string) {
    const results = await db.select().from(communications)
      .where(
        or(
          eq(communications.senderId, userId),
          eq(communications.recipientId, userId)
        )
      );
    return results.map(toCommunication);
  }

  async getCommunicationsBetweenUsers(userId1: string, userId2: string) {
    const results = await db.select().from(communications)
      .where(
        or(
          and(eq(communications.senderId, userId1), eq(communications.recipientId, userId2)),
          and(eq(communications.senderId, userId2), eq(communications.recipientId, userId1))
        )
      );
    return results.map(toCommunication);
  }

  async getAllCommunications() {
    const results = await db.select().from(communications);
    return results.map(toCommunication);
  }

  // Metric operations
  async getMetric(id: string) {
    const results = await db.select().from(metrics).where(eq(metrics.id, id));
    return results[0] ? toMetric(results[0]) : undefined;
  }

  async createMetric(insertMetric: InsertMetric) {
    const results = await db.insert(metrics).values(insertMetric).returning();
    return toMetric(results[0]);
  }

  async getMetricsByUser(userId: string) {
    const results = await db.select().from(metrics)
      .where(eq(metrics.userId, userId))
      .orderBy(desc(metrics.date));
    return results.map(toMetric);
  }

  async getLatestMetricByUser(userId: string) {
    const results = await db.select().from(metrics)
      .where(eq(metrics.userId, userId))
      .orderBy(desc(metrics.date))
      .limit(1);
    return results[0] ? toMetric(results[0]) : undefined;
  }

  // Alert operations
  async getAlert(id: string) {
    const results = await db.select().from(alerts).where(eq(alerts.id, id));
    return results[0] ? toAlert(results[0]) : undefined;
  }

  async createAlert(insertAlert: InsertAlert) {
    const results = await db.insert(alerts).values(insertAlert).returning();
    return toAlert(results[0]);
  }

  async getAlertsByManager(managerId: string) {
    const results = await db.select().from(alerts)
      .where(and(eq(alerts.managerId, managerId), eq(alerts.resolved, false)))
      .orderBy(desc(alerts.createdAt));
    return results.map(toAlert);
  }

  async getAlertsByUser(userId: string) {
    const results = await db.select().from(alerts)
      .where(eq(alerts.userId, userId))
      .orderBy(desc(alerts.createdAt));
    return results.map(toAlert);
  }

  async resolveAlert(id: string) {
    await db.update(alerts)
      .set({ resolved: true })
      .where(eq(alerts.id, id));
  }

  // Threshold operations
  async getThresholds() {
    const results = await db.select().from(thresholds).limit(1);
    if (results.length === 0) {
      // Create default thresholds if they don't exist
      const defaultThresholds = {
        performanceDropThreshold: 15,
        burnoutThreshold: 70,
        engagementThreshold: 40,
      };
      await db.insert(thresholds).values(defaultThresholds);
      return defaultThresholds;
    }
    return {
      performanceDropThreshold: results[0].performanceDropThreshold,
      burnoutThreshold: results[0].burnoutThreshold,
      engagementThreshold: results[0].engagementThreshold,
    };
  }

  async updateThresholds(newThresholds: { performanceDropThreshold: number; burnoutThreshold: number; engagementThreshold: number }) {
    const existing = await db.select().from(thresholds).limit(1);
    if (existing.length === 0) {
      await db.insert(thresholds).values(newThresholds);
    } else {
      await db.update(thresholds)
        .set(newThresholds)
        .where(eq(thresholds.id, existing[0].id));
    }
  }
}

export const storage = new PostgresStorage();
