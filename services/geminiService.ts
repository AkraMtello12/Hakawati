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
    
    Structure the story into exactly 4-5 pages (scenes).
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

  // Strategy: 
  // 1. Try 'gemini-2.5-flash-image' FIRST (Standard, widely available, fast).
  // 2. Fallback to 'imagen-3.0-generate-001' (Higher quality but sometimes restricted/gated).
  
  try {
    // Attempt 1: Gemini 2.5 Flash Image
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          { 
            text: `Generate a children's book illustration. Style: Warm digital oil painting, magical, golden lighting. Scene: ${imagePrompt}` 
          }
        ],
      },
      // Note: Do NOT set responseMimeType for image generation models like 2.5-flash-image
    });

    // Iterate through parts to find the image (it might not be the first part)
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    
    // If no image found in response parts, throw to trigger fallback
    throw new Error("No inline image data in Gemini Flash response");

  } catch (flashError) {
    console.warn("Gemini Flash Image failed, falling back to Imagen:", flashError);
    
    try {
        // Attempt 2: Imagen 3 (Fallback)
        const response = await ai.models.generateImages({
            model: "imagen-3.0-generate-001",
            prompt: `Children's book illustration, warm style, digital art, magical atmosphere. Scene: ${imagePrompt}`,
            config: {
                numberOfImages: 1,
                aspectRatio: "16:9",
                outputMimeType: "image/jpeg"
            }
        });

        const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
        if (base64Image) {
            return `data:image/jpeg;base64,${base64Image}`;
        }
        throw new Error("No image returned from Imagen fallback");

    } catch (finalError) {
        console.error("All image generation attempts failed:", finalError);
        // Final fallback placeholder
        return "https://picsum.photos/1024/1024?grayscale&blur=2";
    }
  }
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
              prebuiltVoiceConfig: { voiceName: 'Zephyr' }, // 'Zephyr' is often good for general narration
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