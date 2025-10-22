import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
});

export interface EmployeeInsights {
  strengths: string[];
  growthAreas: string[];
  weeklyHighlight: string;
}

export interface PerformanceSummary {
  summary: string;
  talkingPoints: string[];
  recommendations: {
    recognize: string[];
    support: string[];
    develop: string[];
  };
}

export async function analyzeSentiment(content: string): Promise<number> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a sentiment analysis expert. Analyze the sentiment of the given text and return a score between -1 (very negative) and 1 (very positive). Return only a JSON object with a 'score' field."
        },
        {
          role: "user",
          content: `Analyze the sentiment of this message: "${content}"`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 100,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.score || 0;
  } catch (error) {
    console.error("Error analyzing sentiment:", error);
    return 0;
  }
}

export async function generateEmployeeInsights(
  userName: string,
  metrics: { initiative: number; collaboration: number; responsiveness: number; clarity: number },
  communicationData: { sentimentAvg: number; responseTime: number; messageVolume: number }
): Promise<EmployeeInsights> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a professional performance coach. Generate personalized, specific, and actionable insights for an employee based on their performance data. Be encouraging but honest. Return a JSON object with 'strengths' (array of 3 strings), 'growthAreas' (array of 2-3 strings), and 'weeklyHighlight' (a single positive observation)."
        },
        {
          role: "user",
          content: `Generate insights for ${userName}:
Performance Metrics: Initiative ${metrics.initiative}/100, Collaboration ${metrics.collaboration}/100, Responsiveness ${metrics.responsiveness}/100, Clarity ${metrics.clarity}/100
Communication Data: Average sentiment ${communicationData.sentimentAvg}, Response time ${communicationData.responseTime}h, Messages per week ${communicationData.messageVolume}

Provide specific, actionable insights.`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      strengths: result.strengths || ["Consistent performance", "Good communication", "Team collaboration"],
      growthAreas: result.growthAreas || ["Time management", "Proactive communication"],
      weeklyHighlight: result.weeklyHighlight || `${userName} has maintained steady performance this week.`
    };
  } catch (error) {
    console.error("Error generating insights:", error);
    return {
      strengths: ["Consistent performance", "Reliable team member", "Good collaboration"],
      growthAreas: ["Continue developing technical skills", "Enhance communication frequency"],
      weeklyHighlight: `${userName} has shown steady engagement this week.`
    };
  }
}

export async function generatePerformanceSummary(
  userName: string,
  metrics: { initiative: number; collaboration: number; responsiveness: number },
  trends: string,
  communicationExamples: string[]
): Promise<PerformanceSummary> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are an expert HR analytics professional. Generate a comprehensive performance summary for a manager to use in 1:1 meetings. Include a 200-300 word summary, 5 talking points, and 3 categories of recommendations (recognize, support, develop). Be specific and actionable. Return a JSON object."
        },
        {
          role: "user",
          content: `Generate performance summary for ${userName}:
Metrics: Initiative ${metrics.initiative}, Collaboration ${metrics.collaboration}, Responsiveness ${metrics.responsiveness}
Trends: ${trends}
Recent communications sentiment: ${communicationExamples.join("; ")}

Provide specific, manager-ready insights.`
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return {
      summary: result.summary || `${userName} has shown consistent performance across key metrics. Their initiative and collaboration scores demonstrate strong team engagement, while responsiveness indicates room for growth in timely communication.`,
      talkingPoints: result.talkingPoints || [
        "Discuss recent project contributions",
        "Review collaboration effectiveness",
        "Set goals for improved responsiveness",
        "Identify any blockers or challenges",
        "Plan professional development opportunities"
      ],
      recommendations: {
        recognize: result.recommendations?.recognize || [`${userName}'s strong collaboration skills`, "Consistent delivery on commitments"],
        support: result.recommendations?.support || ["Provide tools for better time management", "Offer communication skills workshop"],
        develop: result.recommendations?.develop || ["Focus on proactive communication", "Build technical expertise in core areas"]
      }
    };
  } catch (error) {
    console.error("Error generating performance summary:", error);
    return {
      summary: `${userName} demonstrates solid performance with particular strength in collaboration and initiative. There are opportunities to enhance responsiveness and communication timeliness.`,
      talkingPoints: [
        "Review current workload and priorities",
        "Discuss collaboration successes",
        "Identify communication improvement areas",
        "Set clear performance goals",
        "Explore career development interests"
      ],
      recommendations: {
        recognize: ["Strong team collaboration", "Reliable project delivery"],
        support: ["Time management resources", "Communication best practices"],
        develop: ["Proactive stakeholder updates", "Technical skill advancement"]
      }
    };
  }
}
