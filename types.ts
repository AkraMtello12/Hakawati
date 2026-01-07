
export enum StoryDialect {
  SYRIAN = 'syrian',
  FUSHA = 'fusha'
}

export type Gender = 'boy' | 'girl';

export interface StoryParams {
  childName: string;
  gender: Gender;
  age: number;
  moral: string;
  moralId?: string; 
  dialect: StoryDialect;
}

export interface DictionaryEntry {
  word: string;
  definition: string;
}

export interface InteractiveOption {
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface InteractiveQuestion {
  text: string;
  options: InteractiveOption[];
}

export interface StoryPage {
  text: string;
  imagePrompt: string;
  imageUrl?: string; 
}

export interface GeneratedStory {
  title: string;
  moralId?: string;
  pages: StoryPage[];
  dictionary: DictionaryEntry[]; // New: List of difficult words
  question: InteractiveQuestion; // New: Mid-story interaction
  moralName: string; // New: The display name of the moral for the badge (e.g., "الصدق")
}

export enum AppState {
  HERO = 'hero',
  INPUT = 'input',
  GENERATING = 'generating',
  READING = 'reading'
}
