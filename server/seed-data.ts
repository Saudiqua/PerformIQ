import { storage } from "./pg-storage";
import bcrypt from "bcryptjs";

const FIRST_NAMES = ["John", "Sarah", "Michael", "Emily", "David", "Jessica", "James", "Lisa", "Robert", "Maria", "William", "Jennifer", "Richard", "Linda", "Thomas", "Patricia", "Daniel", "Susan", "Matthew", "Karen"];
const LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"];

const DEPARTMENTS = ["Engineering", "Marketing", "Sales"];
const TEAMS = [
  { name: "Team Alpha", department: "Engineering" },
  { name: "Team Beta", department: "Marketing" },
  { name: "Team Gamma", department: "Sales" },
];

const EMAIL_SUBJECTS = [
  "Project Update",
  "Quick Question",
  "Meeting Follow-up",
  "Weekly Sync",
  "Design Review",
  "Code Review Request",
  "Sprint Planning",
  "Bug Report",
  "Feature Request",
  "Performance Metrics",
  "Client Feedback",
  "Team Lunch",
  "Monthly Report",
  "Quarterly Goals",
  "Budget Approval",
];

const SLACK_CONTEXTS = [
  "Hey, can you take a look at this?",
  "Thanks for the update!",
  "Let's discuss this in our 1:1",
  "Great work on the presentation",
  "I'll have that ready by EOD",
  "Can we schedule a quick call?",
  "Perfect, that makes sense",
  "I'm working on it now",
  "Just pushed the changes",
  "Need any help with that?",
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateEmail(): string {
  const first = randomElement(FIRST_NAMES).toLowerCase();
  const last = randomElement(LAST_NAMES).toLowerCase();
  return `${first}.${last}@company.com`;
}

function generateAvatar(name: string): string {
  const initials = name.split(" ").map(n => n[0]).join("");
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=128`;
}

export async function seedData() {
  console.log("Seeding data...");

  const hashedPassword = await bcrypt.hash("demo123", 10);

  // Create teams if they don't exist
  const teamIds: string[] = [];
  const existingTeams = await storage.getAllTeams();
  if (existingTeams.length === 0) {
    console.log("Creating teams...");
    for (const teamData of TEAMS) {
      const team = await storage.createTeam(teamData);
      teamIds.push(team.id);
    }
  } else {
    console.log("Teams already exist, using existing teams");
    for (const team of existingTeams) {
      teamIds.push(team.id);
    }
  }

  // Check if users already exist
  let existingUsers = await storage.getAllUsers();
  let employees: string[] = [];
  let managerIds: string[] = [];

  if (existingUsers.length === 0) {
    console.log("Creating users...");
    
    // Create managers (one per team)
    for (let i = 0; i < 3; i++) {
      const name = `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
      const manager = await storage.createUser({
        email: i === 0 ? "manager@demo.com" : generateEmail(),
        password: hashedPassword,
        role: "manager",
        name: name,
        teamId: teamIds[i],
        managerId: null,
        avatarUrl: generateAvatar(name),
      });
      managerIds.push(manager.id);
    }

    // Create admin
    await storage.createUser({
      email: "admin@demo.com",
      password: hashedPassword,
      role: "admin",
      name: "Admin User",
      teamId: teamIds[0],
      managerId: null,
      avatarUrl: generateAvatar("Admin User"),
    });
  } else {
    console.log("Users already exist, using existing users");
    // Get existing managers and employees
    for (const user of existingUsers) {
      if (user.role === "manager") {
        managerIds.push(user.id);
      } else if (user.role === "employee") {
        employees.push(user.id);
      }
    }
  }

  // Create employees and metrics only if users don't exist yet
  if (existingUsers.length === 0) {
    console.log("Creating employees with metrics...");
    
    // Pattern definitions
    const patterns = [
      { type: "high", count: 3, baseScore: 85, variance: 5 },
      { type: "struggling", count: 3, baseScore: 45, variance: 5 },
      { type: "recent_drop", count: 1, baseScore: 70, variance: 10 },
      { type: "burnout", count: 1, baseScore: 55, variance: 8 },
      { type: "average", count: 12, baseScore: 68, variance: 8 },
    ];

    let employeeIndex = 0;
    for (const pattern of patterns) {
      for (let i = 0; i < pattern.count; i++) {
        const teamIndex = employeeIndex % 3;
        const name = `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`;
        
        const employee = await storage.createUser({
          email: employeeIndex === 0 ? "employee@demo.com" : generateEmail(),
          password: hashedPassword,
          role: "employee",
          name: name,
          teamId: teamIds[teamIndex],
          managerId: managerIds[teamIndex],
          avatarUrl: generateAvatar(name),
        });
        employees.push(employee.id);

        // Generate metrics for past 12 weeks
        const now = new Date();
        for (let week = 11; week >= 0; week--) {
          const date = new Date(now);
          date.setDate(date.getDate() - (week * 7));

          let initiativeScore = pattern.baseScore + randomFloat(-pattern.variance, pattern.variance);
          let collaborationScore = pattern.baseScore + randomFloat(-pattern.variance, pattern.variance);
          let responsivenessScore = pattern.baseScore + randomFloat(-pattern.variance, pattern.variance);
          let clarityScore = pattern.baseScore + randomFloat(-pattern.variance, pattern.variance);

          // Apply pattern-specific adjustments
          if (pattern.type === "recent_drop" && week < 2) {
            initiativeScore -= 20;
            collaborationScore -= 15;
            responsivenessScore -= 25;
          }

          if (pattern.type === "burnout") {
            responsivenessScore = Math.max(30, responsivenessScore - (11 - week) * 2);
          }

          await storage.createMetric({
            userId: employee.id,
            date: date,
            initiativeScore: Math.round(Math.max(0, Math.min(100, initiativeScore))),
            collaborationIndex: Math.round(Math.max(0, Math.min(100, collaborationScore))),
            responsivenessRating: Math.round(Math.max(0, Math.min(100, responsivenessScore))),
            clarityScore: Math.round(Math.max(0, Math.min(100, clarityScore))),
          });
        }

        employeeIndex++;
      }
    }
  }

  // Generate communications only if they don't exist
  const existingCommunications = await storage.getAllCommunications();
  if (existingCommunications.length === 0) {
    console.log("Creating communications...");
    const allUsers = await storage.getAllUsers();
    const communicationCount = 1200;
    
    for (let i = 0; i < communicationCount; i++) {
      const sender = randomElement(allUsers);
      let recipient = randomElement(allUsers);
      while (recipient.id === sender.id) {
        recipient = randomElement(allUsers);
      }

      const daysAgo = randomInt(0, 90);
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(randomInt(8, 18), randomInt(0, 59));

      const platform = Math.random() > 0.5 ? "email" : "slack";
      const subject = platform === "email" ? randomElement(EMAIL_SUBJECTS) : "";
      const content = randomElement(SLACK_CONTEXTS);
      
      // Sentiment varies by user pattern
      let sentimentScore = randomFloat(-0.2, 0.6);
      
      await storage.createCommunication({
        senderId: sender.id,
        recipientId: recipient.id,
        platform: platform as "email" | "slack",
        timestamp: timestamp,
        subject: subject,
        content: content,
        sentimentScore: Math.max(-1, Math.min(1, sentimentScore)),
      });
    }
  } else {
    console.log(`Communications already exist (${existingCommunications.length} found)`);
  }

  // Generate alerts only if they don't exist
  const existingAlerts = managerIds.length > 0 ? await storage.getAlertsByManager(managerIds[0]) : [];
  if (existingAlerts.length === 0 && employees.length > 0) {
    console.log("Creating alerts...");
    const allMetrics = [];
    for (const userId of employees) {
      const metrics = await storage.getMetricsByUser(userId);
      if (metrics.length > 0) {
        allMetrics.push({ userId, metrics });
      }
    }

    for (const { userId, metrics } of allMetrics) {
      const user = await storage.getUser(userId);
      if (!user || !user.managerId) continue;

      const latest = metrics[0];
      const avgScore = (latest.initiativeScore + latest.collaborationIndex + latest.responsivenessRating + latest.clarityScore) / 4;

      if (avgScore < 50) {
        await storage.createAlert({
          userId: user.id,
          managerId: user.managerId,
          type: "low_engagement",
          severity: "high",
          message: `${user.name}'s performance is consistently below expectations (score: ${avgScore.toFixed(0)})`,
          createdAt: new Date(),
          resolved: false,
        });
      }

      if (metrics.length > 1) {
        const previous = metrics[1];
        const prevAvg = (previous.initiativeScore + previous.collaborationIndex + previous.responsivenessRating + previous.clarityScore) / 4;
        const drop = prevAvg - avgScore;

        if (drop > 15) {
          await storage.createAlert({
            userId: user.id,
            managerId: user.managerId,
            type: "performance_drop",
            severity: "high",
            message: `${user.name}'s performance dropped ${drop.toFixed(0)}% this week`,
            createdAt: new Date(),
            resolved: false,
          });
        }
      }

      if (latest.responsivenessRating < 40) {
        await storage.createAlert({
          userId: user.id,
          managerId: user.managerId,
          type: "burnout_signal",
          severity: "medium",
          message: `${user.name} showing potential burnout signals (low responsiveness)`,
          createdAt: new Date(),
          resolved: false,
        });
      }
    }
  } else {
    console.log(`Alerts already exist or no employees to check (${existingAlerts.length} alerts found)`);
  }

  // Final summary
  const finalUsers = await storage.getAllUsers();
  const finalComms = await storage.getAllCommunications();
  const finalAlerts = managerIds.length > 0 ? await storage.getAlertsByManager(managerIds[0]) : [];
  
  console.log("Data seeding complete!");
  console.log(`Total users: ${finalUsers.length}`);
  console.log(`Total communications: ${finalComms.length}`);
  console.log(`Alerts for first manager: ${finalAlerts.length}`);
}
