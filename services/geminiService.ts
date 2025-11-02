
import { GoogleGenAI, Type } from "@google/genai";
import { PlayerStats } from "../types";

// Ensure you have a .env file with your API_KEY
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("Gemini API key not found. Player stat generation will be disabled. Please set the API_KEY environment variable.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generatePlayerStats = async (tournamentName: string, playerName: string): Promise<PlayerStats> => {
  if (!API_KEY) {
    return { matchesPlayed: 0, totalScore: 0, totalWickets: 0 };
  }
  try {
    const prompt = `
      For a professional cricket tournament called "${tournamentName}", generate plausible career statistics for a player named "${playerName}".
      Provide values for 'Matches Played', 'Total Score' (for a batsman) or 'Total Wickets' (for a bowler).
      A player can have a non-zero value for both score and wickets.
      The values should be realistic for a professional player.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            matchesPlayed: { type: Type.INTEGER, description: "Total number of matches played." },
            totalScore: { type: Type.INTEGER, description: "Total career score (runs)." },
            totalWickets: { type: Type.INTEGER, description: "Total career wickets taken." },
          },
          required: ['matchesPlayed', 'totalScore', 'totalWickets']
        },
      },
    });

    const jsonText = response.text;
    const parsedJson = JSON.parse(jsonText);

    return {
      matchesPlayed: parsedJson.matchesPlayed,
      totalScore: parsedJson.totalScore,
      totalWickets: parsedJson.totalWickets
    };

  } catch (error) {
    console.error("Error generating player stats with Gemini:", error);
    // Return fallback stats on error
    return { matchesPlayed: 0, totalScore: 0, totalWickets: 0 };
  }
};