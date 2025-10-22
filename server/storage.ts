import { 
  User, InsertUser, 
  Team, InsertTeam, 
  Communication, InsertCommunication,
  Metric, InsertMetric,
  Alert, InsertAlert
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Team operations
  getTeam(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  getAllTeams(): Promise<Team[]>;

  // Communication operations
  getCommunication(id: string): Promise<Communication | undefined>;
  createCommunication(communication: InsertCommunication): Promise<Communication>;
  getCommunicationsByUser(userId: string): Promise<Communication[]>;
  getCommunicationsBetweenUsers(userId1: string, userId2: string): Promise<Communication[]>;
  getAllCommunications(): Promise<Communication[]>;

  // Metric operations
  getMetric(id: string): Promise<Metric | undefined>;
  createMetric(metric: InsertMetric): Promise<Metric>;
  getMetricsByUser(userId: string): Promise<Metric[]>;
  getLatestMetricByUser(userId: string): Promise<Metric | undefined>;

  // Alert operations
  getAlert(id: string): Promise<Alert | undefined>;
  createAlert(alert: InsertAlert): Promise<Alert>;
  getAlertsByManager(managerId: string): Promise<Alert[]>;
  getAlertsByUser(userId: string): Promise<Alert[]>;
  resolveAlert(id: string): Promise<void>;

  // Threshold operations
  getThresholds(): Promise<{ performanceDropThreshold: number; burnoutThreshold: number; engagementThreshold: number; }>;
  updateThresholds(thresholds: { performanceDropThreshold: number; burnoutThreshold: number; engagementThreshold: number; }): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private teams: Map<string, Team>;
  private communications: Map<string, Communication>;
  private metrics: Map<string, Metric>;
  private alerts: Map<string, Alert>;
  private thresholds: { performanceDropThreshold: number; burnoutThreshold: number; engagementThreshold: number; };

  constructor() {
    this.users = new Map();
    this.teams = new Map();
    this.communications = new Map();
    this.metrics = new Map();
    this.alerts = new Map();
    this.thresholds = {
      performanceDropThreshold: 15,
      burnoutThreshold: 70,
      engagementThreshold: 40,
    };
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Team operations
  async getTeam(id: string): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async createTeam(insertTeam: InsertTeam): Promise<Team> {
    const id = randomUUID();
    const team: Team = { ...insertTeam, id };
    this.teams.set(id, team);
    return team;
  }

  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  // Communication operations
  async getCommunication(id: string): Promise<Communication | undefined> {
    return this.communications.get(id);
  }

  async createCommunication(insertCommunication: InsertCommunication): Promise<Communication> {
    const id = randomUUID();
    const communication: Communication = { ...insertCommunication, id };
    this.communications.set(id, communication);
    return communication;
  }

  async getCommunicationsByUser(userId: string): Promise<Communication[]> {
    return Array.from(this.communications.values()).filter(
      comm => comm.senderId === userId || comm.recipientId === userId
    );
  }

  async getCommunicationsBetweenUsers(userId1: string, userId2: string): Promise<Communication[]> {
    return Array.from(this.communications.values()).filter(
      comm => 
        (comm.senderId === userId1 && comm.recipientId === userId2) ||
        (comm.senderId === userId2 && comm.recipientId === userId1)
    );
  }

  async getAllCommunications(): Promise<Communication[]> {
    return Array.from(this.communications.values());
  }

  // Metric operations
  async getMetric(id: string): Promise<Metric | undefined> {
    return this.metrics.get(id);
  }

  async createMetric(insertMetric: InsertMetric): Promise<Metric> {
    const id = randomUUID();
    const metric: Metric = { ...insertMetric, id };
    this.metrics.set(id, metric);
    return metric;
  }

  async getMetricsByUser(userId: string): Promise<Metric[]> {
    return Array.from(this.metrics.values())
      .filter(metric => metric.userId === userId)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async getLatestMetricByUser(userId: string): Promise<Metric | undefined> {
    const metrics = await this.getMetricsByUser(userId);
    return metrics[0];
  }

  // Alert operations
  async getAlert(id: string): Promise<Alert | undefined> {
    return this.alerts.get(id);
  }

  async createAlert(insertAlert: InsertAlert): Promise<Alert> {
    const id = randomUUID();
    const alert: Alert = { ...insertAlert, id };
    this.alerts.set(id, alert);
    return alert;
  }

  async getAlertsByManager(managerId: string): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => alert.managerId === managerId && !alert.resolved)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getAlertsByUser(userId: string): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(alert => alert.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async resolveAlert(id: string): Promise<void> {
    const alert = this.alerts.get(id);
    if (alert) {
      alert.resolved = true;
    }
  }

  // Threshold operations
  async getThresholds() {
    return this.thresholds;
  }

  async updateThresholds(thresholds: { performanceDropThreshold: number; burnoutThreshold: number; engagementThreshold: number; }) {
    this.thresholds = thresholds;
  }
}

export const storage = new MemStorage();
