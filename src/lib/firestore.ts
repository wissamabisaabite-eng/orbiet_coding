/**
 * Central Firestore reader for the Orbiet learner site.
 *
 * ALL field-name guessing and normalization lives here so that, once the real
 * documents are inspected, corrections happen in exactly one file. Everything
 * else in the app consumes the clean domain types from `@/types`.
 *
 * Uses the Firebase Web SDK. These functions are safe to call from Server
 * Components (default) for SEO/perf; interactive pieces re-fetch on the client.
 */
import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { getDb } from "./firebase";
import type {
  CalloutVariant,
  ContentBlock,
  Course,
  CourseModule,
  Exercise,
  ExerciseAnswer,
  FlatLesson,
  Lesson,
  QuillDelta,
} from "@/types";

type Data = Record<string, unknown>;

/* ----------------------------- small helpers ------------------------------ */

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function num(v: unknown, fallback = 0): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}

/** Pick the first present value among several candidate field names. */
function pick(d: Data, keys: string[]): unknown {
  for (const k of keys) {
    if (d[k] !== undefined && d[k] !== null) return d[k];
  }
  return undefined;
}

/* --------------------------------- courses -------------------------------- */

export async function getCourses(): Promise<Course[]> {
  const db = getDb();
  const snap = await getDocs(query(collection(db, "courses"), orderBy("order")));
  return snap.docs.map((d) => normalizeCourse(d.id, d.data() as Data));
}

export async function getCourse(courseId: string): Promise<Course | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, "courses", courseId));
  if (!snap.exists()) return null;
  return normalizeCourse(snap.id, snap.data() as Data);
}

function normalizeCourse(id: string, d: Data): Course {
  return {
    id,
    order: num(pick(d, ["order", "index", "sortOrder"])),
    title: str(pick(d, ["title", "name"])),
    description: str(pick(d, ["description", "desc", "subtitle"])),
    coverImage: str(pick(d, ["coverImage", "cover", "image", "thumbnail"])) || undefined,
  };
}

/* --------------------------------- modules -------------------------------- */

export async function getModules(courseId: string): Promise<CourseModule[]> {
  const db = getDb();
  const snap = await getDocs(
    query(collection(db, "courses", courseId, "modules"), orderBy("order"))
  );
  return snap.docs.map((d) => ({
    id: d.id,
    order: num(pick(d.data() as Data, ["order", "index", "sortOrder"])),
    title: str(pick(d.data() as Data, ["title", "name"])),
  }));
}

/* --------------------------------- lessons -------------------------------- */

export async function getLessons(
  courseId: string,
  moduleId: string
): Promise<Lesson[]> {
  const db = getDb();
  const snap = await getDocs(
    query(
      collection(db, "courses", courseId, "modules", moduleId, "lessons"),
      orderBy("order")
    )
  );
  return snap.docs.map((d) => normalizeLesson(d.id, moduleId, d.data() as Data));
}

