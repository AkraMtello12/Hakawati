export enum StoryDialect {
  SYRIAN = 'syrian',
  FUSHA = 'fusha'
}

export interface StoryParams {
  childName: string;
  age: number;
  moral: string;
  dialect: StoryDialect;
}

export interface StoryPage {
  text: string;
  imagePrompt: string;
  imageUrl?: string; // Populated after image generation
}

export interface GeneratedStory {
  title: string;
  pages: StoryPage[];
}

export enum AppState {
  HERO = 'hero',
  INPUT = 'input',
  GENERATING = 'generating',
  READING = 'reading'
}
