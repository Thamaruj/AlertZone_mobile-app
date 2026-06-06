import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../config/authConfig';
import { useTheme } from '../config/themeContext';
import { BADGE_DEFINITIONS, BadgeDefinition } from '../services/gamification.service';

// ─────────────────────────────────────────────────────────────────
// Tier label config
// ─────────────────────────────────────────────────────────────────
const TIER_ORDER = ['bronze', 'silver', 'gold', 'diamond'] as const;

function getTierConfig(tier: string, isDark: boolean) {
  if (isDark) {
    switch (tier) {
      case 'bronze':
        return { label: 'Bronze', labelColor: '#CD7F32', bg: '#CD7F3220', borderColor: '#CD7F3240' };
      case 'silver':
        return { label: 'Silver', labelColor: '#A0AEC0', bg: '#A0AEC020', borderColor: '#A0AEC040' };
      case 'gold':
        return { label: 'Gold', labelColor: '#F59E0B', bg: '#F59E0B20', borderColor: '#F59E0B40' };
      case 'diamond':
        return { label: 'Diamond', labelColor: '#4CC2D1', bg: '#4CC2D120', borderColor: '#4CC2D140' };
      default:
        return { label: 'Bronze', labelColor: '#CD7F32', bg: '#CD7F3220', borderColor: '#CD7F3240' };
    }
  } else {
    switch (tier) {
      case 'bronze':
        return { label: 'Bronze', labelColor: '#CD7F32', bg: '#FFF7ED', borderColor: '#CD7F3240' };
      case 'silver':
        return { label: 'Silver', labelColor: '#9CA3AF', bg: '#F3F4F6', borderColor: '#9CA3AF40' };
      case 'gold':
        return { label: 'Gold', labelColor: '#D97706', bg: '#FEF3C7', borderColor: '#D9770640' };
      case 'diamond':
        return { label: 'Diamond', labelColor: '#0D8A72', bg: '#E6F7F3', borderColor: '#0D8A7240' };
      default:
        return { label: 'Bronze', labelColor: '#CD7F32', bg: '#FFF7ED', borderColor: '#CD7F3240' };
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Single badge card
// ─────────────────────────────────────────────────────────────────
function BadgeCard({ badge, earned }: { badge: BadgeDefinition; earned: boolean }) {
  const { colors, isDark } = useTheme();
  const tierCfg = getTierConfig(badge.tier, isDark);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: earned ? colors.card : colors.cardUnearned,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: earned ? badge.color + '30' : colors.border,
        padding: 14,
        marginBottom: 10,
        opacity: earned ? 1 : 0.55,
      }}
    >
      {/* Icon circle */}
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 14,
          backgroundColor: earned ? (isDark ? badge.color + '1A' : badge.bg) : colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: earned ? badge.color + '50' : colors.border,
          marginRight: 14,
        }}
      >
        <Ionicons name={badge.icon as any} size={24} color={earned ? badge.color : colors.textMuted} />
      </View>

      {/* Name + description */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Text style={{ color: earned ? colors.text : colors.textMuted, fontWeight: '700', fontSize: 14 }}>
            {badge.name}
          </Text>
          {/* Tier chip */}
          <View
            style={{
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: earned ? tierCfg.bg : colors.border,
              borderWidth: 1,
              borderColor: earned ? tierCfg.borderColor : colors.border,
            }}
          >
            <Text style={{ color: earned ? tierCfg.labelColor : colors.textMuted, fontSize: 9, fontWeight: '700' }}>
              {tierCfg.label.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={{ color: earned ? colors.textSecondary : colors.textMuted, fontSize: 12, lineHeight: 17 }}>
          {badge.description}
        </Text>
      </View>

      {/* Status icon */}
      <View style={{ marginLeft: 10 }}>
        {earned ? (
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: badge.color + '20',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="checkmark" size={16} color={badge.color} />
          </View>
        ) : (
          <Ionicons name="lock-closed" size={16} color={colors.textMuted} />
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Earned badge showcase (3-column grid)
// ─────────────────────────────────────────────────────────────────
function EarnedBadgeGrid({ earnedBadges }: { earnedBadges: BadgeDefinition[] }) {
  const { colors, isDark } = useTheme();
  if (earnedBadges.length === 0) {
    return (
      <View
        style={{
          backgroundColor: colors.cardUnearned,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 28,
          alignItems: 'center',
        }}
      >
        <Ionicons name="ribbon-outline" size={36} color={colors.textMuted} />
        <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600', marginTop: 10 }}>
          No badges earned yet
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
          Get your reports accepted by authorities{'\n'}to start earning badges!
        </Text>
      </View>
    );
  }

  const rows: BadgeDefinition[][] = [];
  for (let i = 0; i < earnedBadges.length; i += 3) {
    rows.push(earnedBadges.slice(i, i + 3));
  }

  return (
    <View>
      {rows.map((row, ri) => (
        <View key={ri} style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          {row.map(badge => (
            <View key={badge.id} style={{ flex: 1, alignItems: 'center' }}>
              {/* Glow halo */}
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  backgroundColor: isDark ? badge.color + '1A' : badge.bg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: badge.color + '60',
                  marginBottom: 6,
                  shadowColor: badge.color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <Ionicons name={badge.icon as any} size={28} color={badge.color} />
              </View>
              <Text
                style={{ color: colors.textSecondary, fontSize: 10, textAlign: 'center', lineHeight: 13 }}
                numberOfLines={2}
              >
                {badge.name}
              </Text>
            </View>
          ))}
          {/* Pad row to 3 items */}
          {row.length < 3 &&
            Array.from({ length: 3 - row.length }).map((_, i) => (
              <View key={`pad-${i}`} style={{ flex: 1 }} />
            ))}
        </View>
      ))}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main Badges Screen
// ─────────────────────────────────────────────────────────────────
export default function BadgesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const { colors, isDark } = useTheme();

  const earnedIds = profile?.badges ?? [];
  const earnedBadges = BADGE_DEFINITIONS.filter(b => earnedIds.includes(b.id));

  // Group all badges by tier for the "How to Earn" section
  const badgesByTier = TIER_ORDER.map(tier => ({
    tier,
    config: getTierConfig(tier, isDark),
    badges: BADGE_DEFINITIONS.filter(b => b.tier === tier),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 60 }}
        scrollEventThrottle={16}
        decelerationRate="normal"
      >
        {/* ── Header ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 20,
            marginBottom: 24,
          }}
        >
          <Pressable
            onPress={() => router.back()}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>Badges</Text>
            <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 1 }}>
              {earnedBadges.length} of {BADGE_DEFINITIONS.length} earned
            </Text>
          </View>
          {/* Points chip */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: colors.border,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Ionicons name="star" size={14} color="#D97706" />
            <Text style={{ color: '#D97706', fontWeight: '700', fontSize: 14 }}>
              {(profile?.contributionPoints ?? 0).toLocaleString()} pts
            </Text>
          </View>
        </View>

        {/* ── Earned Badge Showcase ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <Text
            style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 }}
          >
            ✨ Your Badges
          </Text>
          <EarnedBadgeGrid earnedBadges={earnedBadges} />
        </View>

        {/* ── Progress bar ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                Collection Progress
              </Text>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
                {earnedBadges.length}/{BADGE_DEFINITIONS.length}
              </Text>
            </View>
            <View
              style={{
                height: 8,
                backgroundColor: colors.border,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${Math.round((earnedBadges.length / BADGE_DEFINITIONS.length) * 100)}%`,
                  backgroundColor: colors.primary,
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        </View>

        {/* ── How to Earn (All Badges by Tier) ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 14 }}
          >
            🏅 How to Earn
          </Text>

          {badgesByTier.map(({ tier, config, badges }) => (
            <View key={tier} style={{ marginBottom: 20 }}>
              {/* Tier header */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 10,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    height: 1,
                    flex: 1,
                    backgroundColor: colors.border,
                  }}
                />
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: config.bg,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Text
                    style={{ color: config.labelColor, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}
                  >
                    {config.label.toUpperCase()}
                  </Text>
                </View>
                <View
                  style={{
                    height: 1,
                    flex: 1,
                    backgroundColor: colors.border,
                  }}
                />
              </View>

              {badges.map(badge => (
                <BadgeCard
                  key={badge.id}
                  badge={badge}
                  earned={earnedIds.includes(badge.id)}
                />
              ))}
            </View>
          ))}
        </View>

        {/* ── Points footnote ── */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            padding: 14,
            borderRadius: 14,
            backgroundColor: colors.primary + '15',
            borderWidth: 1,
            borderColor: colors.primary + '30',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} style={{ marginTop: 1 }} />
          <Text style={{ color: colors.primary, fontSize: 12, lineHeight: 18, flex: 1 }}>
            Earn <Text style={{ color: colors.primary, fontWeight: '700' }}>10 points</Text> for every
            report accepted by authorities. Points accumulate and unlock higher-tier badges.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
