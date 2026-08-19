import { PriorityLevel } from '@/lib/types';

export interface PriorityBreakdown {
  score: number;
  level: PriorityLevel;
  reasons: string[];
}

export function calculatePriority(
  severityScore: number,
  publicImpactScore: number,
  urgencyScore: number,
  durationScore: number,
  safetyRisk: boolean,
  recurrenceScore: number
): PriorityBreakdown {
  const weights = {
    severity: 0.30,
    impact: 0.25,
    urgency: 0.20,
    duration: 0.10,
    safety: 0.10,
    recurrence: 0.05
  };

  let score = 
    (severityScore * weights.severity) +
    (publicImpactScore * weights.impact) +
    (urgencyScore * weights.urgency) +
    (durationScore * weights.duration) +
    (safetyRisk ? 100 * weights.safety : 0) +
    (recurrenceScore * weights.recurrence);

  score = Math.min(100, Math.max(0, Math.round(score)));

  let level: PriorityLevel;
  if (score >= 75) level = 'CRITICAL';
  else if (score >= 50) level = 'HIGH';
  else if (score >= 25) level = 'MEDIUM';
  else level = 'LOW';

  const reasons: string[] = [];
  if (severityScore > 75) reasons.push('High severity issue');
  if (publicImpactScore > 75) reasons.push('High public impact');
  if (urgencyScore > 75) reasons.push('Time-sensitive urgency');
  if (safetyRisk) reasons.push('Poses a safety risk');
  if (recurrenceScore > 75) reasons.push('Frequent recurrence');
  if (durationScore > 75) reasons.push('Longstanding issue');

  return {
    score,
    level,
    reasons
  };
}
