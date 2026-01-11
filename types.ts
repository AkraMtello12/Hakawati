
export enum StoryDialect {
  SYRIAN = 'syrian',
  FUSHA = 'fusha'
}

export type Gender = 'boy' | 'girl';

export type StoryLength = 'short' | 'medium' | 'long';

export interface StoryParams {
  childName: string;
  gender: Gender;
  age: number;
  moral: string;
  moralId?: string; 
  dialect: StoryDialect;
  sidekick?: string; // The chosen animal companion
  world?: string; // The story setting/world
  length: StoryLength; // New: Story duration preference
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
  text: string; // Full text
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
  proverb: StoryProverb;
}

export enum AppState {
  AUTH = 'auth',
  DASHBOARD = 'dashboard',
  HERO = 'hero',
  INPUT = 'input',
  GENERATING = 'generating',
  READING = 'reading'
}