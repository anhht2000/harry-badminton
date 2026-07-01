export const VISIT_HALF_LIFE_DAYS = 14;

// EMA co decay: diem cu giam nua sau moi HALF_LIFE ngay, moi lan vao +1.
export function nextVisitScore(
  prevScore: number,
  prevAt: Date,
  now: Date,
  halfLifeDays = VISIT_HALF_LIFE_DAYS
): number {
  const days = Math.max(0, (now.getTime() - prevAt.getTime()) / 86_400_000);
  return prevScore * Math.pow(0.5, days / halfLifeDays) + 1;
}
