export type ReadingMode = 'original' | 'simplified' | 'highlight';

/** When on, show academy commentary blocks alongside Satoshi’s text. */
export type AnnotationLayer = 'raw' | 'annotated';

export type WhitepaperSection = {
  id: string;
  /** Display label in sidebar */
  navLabel: string;
  /** Short title for headings */
  title: string;
  paragraphs: string[];
  /** Extra paragraphs shown only in simplified mode (plain-language notes). */
  simplifiedNotes: string[];
  /** Phrases to emphasize in highlight mode (matched per paragraph, first occurrence). */
  highlights: Array<{ paragraphIndex: number; phrase: string }>;
  /** Academy commentary (annotated layer); short paragraphs. */
  commentary: string[];
  insights: {
    whatItMeans: string;
    whyItMatters: string;
  };
  checkpoint?: {
    question: string;
    options: string[];
    /** Index of correct option (self-check; we show explanation after any answer). */
    correctIndex: number;
    explanation: string;
  };
};

export type GlossaryEntry = { term: string; definition: string };
