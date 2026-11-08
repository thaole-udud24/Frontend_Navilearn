export interface GenerateQuestionInput {
  concept: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface DraftQuestion {
  concept: string;
  difficulty: string;
  text: string;
  options: { text: string; isCorrect?: boolean }[];
}
