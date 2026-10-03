import type { ResearchPacket, TherapyLesson } from '../lib/shift-intelligence-types.js';

export interface PublicInfluenceSummary {
  currentUserInput: true;
  historicalLearning: {
    count: number;
    types: string[];
  };
  professionalLearning: Array<{
    id: string;
    title: string;
    sourceType: TherapyLesson['sourceType'];
  }>;
  personalContextUsed: boolean;
  personalHistory: { count: number; sources: Array<{ documentId: string; sourceName: string; title: string }> };
  externalResearch: {
    status: ResearchPacket['status'];
    sourceCount: number;
  };
}

function memoryType(value: string): string | null {
  const match = value.match(/^\[([^\];]+)/);
  if (!match) return null;
  const type = match[1].replace(/[^A-Z0-9_-]/gi, '').toUpperCase();
  return type || null;
}

export function buildPublicInfluenceSummary(args: {
  memoryContext?: string[];
  therapyLessons?: TherapyLesson[];
  personalContext?: string;
  personalHistoryUsed?: Array<{ documentId: string; sourceName: string; title: string }>;
  research: ResearchPacket;
}): PublicInfluenceSummary {
  const memory = (args.memoryContext || []).filter((item) => typeof item === 'string' && item.trim()).slice(0, 8);
  const types = Array.from(new Set(memory.map(memoryType).filter((value): value is string => Boolean(value)))).slice(0, 6);

  return {
    currentUserInput: true,
    historicalLearning: {
      count: memory.length,
      types,
    },
    professionalLearning: (args.therapyLessons || []).slice(0, 4).map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      sourceType: lesson.sourceType,
    })),
    personalContextUsed: Boolean(args.personalContext?.trim()),
    personalHistory: { count: args.personalHistoryUsed?.length || 0, sources: (args.personalHistoryUsed || []).map(({ documentId, sourceName, title }) => ({ documentId, sourceName, title })) },
    externalResearch: {
      status: args.research.status,
      sourceCount: args.research.sources.length,
    },
  };
}
