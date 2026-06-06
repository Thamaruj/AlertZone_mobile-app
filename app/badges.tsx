import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../config/authConfig';
import { BADGE_DEFINITIONS, BadgeDefinition } from '../services/gamification.service';

// ─────────────────────────────────────────────────────────────────
// Tier label config
// ─────────────────────────────────────────────────────────────────
const TIER_ORDER = ['bronze', 'silver', 'gold', 'diamond'] as const;

const TIER_CONFIG: Record<string, { label: string; labelColor: string; bg: string; borderColor: string }> = {
  bronze:  { label: 'Bronze',  labelColor: '#CD7F32', bg: '#FFF7ED', borderColor: '#CD7F3240' },
  silver:  { label: 'Silver',  labelColor: '#9CA3AF', bg: '#F3F4F6', borderColor: '#9CA3AF40' },
  gold:    { label: 'Gold',    labelColor: '#D97706', bg: '#FEF3C7', borderColor: '#D9770640' },
  diamond: { label: 'Diamond', labelColor: '#0D8A72', bg: '#E6F7F3', borderColor: '#0D8A7240' },
};

// ─────────────────────────────────────────────────────────────────
// Single badge card
// ─────────────────────────────────────────────────────────────────
function BadgeCard({ badge, earned }: { badge: BadgeDefinition; earned: boolean }) {
  const tierCfg = TIER_CONFIG[badge.tier];
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: earned ? '#FFFFFF' : '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: earned ? badge.color + '30' : '#E8E8E8',
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
          backgroundColor: earned ? badge.bg : '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: earned ? badge.color + '50' : '#E8E8E8',
          marginRight: 14,
        }}
      >
        <Ionicons name={badge.icon as any} size={24} color={earned ? badge.color : '#B2B2B2'} />
      </View>

      {/* Name + description */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Text style={{ color: earned ? '#1A1A1A' : '#9CA3AF', fontWeight: '700', fontSize: 14 }}>
            {badge.name}
          </Text>
          {/* Tier chip */}
          <View
            style={{
              paddingHorizontal: 7,
              paddingVertical: 2,
              borderRadius: 6,
              backgroundColor: earned ? tierCfg.bg : '#F3F4F6',
              borderWidth: 1,
              borderColor: earned ? tierCfg.borderColor : '#E8E8E8',
            }}
          >
            <Text style={{ color: earned ? tierCfg.labelColor : '#B2B2B2', fontSize: 9, fontWeight: '700' }}>
              {tierCfg.label.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text style={{ color: earned ? '#4B5563' : '#6B7280', fontSize: 12, lineHeight: 17 }}>
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
          <Ionicons name="lock-closed" size={16} color="#B2B2B2" />
        )}
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────
// Earned badge showcase (3-column grid)
// ─────────────────────────────────────────────────────────────────
function EarnedBadgeGrid({ earnedBadges }: { earnedBadges: BadgeDefinition[] }) {
  if (earnedBadges.length === 0) {
    return (
      <View
        style={{
          backgroundColor: '#F9FAFB',
          borderRadius: 16,
          borderWidth: 1,
          borderColor: '#E8E8E8',
          padding: 28,
          alignItems: 'center',
        }}
      >
        <Ionicons name="ribbon-outline" size={36} color="#B2B2B2" />
        <Text style={{ color: '#1A1A1A', fontSize: 14, fontWeight: '600', marginTop: 10 }}>
          No badges earned yet
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
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
                  backgroundColor: badge.bg,
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
                style={{ color: '#6B7280', fontSize: 10, textAlign: 'center', lineHeight: 13 }}
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

  const earnedIds = profile?.badges ?? [];
  const earnedBadges = BADGE_DEFINITIONS.filter(b => earnedIds.includes(b.id));

  // Group all badges by tier for the "How to Earn" section
  const badgesByTier = TIER_ORDER.map(tier => ({
    tier,
    config: TIER_CONFIG[tier],
    badges: BADGE_DEFINITIONS.filter(b => b.tier === tier),
  }));

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
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
              backgroundColor: '#FFFFFF',
              borderWidth: 1,
              borderColor: '#E8E8E8',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 14,
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#0D8A72" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#1A1A1A', fontSize: 22, fontWeight: '800' }}>Badges</Text>
            <Text style={{ color: '#6B7280', fontSize: 13, marginTop: 1 }}>
              {earnedBadges.length} of {BADGE_DEFINITIONS.length} earned
            </Text>
          </View>
          {/* Points chip */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderWidth: 1,
              borderColor: '#E8E8E8',
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
            style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '700', marginBottom: 14 }}
          >
            ✨ Your Badges
          </Text>
          <EarnedBadgeGrid earnedBadges={earnedBadges} />
        </View>

        {/* ── Progress bar ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 28 }}>
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#E8E8E8',
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#6B7280', fontSize: 12, fontWeight: '600' }}>
                Collection Progress
              </Text>
              <Text style={{ color: '#0D8A72', fontSize: 12, fontWeight: '700' }}>
                {earnedBadges.length}/{BADGE_DEFINITIONS.length}
              </Text>
            </View>
            <View
              style={{
                height: 8,
                backgroundColor: '#E8E8E8',
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: `${Math.round((earnedBadges.length / BADGE_DEFINITIONS.length) * 100)}%`,
                  backgroundColor: '#0D8A72',
                  borderRadius: 4,
                }}
              />
            </View>
          </View>
        </View>

        {/* ── How to Earn (All Badges by Tier) ── */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text
            style={{ color: '#1A1A1A', fontSize: 16, fontWeight: '700', marginBottom: 14 }}
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
                    backgroundColor: config.borderColor,
                  }}
                />
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 8,
                    backgroundColor: config.bg,
                    borderWidth: 1,
                    borderColor: config.borderColor,
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
                    backgroundColor: config.borderColor,
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
            backgroundColor: '#E6F7F3',
            borderWidth: 1,
            borderColor: '#0D8A7230',
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 10,
          }}
        >
          <Ionicons name="information-circle-outline" size={18} color="#0D8A72" style={{ marginTop: 1 }} />
          <Text style={{ color: '#0D8A72', fontSize: 12, lineHeight: 18, flex: 1 }}>
            Earn <Text style={{ color: '#0D8A72', fontWeight: '700' }}>10 points</Text> for every
            report accepted by authorities. Points accumulate and unlock higher-tier badges.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
