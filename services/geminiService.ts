import { GoogleGenAI, Type, Modality, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { StoryParams, GeneratedStory, StoryDialect } from "../types";

const SYSTEM_INSTRUCTION = `
You are 'Al-Hakawati', a wise, warm, and magical Syrian storyteller. 
Your goal is to create short, engaging, and culturally rich stories for children.
The stories should be visually descriptive to help generating images later.
The style should be 'Neo-Heritage' - mixing traditional wisdom with modern clarity.
Ensure the content is absolutely safe, positive, and educational.
`;

// Safety settings
const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

const MORAL_IMAGES: Record<string, string> = {
  kindness: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000&auto=format&fit=crop", 
  honesty: "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=1000&auto=format&fit=crop", 
  saving: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1000&auto=format&fit=crop", 
  friendship: "https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?q=80&w=1000&auto=format&fit=crop", 
  optimism: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?q=80&w=1000&auto=format&fit=crop", 
};

export const generateStoryText = async (params: StoryParams): Promise<GeneratedStory> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing");

  const ai = new GoogleGenAI({ apiKey });

  const dialectInstruction = params.dialect === StoryDialect.SYRIAN
    ? "Write the dialogue and narration in a warm, polite Damascus Syrian dialect (Shami). Use some traditional words."
    : "Write in simple, accessible Modern Standard Arabic (Fusha). Use some rich vocabulary.";

  const moralInstruction = params.moral 
    ? `The moral of the story revolves around: ${params.moral}.` 
    : "Choose a suitable positive moral for a child.";

  const genderInstruction = params.gender === 'girl' 
    ? "The main character is a little girl. Use feminine pronouns (هي/لها)."
    : "The main character is a little boy. Use masculine pronouns (هو/له).";

  const sidekickInstruction = params.sidekick 
    ? `The child has a loyal companion: a ${params.sidekick}. This companion must be present in the story scenes, reacting to the events in a cute way, but the child remains the hero.`
    : "";

  const worldInstruction = params.world
    ? `SETTING: The story MUST take place in ${params.world}. Adopt the atmosphere, descriptions, and logic of this world completely.`
    : "SETTING: Choose an imaginative setting that best fits the moral and the story events (e.g., a forest, a village, a school, etc.).";

  // Story Length Logic
  let pageCount = 4;
  let lengthDescription = "Standard story length.";
  
  if (params.length === 'short') {
    pageCount = 3;
    lengthDescription = "SHORT, FAST PACED story. Keep descriptions brief and action-oriented. Great for a quick bedtime story.";
  } else if (params.length === 'long') {
    pageCount = 6;
    lengthDescription = "EPIC, DETAILED story. Include rich descriptions, longer dialogues, and deeper character interactions.";
  }

  // CRITICAL: Strict name enforcement
  const prompt = `
    IMPORTANT: The main character's name is "${params.childName}". You MUST use this EXACT name ("${params.childName}") throughout the story. DO NOT change the name or invent a new one.

    Task: Create a children's story for ${params.childName}, who is ${params.age} years old.
    ${genderInstruction}
    ${moralInstruction}
    ${dialectInstruction}
    ${sidekickInstruction}
    ${worldInstruction}
    
    Length & Pacing: ${lengthDescription}
    
    Structure:
    1. **Story**: Exactly ${pageCount} pages (scenes).
    2. **Magic Dictionary**: Identify 3-4 difficult or dialect-heavy words used in the text. Provide their simplified definition in Arabic.
    3. **Moral Choice**: Create a scenario based on the story where the child must make a decision. This should happen conceptually in the middle of the story. Provide 2 options: one correct (leading to the moral) and one incorrect (but understandable mistake).
    4. **Moral Name**: A short 1-2 word title for the badge (e.g., "الصدق", "الأمانة", "مساعدة الغير").
    5. **Hakawati's Bundle (Proverb)**: A traditional Syrian or Arabic proverb (مثل شعبي) that matches the moral of the story perfectly. Include a very simple, cute explanation for a child.

    For each page, provide:
    - 'text': The full story text for that page.
    - 'imagePrompt': English description for illustration.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        safetySettings: SAFETY_SETTINGS,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            moralName: { type: Type.STRING, description: "Short Arabic name of the moral for the badge" },
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
            },
            dictionary: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        word: { type: Type.STRING, description: "The exact word as it appears in the text" },
                        definition: { type: Type.STRING, description: "Simple definition in Arabic" }
                    },
                    required: ["word", "definition"]
                }
            },
            question: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: "The question asking what the character should do" },
                    options: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                text: { type: Type.STRING, description: "The action to take" },
                                isCorrect: { type: Type.BOOLEAN },
                                feedback: { type: Type.STRING, description: "Short feedback message explaining why this is right or wrong" }
                            },
                            required: ["text", "isCorrect", "feedback"]
                        }
                    }
                },
                required: ["text", "options"]
            },
            proverb: {
                type: Type.OBJECT,
                properties: {
                    text: { type: Type.STRING, description: "The proverb text in Arabic" },
                    explanation: { type: Type.STRING, description: "Simple explanation for a child" }
                },
                required: ["text", "explanation"]
            }
          },
          required: ["title", "pages", "dictionary", "question", "moralName", "proverb"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const storyData = JSON.parse(text) as GeneratedStory;
    storyData.moralId = params.moralId; 
    
    return storyData;
  } catch (error) {
    console.error("Error generating story:", error);
    throw error;
  }
};

export const generateSceneImage = async (imagePrompt: string, moralId?: string): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 300));

  if (moralId && MORAL_IMAGES[moralId]) {
    return MORAL_IMAGES[moralId];
  }

  const p = imagePrompt.toLowerCase();
  
  if (p.includes('forest') || p.includes('tree') || p.includes('garden')) {
     return "https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=1000&auto=format&fit=crop"; 
  }
  if (p.includes('sky') || p.includes('star') || p.includes('moon') || p.includes('night')) {
     return "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?q=80&w=1000&auto=format&fit=crop"; 
  }
  if (p.includes('room') || p.includes('home') || p.includes('bed')) {
     return "https://images.unsplash.com/photo-1540518614846-7eded433c457?q=80&w=1000&auto=format&fit=crop"; 
  }
  if (p.includes('sea') || p.includes('water')) {
     return "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1000&auto=format&fit=crop"; 
  }
  if (p.includes('desert') || p.includes('sand')) {
     return "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1000&auto=format&fit=crop"; 
  }
  
  return "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1000&auto=format&fit=crop";
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