"use client";

/**
 * "Check your understanding" — multiple-choice comprehension checks.
 *
 * On selecting an option we immediately compare against the answer key
 * (exercisesAnswers, correctIndex) and show correct/incorrect. NOTHING is
 * persisted — this matches the current security-rules design (the answers
 * collection is publicly readable and there's no learner auth/progress).
 *
 * BIDI: question text and options may embed English/code, so they're wrapped
 * in <Isolate>. Option letters use Western digits/letters kept LTR.
 */
import { useState } from "react";
import type { Exercise, ExerciseAnswer } from "@/types";
import { Isolate, Ltr } from "@/components/Bidi";

export default function ExerciseCheck({
  exercises,
  answers,
}: {
  exercises: Exercise[];
  answers: Record<string, ExerciseAnswer>;
}) {
  if (exercises.length === 0) return null;

  return (
    <section className="mt-12 border-t border-orbit-blue/15 pt-8">
      <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold text-space-ink">
        <span aria-hidden="true" className="text-orbit-gold">
          ✦
        </span>
        اختبر فهمك
      </h2>
      <div className="space-y-6">
        {exercises.map((ex, i) => (
          <ExerciseItem
            key={ex.id}
            index={i}
            exercise={ex}
            correctIndex={answers[ex.id]?.correctIndex ?? -1}
          />
        ))}
      </div>
    </section>
  );
}

function ExerciseItem({
  exercise,
  correctIndex,
  index,
}: {
  exercise: Exercise;
  correctIndex: number;
  index: number;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const answered = selected !== null;

  return (
    <div className="card p-5">
      <p className="mb-4 font-semibold text-space-ink">
        <span className="me-2 text-orbit-cyan">
          <Ltr>{index + 1}.</Ltr>
        </span>
        <Isolate>{exercise.question}</Isolate>
      </p>

      <ul className="space-y-2">
        {exercise.options.map((opt, i) => {
          const isSelected = selected === i;
          const isCorrect = i === correctIndex;

          // Coloring only appears after an answer is chosen.
          let stateClass = "border-orbit-blue/25 hover:border-orbit-cyan/60 hover:bg-orbit-blue/10";
          if (answered) {
            if (isCorrect) stateClass = "border-emerald-500/60 bg-emerald-500/10";
            else if (isSelected) stateClass = "border-red-500/60 bg-red-500/10";
            else stateClass = "border-orbit-blue/15 opacity-70";
          }

          return (
            <li key={i}>
              <button
                type="button"
                disabled={answered}
                onClick={() => setSelected(i)}
                className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-start transition-colors ${stateClass}`}
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current font-mono text-xs text-space-muted">
                  <Ltr>{String.fromCharCode(65 + i)}</Ltr>
                </span>
                <span className="flex-1 text-space-ink">
                  <Isolate>{opt}</Isolate>
                </span>
                {answered && isCorrect && (
                  <span className="text-emerald-400" aria-label="إجابة صحيحة">
                    ✓
                  </span>
                )}
                {answered && isSelected && !isCorrect && (
                  <span className="text-red-400" aria-label="إجابة خاطئة">
                    ✕
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <p
          className={`mt-3 text-sm ${
            selected === correctIndex ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {selected === correctIndex
            ? "إجابة صحيحة! أحسنت."
            : "إجابة غير صحيحة — الخيار الصحيح مميّز بالأخضر."}
        </p>
      )}
    </div>
  );
}
