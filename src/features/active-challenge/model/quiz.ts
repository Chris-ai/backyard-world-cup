export type SingleChoiceQuestion = {
  answers: string[];
  correctAnswer: string;
  easterEgg?: string;
  question: string;
  type: "single-choice";
};

export type MultipleChoiceQuestion = {
  answers: string[];
  correctAnswer: string[];
  maxSelections: number;
  question: string;
  type: "multiple-choice";
};

export type QuizQuestion = SingleChoiceQuestion | MultipleChoiceQuestion;
