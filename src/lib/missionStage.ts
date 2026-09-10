/**
 * The learner's journey is framed as a fixed 20-station space mission —
 * the SAME 20 stations for every course, regardless of how many lessons a
 * course actually has (a short course spans the same 1→20 arc, just with
 * bigger jumps between stations; a long course fills it in more finely).
 *
 * `tier` (1–5) drives how much visual detail MissionPlanet draws — it does
 * NOT change color/identity (that still comes from the lesson's own seed,
 * which is what gives each lesson its distinct, "friendly" look). Tier only
 * adds: a ring, then moons, then blinking station lights, then an extra glow
 * — so later stations feel more elaborate without needing new art assets.
 */

export interface MissionStage {
  stage: number; // 1..20
  name: string; // Arabic label, e.g. shown as a tooltip
  tier: 1 | 2 | 3 | 4 | 5;
}

export const MISSION_STAGES: MissionStage[] = [
  { stage: 1, name: "الانطلاق من الأرض", tier: 1 },
  { stage: 2, name: "عبور الغلاف الجوي", tier: 1 },
  { stage: 3, name: "محطة الفضاء الدولية", tier: 1 },
  { stage: 4, name: "المدار المنخفض", tier: 1 },
  { stage: 5, name: "عبور حزام فان ألن", tier: 2 },
  { stage: 6, name: "الإبحار نحو القمر", tier: 2 },
  { stage: 7, name: "الهبوط على القمر", tier: 2 },
  { stage: 8, name: "مغادرة مدار القمر", tier: 2 },
  { stage: 9, name: "الإبحار نحو المريخ", tier: 3 },
  { stage: 10, name: "الوصول إلى المريخ", tier: 3 },
  { stage: 11, name: "استكشاف سطح المريخ", tier: 3 },
  { stage: 12, name: "بوابة حزام الكويكبات", tier: 3 },
  { stage: 13, name: "عبور حزام الكويكبات", tier: 4 },
  { stage: 14, name: "الاقتراب من المشتري", tier: 4 },
  { stage: 15, name: "أقمار المشتري", tier: 4 },
  { stage: 16, name: "الإبحار نحو زحل", tier: 4 },
  { stage: 17, name: "حلقات زحل", tier: 5 },
  { stage: 18, name: "حدود المجموعة الشمسية", tier: 5 },
  { stage: 19, name: "الفضاء بين النجمي", tier: 5 },
  { stage: 20, name: "نجم بعيد جديد", tier: 5 },
];

/**
 * Map a lesson's position within its course (0-based `index` of `total`
 * lessons) onto one of the 20 fixed stations, spreading evenly so the first
 * lesson is always station 1 and the last lesson is always station 20
 * (courses with fewer than 20 lessons simply skip some stations in between).
 */
export function stageFromProgress(index: number, total: number): number {
  if (total <= 1) return 1;
  const ratio = index / (total - 1); // 0..1
  const stage = Math.round(ratio * (MISSION_STAGES.length - 1)) + 1;
  return Math.min(MISSION_STAGES.length, Math.max(1, stage));
}

export function getMissionStage(stage: number): MissionStage {
  const clamped = Math.min(MISSION_STAGES.length, Math.max(1, Math.round(stage)));
  return MISSION_STAGES[clamped - 1];
}
