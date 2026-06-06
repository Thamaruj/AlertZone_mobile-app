import { arrayUnion, doc, increment, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// ─────────────────────────────────────────────────────────────────
// Badge Definitions
// ─────────────────────────────────────────────────────────────────
export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface BadgeDefinition {
  id: string;
  name: string;
  icon: string;
  tier: BadgeTier;
  tierColor: string; // chip color
  color: string;     // icon color
  bg: string;        // icon background
  description: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // ── Bronze ──────────────────────────────────────────────────────
  {
    id: 'first_report',
    name: 'First Responder',
    icon: 'shield',
    tier: 'bronze',
    tierColor: '#CD7F32',
    color: '#E65100',
    bg: '#FFF3EC',
    description: 'Submit your very first incident report',
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    icon: 'sunny',
    tier: 'bronze',
    tierColor: '#CD7F32',
    color: '#D97706',
    bg: '#FEF3C7',
    description: 'Report an incident before 7:00 AM',
  },
  {
    id: 'night_watch',
    name: 'Night Watch',
    icon: 'moon',
    tier: 'bronze',
    tierColor: '#CD7F32',
    color: '#4F46E5',
    bg: '#EEF2FF',
    description: 'Report an incident after 10:00 PM',
  },
  // ── Silver ──────────────────────────────────────────────────────
  {
    id: 'accepted_5',
    name: 'Trusted Reporter',
    icon: 'ribbon',
    tier: 'silver',
    tierColor: '#9CA3AF',
    color: '#2563EB',
    bg: '#EFF6FF',
    description: 'Have 5 reports accepted by authorities',
  },
  {
    id: 'resolved_5',
    name: 'Problem Solver',
    icon: 'checkmark-done-circle',
    tier: 'silver',
    tierColor: '#9CA3AF',
    color: '#0D8A72',
    bg: '#E6F7F3',
    description: 'Have 5 reports fully resolved',
  },
  {
    id: 'points_500',
    name: 'Community Champion',
    icon: 'people',
    tier: 'silver',
    tierColor: '#9CA3AF',
    color: '#7C3AED',
    bg: '#F5F3FF',
    description: 'Earn 500 contribution points',
  },
  // ── Gold ────────────────────────────────────────────────────────
  {
    id: 'accepted_25',
    name: 'Veteran Reporter',
    icon: 'star-half',
    tier: 'gold',
    tierColor: '#D97706',
    color: '#D97706',
    bg: '#FEF3C7',
    description: 'Have 25 reports accepted by authorities',
  },
  {
    id: 'resolved_20',
    name: 'Resolution Hero',
    icon: 'trophy',
    tier: 'gold',
    tierColor: '#D97706',
    color: '#EA580C',
    bg: '#FFF7ED',
    description: 'Have 20 reports fully resolved',
  },
  {
    id: 'points_2000',
    name: 'City Guardian',
    icon: 'shield-checkmark',
    tier: 'gold',
    tierColor: '#D97706',
    color: '#0891B2',
    bg: '#ECFEFF',
    description: 'Earn 2,000 contribution points',
  },
  // ── Diamond ─────────────────────────────────────────────────────
  {
    id: 'accepted_100',
    name: 'Legend',
    icon: 'medal',
    tier: 'diamond',
    tierColor: '#0D8A72',
    color: '#06B6D4',
    bg: '#ECFEFF',
    description: 'Have 100 reports accepted by authorities',
  },
  {
    id: 'resolved_50',
    name: 'Master Resolver',
    icon: 'infinite',
    tier: 'diamond',
    tierColor: '#0D8A72',
    color: '#4F46E5',
    bg: '#EEF2FF',
    description: 'Have 50 reports fully resolved',
  },
  {
    id: 'points_5000',
    name: 'AlertZone Elite',
    icon: 'diamond',
    tier: 'diamond',
    tierColor: '#0D8A72',
    color: '#DB2777',
    bg: '#FDF2F8',
    description: 'Earn 5,000 contribution points',
  },
];

export const POINTS_PER_ACCEPTED = 10;

// ─────────────────────────────────────────────────────────────────
// Badge ID computation — pure function, no Firestore calls
// ─────────────────────────────────────────────────────────────────
export function computeEarnedBadgeIds(params: {
  totalReports: number;
  reportsAccepted: number;
  reportsResolved: number;
  contributionPoints: number;
  reportTimestamps: Date[];
}): string[] {
  const { totalReports, reportsAccepted, reportsResolved, contributionPoints, reportTimestamps } = params;
  const earned: string[] = [];

  // Bronze
  if (totalReports >= 1) earned.push('first_report');
  if (reportTimestamps.some(d => d.getHours() < 7)) earned.push('early_bird');
  if (reportTimestamps.some(d => d.getHours() >= 22)) earned.push('night_watch');

  // Silver
  if (reportsAccepted >= 5) earned.push('accepted_5');
  if (reportsResolved >= 5) earned.push('resolved_5');
  if (contributionPoints >= 500) earned.push('points_500');

  // Gold
  if (reportsAccepted >= 25) earned.push('accepted_25');
  if (reportsResolved >= 20) earned.push('resolved_20');
  if (contributionPoints >= 2000) earned.push('points_2000');

  // Diamond
  if (reportsAccepted >= 100) earned.push('accepted_100');
  if (reportsResolved >= 50) earned.push('resolved_50');
  if (contributionPoints >= 5000) earned.push('points_5000');

  return earned;
}

// ─────────────────────────────────────────────────────────────────
// Award 10 pts + increment reportsAccepted for one accepted report
// Also marks the report document so we never double-award.
// ─────────────────────────────────────────────────────────────────
export async function awardAcceptedPoints(userId: string, reportId: string): Promise<void> {
  try {
    await Promise.all([
      updateDoc(doc(db, 'users', userId), {
        contributionPoints: increment(POINTS_PER_ACCEPTED),
        reportsAccepted: increment(1),
      }),
      updateDoc(doc(db, 'reports', reportId), {
        pointsAwarded: true,
      }),
    ]);
  } catch (e) {
    console.error('❌ awardAcceptedPoints error:', e);
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────
// Increment resolved count (called once when a report → RESOLVED)
// ─────────────────────────────────────────────────────────────────
export async function incrementResolvedCount(userId: string, reportId: string): Promise<void> {
  try {
    await Promise.all([
      updateDoc(doc(db, 'users', userId), {
        reportsResolved: increment(1),
      }),
      updateDoc(doc(db, 'reports', reportId), {
        resolvedCounted: true,
      }),
    ]);
  } catch (e) {
    console.error('❌ incrementResolvedCount error:', e);
    throw e;
  }
}

// ─────────────────────────────────────────────────────────────────
// Sync newly earned badges to Firestore using arrayUnion (idempotent)
// Returns the list of badge IDs that were newly added.
// ─────────────────────────────────────────────────────────────────
export async function syncBadgesToFirestore(
  userId: string,
  earnedIds: string[],
  existingIds: string[],
): Promise<string[]> {
  const newlyEarned = earnedIds.filter(id => !existingIds.includes(id));
  if (newlyEarned.length === 0) return [];

  try {
    await updateDoc(doc(db, 'users', userId), {
      badges: arrayUnion(...newlyEarned),
    });
  } catch (e) {
    console.error('❌ syncBadgesToFirestore error:', e);
  }

  return newlyEarned;
}
