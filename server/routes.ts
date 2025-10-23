import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./pg-storage";
import { seedData } from "./seed-data";
import { generateToken, authMiddleware, AuthRequest } from "./auth";
import { generateEmployeeInsights, generatePerformanceSummary } from "./openai-service";
import bcrypt from "bcryptjs";
import { loginSchema, signupSchema, EmployeeDashboardData, ManagerDashboardData, EmployeeDeepDiveData, AdminData, AuthResponse } from "@shared/schema";

let isDataSeeded = false;

async function ensureDataSeeded() {
  if (!isDataSeeded) {
    await seedData();
    isDataSeeded = true;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure data is seeded on startup
  await ensureDataSeeded();

  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = generateToken(user);
      const response: AuthResponse = {
        token,
        user: { ...user, password: "" },
      };

      res.json(response);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, name, role } = signupSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const teams = await storage.getAllTeams();
      const randomTeam = teams[Math.floor(Math.random() * teams.length)];

      const user = await storage.createUser({
        email,
        password: hashedPassword,
        name,
        role,
        teamId: randomTeam.id,
        managerId: null,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`,
      });

      const token = generateToken(user);
      const response: AuthResponse = {
        token,
        user: { ...user, password: "" },
      };

      res.json(response);
    } catch (error) {
      res.status(400).json({ message: "Invalid request" });
    }
  });

  // Employee Dashboard
  app.get("/api/employee/dashboard", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Get metrics
      const metrics = await storage.getMetricsByUser(userId);
      const latestMetric = metrics[0];
      const previousMetric = metrics[1];

      // Calculate performance score
      const performanceScore = latestMetric 
        ? (latestMetric.initiativeScore + latestMetric.collaborationIndex + latestMetric.responsivenessRating + latestMetric.clarityScore) / 4
        : 0;

      const prevScore = previousMetric
        ? (previousMetric.initiativeScore + previousMetric.collaborationIndex + previousMetric.responsivenessRating + previousMetric.clarityScore) / 4
        : performanceScore;

      const performanceTrend = prevScore > 0 ? ((performanceScore - prevScore) / prevScore) * 100 : 0;

      // Get communications
      const communications = await storage.getCommunicationsByUser(userId);
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      const thisWeekComms = communications.filter(c => c.timestamp >= oneWeekAgo);
      const lastWeekComms = communications.filter(c => c.timestamp >= twoWeeksAgo && c.timestamp < oneWeekAgo);

      // Calculate response time
      const sentMessages = communications.filter(c => c.senderId === userId);
      const responseTimes: number[] = [];
      for (const sent of sentMessages) {
        const responses = communications.filter(c => 
          c.senderId === sent.recipientId && 
          c.recipientId === userId &&
          c.timestamp > sent.timestamp &&
          c.timestamp.getTime() - sent.timestamp.getTime() < 48 * 60 * 60 * 1000
        );
        if (responses.length > 0) {
          const responseTime = (responses[0].timestamp.getTime() - sent.timestamp.getTime()) / (1000 * 60 * 60);
          responseTimes.push(responseTime);
        }
      }
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 8;

      // Team average response time (mock)
      const teamAvgResponseTime = avgResponseTime * (0.9 + Math.random() * 0.2);

      // Sentiment breakdown
      const positiveSentiment = communications.filter(c => c.sentimentScore > 0.3).length;
      const negativeSentiment = communications.filter(c => c.sentimentScore < -0.3).length;
      const neutralSentiment = communications.length - positiveSentiment - negativeSentiment;

      const sentimentBreakdown = {
        positive: communications.length > 0 ? Math.round((positiveSentiment / communications.length) * 100) : 33,
        neutral: communications.length > 0 ? Math.round((neutralSentiment / communications.length) * 100) : 34,
        negative: communications.length > 0 ? Math.round((negativeSentiment / communications.length) * 100) : 33,
      };

      // Top collaborators
      const collaboratorMap = new Map<string, number>();
      for (const comm of communications) {
        const otherId = comm.senderId === userId ? comm.recipientId : comm.senderId;
        collaboratorMap.set(otherId, (collaboratorMap.get(otherId) || 0) + 1);
      }

      const topCollaborators = await Promise.all(
        Array.from(collaboratorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(async ([userId, count]) => {
            const user = await storage.getUser(userId);
            return {
              userId,
              name: user?.name || "Unknown",
              avatarUrl: user?.avatarUrl || "",
              messageCount: count,
            };
          })
      );

      // Weekly trends (last 12 weeks)
      const weeklyTrends = metrics.slice(0, 12).reverse().map((metric, index) => ({
        week: `W${index + 1}`,
        initiative: metric.initiativeScore,
        collaboration: metric.collaborationIndex,
        responsiveness: metric.responsivenessRating,
        clarity: metric.clarityScore,
      }));

      // AI Insights
      const avgSentiment = communications.length > 0
        ? communications.reduce((sum, c) => sum + c.sentimentScore, 0) / communications.length
        : 0;

      const aiInsights = await generateEmployeeInsights(
        user.name,
        {
          initiative: latestMetric?.initiativeScore || 0,
          collaboration: latestMetric?.collaborationIndex || 0,
          responsiveness: latestMetric?.responsivenessRating || 0,
          clarity: latestMetric?.clarityScore || 0,
        },
        {
          sentimentAvg: avgSentiment,
          responseTime: avgResponseTime,
          messageVolume: thisWeekComms.length,
        }
      );

      const response: EmployeeDashboardData = {
        user: { ...user, password: "" },
        performanceScore,
        performanceTrend,
        communicationStats: {
          avgResponseTime,
          teamAvgResponseTime,
          messagesSentThisWeek: thisWeekComms.filter(c => c.senderId === userId).length,
          messagesReceivedThisWeek: thisWeekComms.filter(c => c.recipientId === userId).length,
          messagesSentLastWeek: lastWeekComms.filter(c => c.senderId === userId).length,
          messagesReceivedLastWeek: lastWeekComms.filter(c => c.recipientId === userId).length,
          sentimentBreakdown,
          topCollaborators,
        },
        metrics: {
          initiative: { 
            current: latestMetric?.initiativeScore || 0, 
            trend: previousMetric ? ((latestMetric.initiativeScore - previousMetric.initiativeScore) / previousMetric.initiativeScore) * 100 : 0 
          },
          collaboration: { 
            current: latestMetric?.collaborationIndex || 0, 
            trend: previousMetric ? ((latestMetric.collaborationIndex - previousMetric.collaborationIndex) / previousMetric.collaborationIndex) * 100 : 0 
          },
          responsiveness: { 
            current: latestMetric?.responsivenessRating || 0, 
            trend: previousMetric ? ((latestMetric.responsivenessRating - previousMetric.responsivenessRating) / previousMetric.responsivenessRating) * 100 : 0 
          },
          clarity: { 
            current: latestMetric?.clarityScore || 0, 
            trend: previousMetric ? ((latestMetric.clarityScore - previousMetric.clarityScore) / previousMetric.clarityScore) * 100 : 0 
          },
        },
        weeklyTrends,
        aiInsights,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching employee dashboard:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manager Dashboard
  app.get("/api/manager/dashboard", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const managerId = req.user!.id;
      
      // Get team members
      const allUsers = await storage.getAllUsers();
      const teamMembers = allUsers.filter(u => u.managerId === managerId);

      // Calculate team health
      const memberScores = await Promise.all(
        teamMembers.map(async (member) => {
          const metrics = await storage.getMetricsByUser(member.id);
          const latestMetric = metrics[0];
          const previousMetric = metrics[1];
          
          const score = latestMetric
            ? (latestMetric.initiativeScore + latestMetric.collaborationIndex + latestMetric.responsivenessRating + latestMetric.clarityScore) / 4
            : 0;

          const prevScore = previousMetric
            ? (previousMetric.initiativeScore + previousMetric.collaborationIndex + previousMetric.responsivenessRating + previousMetric.clarityScore) / 4
            : score;

          const trend = prevScore > 0 ? ((score - prevScore) / prevScore) * 100 : 0;
          const trendDirection = trend > 2 ? "up" : trend < -2 ? "down" : "stable";

          const communications = await storage.getCommunicationsByUser(member.id);
          const avgSentiment = communications.length > 0
            ? communications.reduce((sum, c) => sum + c.sentimentScore, 0) / communications.length
            : 0;

          const alerts = await storage.getAlertsByUser(member.id);
          const hasAlert = alerts.some(a => !a.resolved);

          return {
            id: member.id,
            name: member.name,
            avatarUrl: member.avatarUrl,
            performanceScore: score,
            trend: trendDirection,
            trendPercentage: trend,
            hasAlert,
            responseTime: 2 + Math.random() * 6,
            sentiment: avgSentiment,
            activityLevel: communications.filter(c => {
              const oneWeekAgo = new Date();
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              return c.timestamp >= oneWeekAgo;
            }).length,
          };
        })
      );

      const overallScore = memberScores.length > 0
        ? memberScores.reduce((sum, m) => sum + m.performanceScore, 0) / memberScores.length
        : 0;

      const highPerformers = memberScores.filter(m => m.performanceScore >= 75).length;
      const averagePerformers = memberScores.filter(m => m.performanceScore >= 50 && m.performanceScore < 75).length;
      const needsAttention = memberScores.filter(m => m.performanceScore < 50).length;

      const status = overallScore >= 75 ? "green" : overallScore >= 60 ? "yellow" : "red";

      // Get alerts
      const alerts = await storage.getAlertsByManager(managerId);

      // Team analytics
      const allTeamComms = (await Promise.all(
        teamMembers.map(m => storage.getCommunicationsByUser(m.id))
      )).flat();

      const last30Days = new Date();
      last30Days.setDate(last30Days.getDate() - 30);
      const recentComms = allTeamComms.filter(c => c.timestamp >= last30Days);

      // Sentiment trend (last 10 data points)
      const sentimentTrend = [];
      for (let i = 9; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i * 3);
        const startDate = new Date(date);
        startDate.setDate(startDate.getDate() - 3);
        
        const periodComms = recentComms.filter(c => c.timestamp >= startDate && c.timestamp < date);
        const avgSentiment = periodComms.length > 0
          ? periodComms.reduce((sum, c) => sum + c.sentimentScore, 0) / periodComms.length
          : 0;

        sentimentTrend.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sentiment: (avgSentiment + 1) / 2, // Normalize to 0-1
        });
      }

      // Workload distribution
      const workloadDistribution = memberScores.map(m => ({
        userId: m.id,
        name: m.name,
        messageCount: m.activityLevel,
      }));

      const response: ManagerDashboardData = {
        teamHealth: {
          overallScore,
          status,
          highPerformers,
          averagePerformers,
          needsAttention,
          alertCount: alerts.length,
        },
        teamMembers: memberScores,
        alerts,
        teamAnalytics: {
          sentimentTrend,
          workloadDistribution,
        },
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching manager dashboard:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Employee Deep Dive
  app.get("/api/manager/employee/:id", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const employeeId = req.params.id;
      const employee = await storage.getUser(employeeId);
      
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }

      const metrics = await storage.getMetricsByUser(employeeId);
      const latestMetric = metrics[0];

      const performanceScore = latestMetric
        ? (latestMetric.initiativeScore + latestMetric.collaborationIndex + latestMetric.responsivenessRating + latestMetric.clarityScore) / 4
        : 0;

      // Get 3-month trends
      const trends = metrics.slice(0, 12).reverse().map(m => ({
        date: m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        initiative: m.initiativeScore,
        collaboration: m.collaborationIndex,
        responsiveness: m.responsivenessRating,
      }));

      // Get communication examples
      const communications = await storage.getCommunicationsByUser(employeeId);
      const communicationExamples = communications.slice(0, 4).map(c => ({
        platform: c.platform,
        snippet: c.content.slice(0, 100),
        sentiment: c.sentimentScore,
        timestamp: c.timestamp,
      }));

      // Generate AI summary
      const aiSummary = await generatePerformanceSummary(
        employee.name,
        {
          initiative: latestMetric?.initiativeScore || 0,
          collaboration: latestMetric?.collaborationIndex || 0,
          responsiveness: latestMetric?.responsivenessRating || 0,
        },
        `Recent trend shows ${performanceScore >= 70 ? "strong" : "developing"} performance`,
        communicationExamples.map(c => `${c.platform}: ${c.sentiment > 0 ? "positive" : c.sentiment < 0 ? "negative" : "neutral"}`)
      );

      const response: EmployeeDeepDiveData = {
        employee: { ...employee, password: "" },
        performanceScore,
        metrics: {
          initiative: latestMetric?.initiativeScore || 0,
          collaboration: latestMetric?.collaborationIndex || 0,
          responsiveness: latestMetric?.responsivenessRating || 0,
        },
        trends,
        communicationExamples,
        aiSummary: aiSummary.summary,
        talkingPoints: aiSummary.talkingPoints,
        recommendations: aiSummary.recommendations,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching employee deep dive:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Users
  app.get("/api/admin/users", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const users = (await storage.getAllUsers()).map(u => ({ ...u, password: "" }));
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin Analytics
  app.get("/api/admin/analytics", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const communications = await storage.getAllCommunications();
      
      const allMetrics = await Promise.all(
        users.map(u => storage.getLatestMetricByUser(u.id))
      );
      const validMetrics = allMetrics.filter(m => m !== undefined);
      const avgPerformanceScore = validMetrics.length > 0
        ? validMetrics.reduce((sum, m) => sum + (m!.initiativeScore + m!.collaborationIndex + m!.responsivenessRating + m!.clarityScore) / 4, 0) / validMetrics.length
        : 0;

      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      
      let alertsThisWeek = 0;
      for (const user of users.filter(u => u.role === "manager")) {
        const alerts = await storage.getAlertsByManager(user.id);
        alertsThisWeek += alerts.filter(a => a.createdAt >= oneWeekAgo).length;
      }

      const response = {
        totalUsers: users.length,
        totalCommunications: communications.length,
        avgPerformanceScore,
        alertsThisWeek,
      };

      res.json(response);
    } catch (error) {
      console.error("Error fetching admin analytics:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get thresholds
  app.get("/api/admin/thresholds", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const thresholds = await storage.getThresholds();
      res.json(thresholds);
    } catch (error) {
      console.error("Error fetching thresholds:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update thresholds
  app.put("/api/admin/thresholds", authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { performanceDropThreshold, burnoutThreshold, engagementThreshold } = req.body;
      
      await storage.updateThresholds({
        performanceDropThreshold,
        burnoutThreshold,
        engagementThreshold,
      });

      res.json({ message: "Thresholds updated successfully" });
    } catch (error) {
      console.error("Error updating thresholds:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
