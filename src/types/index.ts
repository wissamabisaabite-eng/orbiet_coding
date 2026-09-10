/**
 * Domain types mirroring the existing Firestore schema (shared with the Flutter app).
 * DO NOT add new fields/collections to the courses/** tree — this only describes it.
 *
 * Firestore layout:
 *   courses/{courseId}
 *     modules/{moduleId}
 *       lessons/{lessonId}
 *         exercises/{exerciseId}
 *         exercisesAnswers/{exerciseId}
 *
 * Field names are best-effort guesses; the reader in lib/firestore.ts normalizes
 * variations so we can correct them in one place once real documents are inspected.
 */

export interface Course {
  id: string;
  order: number;
  title: string;
  description: string;
  coverImage?: string;
}

export interface CourseModule {
  id: string;
  order: number;
  title: string;
}

/** A Quill Delta document: { ops: [...] }. */
export interface QuillDelta {
  ops: QuillOp[];
}

export interface QuillOp {
  insert?: string | Record<string, unknown>;
  attributes?: Record<string, unknown>;
}

export type ContentType = "blocks" | "html";

export type CalloutVariant =
  | "note"
  | "tip"
  | "warning"
  | "danger"
  | "summary"
  | "best_practice";

export type ContentBlock =
  | { type: "richText"; delta: QuillDelta }
  | { type: "code"; code: string; language?: string }
  | { type: "image"; url: string; caption?: string }
  | { type: "output_image"; url: string; caption?: string }
  | { type: "callout"; variant: CalloutVariant; text: string }
  | { type: "terminal"; command: string; output?: string }
  | { type: "objectives"; title?: string; items: string[] }
  | { type: "steps"; items: { title: string; text: string }[] };

export interface Lesson {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  contentType: ContentType;
  content_blocks?: ContentBlock[];
  htmlContent?: string;
  htmlUrl?: string;
}

/** A lesson plus the location needed to build prev/next links across the whole course. */
export interface FlatLesson {
  id: string;
  moduleId: string;
  title: string;
}

export interface Exercise {
  id: string;
  order: number;
  question: string;
  options: string[];
  /** multiple-choice only for now; kept for forward-compat / graceful degradation. */
  type: string;
}

export interface ExerciseAnswer {
  id: string;
  /** Index into Exercise.options that is correct. */
  correctIndex: number;
}
