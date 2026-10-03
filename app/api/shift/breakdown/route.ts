import { personalContextPrompt } from '@/server/personalContext';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import { analyzeShiftReflection } from '@/server/aiClient';
import {
  mergeAccountAndDeviceMemory,
  mergeMemoryContext,
  publicMemorySource,
  selectRelevantMemoryContextWithProvenance,
} from '@/server/memoryContext';
import { hasDurableStorage, loadLearningMemories } from '@/server/persistence';
import { evaluateSafety } from '@/server/safetyCheck';
import { embedMemoryQuery } from '@/server/semanticMemory';
import {
  publicTherapyLessonSummary,
  selectRelevantTherapyLessons,
  therapyLessonsAsMemoryContext,
} from '@/server/therapyLessonContext';
import { loadTherapyLessons } from '@/server/therapyLessonStore';

export async function POST(request: Request) {
  try {
    const {
      situation,
      memoryContext,
      memoryItems,
      personalContext,
      approvedSummary,
    } = (await request.json()) as Record<string, unknown>;
    if (typeof situation !== 'string' || !situation.trim()) {
      return Response.json(
        { error: 'Please provide a description of what is going on.' },
        { status: 400 },
      );
    }

    const safety = evaluateSafety(situation);
    if (safety.isCrisis) {
      return Response.json({
        safetyInterruption: true,
        crisisType: safety.crisisType,
        crisisMessage: safety.crisisMessage,
      });
    }

    const user = await getChatGPTUser();
    let durableMemory: Awaited<ReturnType<typeof loadLearningMemories>> = [];
    let therapyLessons: Awaited<ReturnType<typeof loadTherapyLessons>> = [];
    let accountMemoryAvailable = false;
    if (user && hasDurableStorage()) {
      try {
        durableMemory = await loadLearningMemories(user.userId, 120);
        accountMemoryAvailable = true;
      } catch (error) {
        console.info(
          '[SHIFT Memory] Durable retrieval unavailable; using device memory for this request.',
          error,
        );
      }
      try {
        therapyLessons = await loadTherapyLessons(user.userId, 60);
      } catch (error) {
        console.info(
          '[SHIFT Therapy Lessons] Professional learning unavailable for this breakdown.',
          error,
        );
      }
    }

    const combinedMemory = mergeAccountAndDeviceMemory(
      durableMemory,
      memoryItems,
    );
    let queryEmbedding: number[] | null = null;
    if (
      durableMemory.some(
        (memory) =>
          Array.isArray(memory.embedding) && memory.embedding.length > 0,
      )
    ) {
      try {
        queryEmbedding = await embedMemoryQuery(situation);
      } catch {
        queryEmbedding = null;
      }
    }
    const selection = selectRelevantMemoryContextWithProvenance(
      situation,
      combinedMemory,
      6,
      queryEmbedding,
    );
    const retrieved = selection.context;
    const relevantTherapyLessons = selectRelevantTherapyLessons(
      situation,
      therapyLessons,
      3,
    );
    const context = mergeMemoryContext(
      [
        ...therapyLessonsAsMemoryContext(relevantTherapyLessons),
        ...retrieved,
      ].slice(0, 8),
      memoryContext,
    );
    const breakdown = await analyzeShiftReflection(
      situation,
      context,
      personalContextPrompt(personalContext, approvedSummary, situation),
    );

    return Response.json({
      safetyInterruption: false,
      isSubstanceUrge: safety.isSubstanceUrge,
      substanceDetails: safety.substanceDetails,
      // Keep public provenance categories separate. `context` is the compact model
      // input; these public fields show what type of prior learning influenced it
      // without exposing hidden reasoning or duplicating professional lessons.
      memoryUsed: retrieved,
      professionalLearningUsed: publicTherapyLessonSummary(
        relevantTherapyLessons,
      ),
      memorySource: publicMemorySource(selection.origins),
      accountMemoryAvailable,
      memoryRetrieval: queryEmbedding ? 'semantic_and_lexical' : 'lexical',
      breakdown,
    });
  } catch {
    return Response.json(
      { error: 'Unable to process this reflection. Please try again.' },
      { status: 500 },
    );
  }
}
