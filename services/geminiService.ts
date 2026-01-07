import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryParams, GeneratedStory, StoryDialect } from "../types";

const SYSTEM_INSTRUCTION = `
You are 'Al-Hakawati', a wise, warm, and magical Syrian storyteller. 
Your goal is to create short, engaging, and culturally rich stories for children.
The stories should be visually descriptive to help generating images later.
The style should be 'Neo-Heritage' - mixing traditional wisdom with modern clarity.
Ensure the content is absolutely safe, positive, and educational.
`;

export const generateStoryText = async (params: StoryParams): Promise<GeneratedStory> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  const dialectInstruction = params.dialect === StoryDialect.SYRIAN
    ? "Write the dialogue and narration in a warm, polite Damascus Syrian dialect (Shami)."
    : "Write in simple, accessible Modern Standard Arabic (Fusha).";

  const moralInstruction = params.moral 
    ? `The moral of the story revolves around: ${params.moral}.` 
    : "Choose a suitable positive moral for a child (e.g., honesty, kindness, or curiosity) and build the story around it.";

  const prompt = `
    Create a children's story for ${params.childName}, who is ${params.age} years old.
    ${moralInstruction}
    ${dialectInstruction}
    
    Structure the story into exactly 4 pages (scenes).
    For each page, provide the story text and a detailed English description for an illustration (image_prompt).
    The image style should be "warm digital oil painting, magical realism, golden lighting, Damascene architecture details".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            pages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["text", "imagePrompt"]
              }
            }
          },
          required: ["title", "pages"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as GeneratedStory;
  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

export const generateSceneImage = async (imagePrompt: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  // FORCE FREE TIER MODEL ONLY
  // We use 'gemini-2.5-flash-image' specifically because it has the most generous free tier limits.
  // We strictly avoid 'pro' or 'imagen' models to prevent 429/404 errors on free accounts.
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { 
            text: `Illustration for children's book. Style: Warm digital oil painting, vibrant colors. Scene: ${imagePrompt}` 
          }
        ],
      },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    throw new Error("No image data returned from Gemini Flash");

  } catch (e) {
    console.error("Gemini Flash Image Generation Failed:", e);
    throw e;
  }
};

export const getFallbackImage = () => {
    const fallbacks = [
        "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop", // Gold sunset
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop", // Beach
        "https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?q=80&w=1000&auto=format&fit=crop", // Forest
        "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1000&auto=format&fit=crop"  // Mountains
    ];
    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};

export const generateSpeech = async (text: string): Promise<string> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, 
            },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
}