export async function getLesson(
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<Lesson | null> {
  const db = getDb();
  const snap = await getDoc(
    doc(db, "courses", courseId, "modules", moduleId, "lessons", lessonId)
  );
  if (!snap.exists()) return null;
  return normalizeLesson(snap.id, moduleId, snap.data() as Data);
}

/**
 * Lessons live under modules, but a lessonId in the URL doesn't tell us its
 * module. This resolves a lesson by scanning modules in order and also returns
 * the flattened, whole-course lesson list used for prev/next navigation.
 */
export async function getLessonWithContext(
  courseId: string,
  lessonId: string
): Promise<{ lesson: Lesson | null; flat: FlatLesson[] }> {
  const modules = await getModules(courseId);
  const flat: FlatLesson[] = [];
  let lesson: Lesson | null = null;

  for (const m of modules) {
    const lessons = await getLessons(courseId, m.id);
    for (const l of lessons) {
      flat.push({ id: l.id, moduleId: m.id, title: l.title });
      if (l.id === lessonId) lesson = l;
    }
  }
  return { lesson, flat };
}

function normalizeLesson(id: string, moduleId: string, d: Data): Lesson {
  const rawContentType = str(pick(d, ["contentType", "type"]));
  const htmlContent = str(pick(d, ["htmlContent", "html"])) || undefined;
  const htmlUrl = str(pick(d, ["htmlUrl", "url"])) || undefined;
  const rawBlocks = pick(d, ["content_blocks", "contentBlocks", "blocks"]);

  // Infer content type when it isn't explicitly set.
  const contentType: Lesson["contentType"] =
    rawContentType === "html" || (!rawContentType && (htmlContent || htmlUrl))
      ? "html"
      : "blocks";

  return {
    id,
    moduleId,
    order: num(pick(d, ["order", "index", "sortOrder"])),
    title: str(pick(d, ["title", "name"])),
    contentType,
    content_blocks: Array.isArray(rawBlocks)
      ? (rawBlocks as Data[]).map(normalizeBlock).filter(Boolean as unknown as (b: ContentBlock | null) => b is ContentBlock)
      : undefined,
    htmlContent,
    htmlUrl,
  };
}

function normalizeBlock(raw: Data): ContentBlock | null {
  const type = str(pick(raw, ["type", "blockType"]));

  switch (type) {
    case "richText":
    case "text": {
      const insertData = pick(raw, ["delta", "data", "content", "value"]);
      const delta = normalizeDelta(insertData);
      return { type: "richText", delta };
    }
    case "code": {
      const code = str(pick(raw, ["code", "data", "content", "value"]));
      const language = str(pick(raw, ["language", "lang"])) || undefined;
      return { type: "code", code, language };
    }
    case "image": {
      const url = str(pick(raw, ["url", "src", "data", "image"]));
      return url ? { type: "image", url, caption: str(pick(raw, ["caption"])) || undefined } : null;
    }
    case "output_image":
    case "outputImage": {
      const url = str(pick(raw, ["url", "src", "data", "image"]));
      return url
        ? { type: "output_image", url, caption: str(pick(raw, ["caption"])) || undefined }
        : null;
    }
    case "callout":
    case "note": {
      const variant = str(pick(raw, ["variant", "style", "kind"]), "note") as CalloutVariant;
      const text = str(pick(raw, ["text", "data", "content", "value"]));
      return text ? { type: "callout", variant, text } : null;
    }
    case "terminal": {
      const command = str(pick(raw, ["command", "cmd", "data", "content", "value"]));
      const output = str(pick(raw, ["output", "result"])) || undefined;
      return command ? { type: "terminal", command, output } : null;
    }
    case "objectives": {
      const title = str(pick(raw, ["title"])) || undefined;
      const itemsRaw = pick(raw, ["items", "objectives", "data", "list"]);
      const items = Array.isArray(itemsRaw) ? itemsRaw.map((v) => str(v)).filter(Boolean) : [];
      return items.length ? { type: "objectives", title, items } : null;
    }
    case "steps": {
      const itemsRaw = pick(raw, ["items", "steps", "data", "list"]);
      const items = Array.isArray(itemsRaw)
        ? (itemsRaw as Data[])
            .map((s) => ({
              title: str(pick(s, ["title", "name"])),
              text: str(pick(s, ["text", "description", "content"])),
            }))
            .filter((s) => s.title || s.text)
        : [];
      return items.length ? { type: "steps", items } : null;
    }
    default:
      return null;
  }
}

/** Coerce whatever the richText payload is into a Quill Delta { ops: [...] }. */
function normalizeDelta(v: unknown): QuillDelta {
  if (v && typeof v === "object" && Array.isArray((v as QuillDelta).ops)) {
    return v as QuillDelta;
  }
  // A JSON-encoded delta string.
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      if (parsed && Array.isArray(parsed.ops)) return parsed as QuillDelta;
    } catch {
      // Plain text fallback.
      return { ops: [{ insert: v }] };
    }
    return { ops: [{ insert: v }] };
  }
  return { ops: [] };
}

/* -------------------------------- exercises ------------------------------- */

export async function getExercises(
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<Exercise[]> {
  const db = getDb();
  const base = ["courses", courseId, "modules", moduleId, "lessons", lessonId] as const;
  const snap = await getDocs(collection(db, ...base, "exercises"));
  const exercises = snap.docs.map((d) => {
    const data = d.data() as Data;
    const optionsRaw = pick(data, ["options", "choices", "answers"]);
    return {
      id: d.id,
      order: num(pick(data, ["order", "index"])),
      question: str(pick(data, ["question", "title", "text", "prompt"])),
      options: Array.isArray(optionsRaw) ? optionsRaw.map((o) => str(o)) : [],
      type: str(pick(data, ["type"]), "multipleChoice"),
    } satisfies Exercise;
  });
  return exercises.sort((a, b) => a.order - b.order);
}

/**
 * Fetch the answer key. `exercisesAnswers` is keyed by the SAME id as its
 * exercise. Returns a map exerciseId -> correctIndex.
 */
export async function getExerciseAnswers(
  courseId: string,
  moduleId: string,
  lessonId: string
): Promise<Record<string, ExerciseAnswer>> {
  const db = getDb();
  const base = ["courses", courseId, "modules", moduleId, "lessons", lessonId] as const;
  const snap = await getDocs(collection(db, ...base, "exercisesAnswers"));
  const map: Record<string, ExerciseAnswer> = {};
  for (const d of snap.docs) {
    const data = d.data() as Data;
    map[d.id] = {
      id: d.id,
      correctIndex: num(
        pick(data, ["correctIndex", "correct", "answerIndex", "index", "correctAnswer"]),
        -1
      ),
    };
  }
  return map;
}
