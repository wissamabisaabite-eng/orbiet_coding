# Orbiet (مدار)

Learner-facing web counterpart to the existing Flutter learning app. Arabic-first
(RTL), reads the **same, unchanged** Cloud Firestore database. Space-themed,
fully custom UI. No learner auth, no progress tracking (both intentionally deferred).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Firebase Web SDK.

## Setup

1. `npm install`
2. Copy env template and fill in your Firebase Web config:
   ```bash
   cp .env.local.example .env.local
   ```
   Fill the six `NEXT_PUBLIC_FIREBASE_*` values from Firebase console →
   Project settings → Your apps → Web app.
3. `npm run dev` → http://localhost:3000

## Firestore

Existing structure (read-only from this site, never modified):

```
courses/{courseId}
  modules/{moduleId}
    lessons/{lessonId}
      exercises/{exerciseId}
      exercisesAnswers/{exerciseId}
```

All reads run through `src/lib/firestore.ts`, which normalizes field-name
variations in ONE place. If a field name differs from the assumptions there,
fix it in that file.

### Visitor counter (new, separate collection)

`siteStats/visitorCount` → `{ count: number }`. **Seed it once** from the
console with `{ count: 0 }`. Review `firestore.rules.proposed` and merge the
`siteStats` block into your live rules before deploying. This is the Spark-plan
direct-write fallback (only allows `count → count + 1`); upgrade to a Cloud
Function on Blaze for stronger abuse protection (see comments in
`src/components/VisitorCounter.tsx`).

## Bidi (RTL + inline English/code)

The site is RTL but mixes inline Latin/code into Arabic constantly. See the
big comment block in `src/app/layout.tsx`. Rules: logical CSS properties only,
`<Ltr>`/`<Isolate>` (`src/components/Bidi.tsx`) around inline Latin/code, code
blocks always `dir="ltr"`, numbers in Western digits wrapped LTR.

## Ads (Adsterra — placeholders only)

No real Adsterra scripts run in preview. Search for `TODO: ADSTERRA` to find
the two insertion points:
- `src/components/ads/AdBanner.tsx` — fixed-size banner slots (homepage ×2,
  lesson sidebar desktop-only). Never placed inside lesson content.
- `src/components/ads/VideoAdModal.tsx` — 10s between-lessons video gate. Shows
  every `LESSONS_BETWEEN_VIDEO_ADS` (default 3) in-app next-lesson transitions,
  never on first visit or direct lesson load.
