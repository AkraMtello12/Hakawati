
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
  sidekick?: string; // New: The chosen animal companion
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

export interface StoryProverb {
  text: string;
  explanation: string;
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
  dictionary: DictionaryEntry[];
  question: InteractiveQuestion;
  moralName: string;
  proverb: StoryProverb; // New: Hakawati's Bundle reward
}

export enum AppState {
  HERO = 'hero',
  INPUT = 'input',
  GENERATING = 'generating',
  READING = 'reading'
}
