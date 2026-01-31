import { GoogleGenAI, Type } from "@google/genai";
import { StellarCategory, SimulationAnalysis, StellarBody } from '../types';

// NOTE: API key must be provided via process.env.API_KEY
// In this simulated environment, we assume it's available.

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchRealObjectData = async (query: string): Promise<{ name: string; mass: number; radius: number; category: StellarCategory; description: string } | null> => {
  try {
    const prompt = `Find the mass (in kg) and radius (in km) and type of the stellar object "${query}". 
    Return a short description (max 20 words).
    Then output the data strictly in the following format (do not use JSON, just text lines):
    Name: [name]
    MassKG: [value in scientific notation e.g. 5.97e24]
    RadiusKM: [value]
    Type: [closest match from list: Asteroid, Moon, Planet, Star, Black Hole, etc]
    Description: [text]`;

    const result = await genAI.models.generateContent({ 
      model: "gemini-2.0-flash-exp",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }] 
      }
    });

    const text = result.text || "";
    
    // Naive parsing for robustness without JSON schema overhead for simple search
    const lines = text.split('\n');
    let name = query;
    let massKg = 5.97e24;
    let radiusKm = 6371;
    let type = StellarCategory.PLANET;
    let description = "A stellar object.";

    lines.forEach(line => {
      if (line.startsWith('Name:')) name = line.replace('Name:', '').trim();
      if (line.startsWith('MassKG:')) massKg = parseFloat(line.replace('MassKG:', '').trim());
      if (line.startsWith('RadiusKM:')) radiusKm = parseFloat(line.replace('RadiusKM:', '').trim());
      if (line.startsWith('Type:')) {
        const rawType = line.replace('Type:', '').trim();
        // Simple mapping attempt
        const foundCategory = Object.values(StellarCategory).find(c => rawType.toLowerCase().includes(c.toLowerCase()));
        if (foundCategory) type = foundCategory;
      }
      if (line.startsWith('Description:')) description = line.replace('Description:', '').trim();
    });

    // Convert to relative units for simulation (Earth = 5.97e24 kg, 6371 km)
    // Applying a logarithmic compression for visual usability in the app
    const earthMass = 5.97e24;
    const earthRadius = 6371;
    
    // Heuristic scaling for the simulation
    const simMass = (Math.log10(massKg) / Math.log10(earthMass)) * 20; 
    const simRadius = (Math.log10(radiusKm) / Math.log10(earthRadius)) * 15;

    return {
      name,
      mass: Math.max(1, simMass),
      radius: Math.max(2, simRadius),
      category: type,
      description
    };

  } catch (error) {
    console.error("Gemini Search Error:", error);
    return null;
  }
};

export const analyzeSimulationStability = async (bodies: StellarBody[]): Promise<SimulationAnalysis> => {
  try {
    // Summarize the system for the model
    const systemDesc = bodies.map(b => 
      `${b.name} (${b.category}): Mass ${b.mass.toFixed(1)}, Pos(${b.position.x.toFixed(0)}, ${b.position.y.toFixed(0)})`
    ).join('\n');

    const prompt = `Analyze this gravity simulation system state for stability and potential interesting interactions.
    System Objects:
    ${systemDesc}

    Simulate mentally what happens next.
    Output a JSON object with:
    - stabilityScore (0-100, where 100 is perfectly stable)
    - prediction (Short paragraph describing future interactions, e.g., collisions, ejections)
    - notableInteractions (Array of strings, e.g., "Planet A orbits Black Hole B")
    `;

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-thinking-exp",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 32768 } // High budget for physics reasoning
      }
    });

    const responseText = result.text || "{}";
    try {
      return JSON.parse(responseText) as SimulationAnalysis;
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", parseError);
      return {
        stabilityScore: 50,
        prediction: "Analysis unavailable. Proceed with caution.",
        notableInteractions: []
      };
    }

  } catch (error) {
    console.error("Gemini Thinking Error:", error);
    return {
      stabilityScore: 50,
      prediction: "Analysis unavailable. Proceed with caution.",
      notableInteractions: []
    };
  }
};

export const generateAnomaly = async (): Promise<StellarBody | null> => {
  try {
    const prompt = `Create a fictional, scientifically plausible "Cosmic Anomaly" stellar object.
    Give it a creative name, a weird description, a mass (100-50000 scale), a radius (10-200 scale), and a hex color code.
    Return JSON.
    `;

    const result = await genAI.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: prompt,
        config: {
            responseMimeType: "application/json"
        }
    });
    
    try {
      const data = JSON.parse(result.text || "{}");
      
      return {
          id: crypto.randomUUID(),
          name: data.name || "Unknown Anomaly",
          category: StellarCategory.ANOMALY,
          mass: data.mass || 1000,
          radius: data.radius || 50,
          position: { x: 0, y: 0 },
          velocity: { x: 0, y: 0 },
          color: data.color || "#00FF00",
          trail: [],
          description: data.description
      };
    } catch (parseError) {
      console.error("Failed to parse anomaly data:", parseError);
      return null;
    }
  } catch (e) {
      console.error(e);
      return null;
  }
}