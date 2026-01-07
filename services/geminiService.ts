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

  // Strategy: Try Imagen 3 (High Quality) first, fallback to Gemini 2.5 Flash Image (Speed/Free Tier)
  try {
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
    throw new Error("No image returned from Imagen");

  } catch (error) {
    console.warn("Imagen generation failed, falling back to Gemini Flash Image:", error);
    
    try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-image",
          contents: `Generate an image. Illustration for a children's book. Style: Warm, soft lighting, digital art. Scene: ${imagePrompt}`,
        });

        const candidates = response.candidates;
        if (candidates && candidates[0] && candidates[0].content && candidates[0].content.parts) {
            for(const part of candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
                }
            }
        }
    } catch (fallbackError) {
        console.error("All image generation attempts failed:", fallbackError);
    }
    
    // Final fallback
    return "https://picsum.photos/1024/1024?grayscale";
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