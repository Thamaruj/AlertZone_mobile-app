import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Modal,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../config/authConfig';
import { useTheme } from '../config/themeContext';
import { db } from '../services/firebase';
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import ReportDetailSheet from '../components/ReportDetailSheet';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type ReportStatus = 'PENDING' | 'ASSIGNED' | 'FIXING' | 'RESOLVED' | 'REJECTED';

interface Report {
  id: string;
  title: string;
  category: string;
  categoryId: string;
  categoryIcon: string;
  categoryColor: string;
  status: ReportStatus;
  upvoteCount: number;
  imageUrls?: string[];
  location: { address: string; latitude: number; longitude: number };
  createdAt: any;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all',               label: 'All',          icon: 'grid-outline',        color: '#0D8A72' },
  { id: 'road_traffic',      label: 'Roads',         icon: 'car-outline',         color: '#0D8A72' },
  { id: 'water_drainage',    label: 'Water',         icon: 'water-outline',       color: '#3B82F6' },
  { id: 'waste_environment', label: 'Waste',         icon: 'trash-outline',       color: '#34D399' },
  { id: 'social_safety',     label: 'Safety',        icon: 'shield-outline',      color: '#A78BFA' },
  { id: 'bridge_structural', label: 'Structural',    icon: 'git-network-outline', color: '#D97706' },
  { id: 'other',             label: 'Other',         icon: 'help-circle-outline', color: '#94A3B8' },
] as const;

const STATUS_FILTERS = ['All', 'Pending', 'Fixing', 'Resolved', 'Rejected'] as const;
type StatusFilter = typeof STATUS_FILTERS[number];

const DATE_FILTERS = [
  { id: 'all',    label: 'All Time' },
  { id: 'today',  label: 'Today' },
  { id: '7d',     label: 'Last 7 Days' },
  { id: '30d',    label: 'Last 30 Days' },
  { id: 'custom', label: 'Custom Range' },
] as const;
type DateFilterId = typeof DATE_FILTERS[number]['id'];

const INITIAL_PAGE_SIZE = 15;
const LOAD_MORE_SIZE = 20;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

function formatDate(ts: any): string {
  if (!ts) return '';
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diff < 60)  return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

// ─────────────────────────────────────────────
// Calendar Modal Component
// ─────────────────────────────────────────────
interface CalendarProps {
  value: Date | null;
  onChange: (date: Date) => void;
  onClose: () => void;
  title: string;
}

function CalendarModal({ value, onChange, onClose, title }: CalendarProps) {
  const [currentYear, setCurrentYear] = useState(value ? value.getFullYear() : new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(value ? value.getMonth() : new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(value ? value.getDate() : null);
  const { colors } = useTheme();

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDay(null);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push({ day: null, key: `empty-${i}` });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, key: `day-${d}` });
  }

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    const newDate = new Date(currentYear, currentMonth, day);
    onChange(newDate);
    onClose();
  };

  return (
    <Modal transparent visible animationType="fade">
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalBackdrop }]}>
        <View style={[styles.calendarContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.calendarTitle, { color: colors.text }]}>{title}</Text>
          
          <View style={styles.calendarHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </Pressable>
            <Text style={[styles.monthYearText, { color: colors.text }]}>
              {months[currentMonth]} {currentYear}
            </Text>
            <Pressable onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </Pressable>
          </View>

          <View style={styles.weekdaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={[styles.weekdayText, { color: colors.textSecondary }]}>{d}</Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {cells.map((cell) => {
              const isSelected = cell.day === selectedDay;
              return (
                <Pressable
                  key={cell.key}
                  disabled={cell.day === null}
                  onPress={() => cell.day && handleDaySelect(cell.day)}
                  style={[
                    styles.dayCell,
                    isSelected && [styles.selectedDayCell, { backgroundColor: colors.primary }]
                  ]}
                >
                  {cell.day && (
                    <Text
                      style={[
                        styles.dayText,
                        { color: colors.text },
                        isSelected && [styles.selectedDayText, { color: '#FFFFFF' }]
                      ]}
                    >
                      {cell.day}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          <Pressable onPress={onClose} style={[styles.closeCalendarButton, { borderColor: colors.border }]}>
            <Text style={[styles.closeCalendarText, { color: colors.textSecondary }]}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Report Card Component
// ─────────────────────────────────────────────
function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const { colors, isDark } = useTheme();

  const getStatusColorConfig = (status: ReportStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending', color: colors.warningText, bg: colors.warningBg };
      case 'ASSIGNED':
        return { label: 'Assigned', color: '#3B82F6', bg: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE' };
      case 'FIXING':
        return { label: 'Fixing', color: colors.primary, bg: colors.successBg };
      case 'RESOLVED':
        return { label: 'Resolved', color: colors.successText, bg: colors.successBg };
      case 'REJECTED':
        return { label: 'Rejected', color: colors.dangerText, bg: colors.dangerBg };
      default:
        return { label: 'Pending', color: colors.warningText, bg: colors.warningBg };
    }
  };

  const cfg = getStatusColorConfig(report.status);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 10,
      }}
      className="active:opacity-85"
    >
      {/* Image / Icon preview */}
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: colors.border,
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {report.imageUrls && report.imageUrls.length > 0 ? (
          <Image source={{ uri: report.imageUrls[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: (report.categoryColor ?? colors.primary) + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image source={require('../assets/images/iconAlerZone-Bg-none.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
          </View>
        )}
      </View>

      {/* Title & Details */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>
          {report.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>
          {report.location?.address ?? 'Sri Lanka'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {formatDate(report.createdAt)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="arrow-up-circle-outline" size={12} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {report.upvoteCount} upvotes
            </Text>
          </View>
        </View>
      </View>

      {/* Status Pill & Arrow */}
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <View style={{ backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
          <Text style={{ color: cfg.color, fontSize: 10, fontWeight: 'bold' }}>{cfg.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function UpvotedReportsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [reports, setReports]               = useState<Report[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStatus, setActiveStatus]     = useState<StatusFilter>('All');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  // Date filter state
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilterId>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate]   = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker]   = useState(false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  // Reset visible count when any filter changes
  useEffect(() => {
    setVisibleCount(INITIAL_PAGE_SIZE);
  }, [activeCategory, activeStatus, activeDateFilter, customStartDate, customEndDate]);

  const clearCustomRange = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    setActiveDateFilter('all');
  };

  // ── Subscribe to all reports the user has upvoted ──
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collectionGroup(db, 'upvotes'),
      where('uid', '==', user.uid),
    );

    const unsub = onSnapshot(q, async (snap) => {
      const reportIds = [...new Set(
        snap.docs
          .map((d) => d.ref.parent?.parent?.id)
          .filter(Boolean) as string[]
      )];

      if (reportIds.length === 0) {
        setReports([]);
        setLoading(false);
        return;
      }

      try {
        const fetched = await Promise.all(
          reportIds.map(async (id) => {
            const snap = await getDoc(doc(db, 'reports', id));
            if (!snap.exists()) return null;
            const data = snap.data();
            return {
              id: snap.id,
              title: data.title ?? data.category ?? 'Report',
              category: data.category ?? '',
              categoryId: data.categoryId ?? 'other',
              categoryIcon: data.categoryIcon ?? 'help-circle-outline',
              categoryColor: data.categoryColor ?? '#0D8A72',
              status: (data.status ?? 'PENDING') as ReportStatus,
              upvoteCount: data.upvoteCount ?? 0,
              imageUrls: data.imageUrls ?? [],
              location: data.location ?? { address: '', latitude: 0, longitude: 0 },
              createdAt: data.createdAt,
            } as Report;
          })
        );

        setReports(fetched.filter(Boolean) as Report[]);
      } catch (err) {
        console.error('Error fetching upvoted reports:', err);
      }
      setLoading(false);
    }, (err) => {
      console.error('Upvoted reports subscription error:', err);
      setLoading(false);
    });

    return unsub;
  }, [user?.uid]);

  // ── Apply filters ──
  const filtered = reports.filter((r) => {
    if (activeCategory !== 'all' && r.categoryId !== activeCategory) return false;
    if (activeStatus === 'Pending' && r.status !== 'PENDING') return false;
    if (activeStatus === 'Fixing' && r.status !== 'FIXING' && r.status !== 'ASSIGNED') return false;
    if (activeStatus === 'Resolved' && r.status !== 'RESOLVED') return false;
    if (activeStatus === 'Rejected' && r.status !== 'REJECTED') return false;

    // Date filter
    const reportDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    if (activeDateFilter === 'today') {
      const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
      if (reportDate < startOfToday) return false;
    } else if (activeDateFilter === '7d') {
      const sevenAgo = new Date(); sevenAgo.setDate(sevenAgo.getDate() - 7);
      if (reportDate < sevenAgo) return false;
    } else if (activeDateFilter === '30d') {
      const thirtyAgo = new Date(); thirtyAgo.setDate(thirtyAgo.getDate() - 30);
      if (reportDate < thirtyAgo) return false;
    } else if (activeDateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate); start.setHours(0, 0, 0, 0);
        if (reportDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate); end.setHours(23, 59, 59, 999);
        if (reportDate > end) return false;
      }
    }
    return true;
  });

  const visibleReports = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center gap-3 px-5 mb-5">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: pressed ? colors.card : colors.border,
              alignItems: 'center', justifyContent: 'center',
            })}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
          <View className="flex-1">
            <Text className="text-xl font-bold tracking-tight" style={{ color: colors.text }}>Upvoted Issues</Text>
            <Text className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>Track issues supported by you</Text>
          </View>
          <View style={{ backgroundColor: colors.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>{filtered.length} Upvoted</Text>
          </View>
        </View>

        {/* ── Category Filters ── */}
        <View className="mb-4">
          <Text className="text-xs font-bold px-5 mb-2 uppercase tracking-wide" style={{ color: colors.textSecondary }}>Categories</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  className="flex-row items-center px-4 py-2 rounded-full gap-1.5"
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Ionicons name={cat.icon as any} size={14} color={isActive ? '#FFFFFF' : cat.color} />
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#FFFFFF' : colors.textSecondary }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Status Filters ── */}
        <View className="mb-4">
          <Text className="text-xs font-bold px-5 mb-2 uppercase tracking-wide" style={{ color: colors.textSecondary }}>Status</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {STATUS_FILTERS.map((s) => {
              const isActive = activeStatus === s;
              return (
                <Pressable
                  key={s}
                  onPress={() => setActiveStatus(s)}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#FFFFFF' : colors.textSecondary }}>
                    {s}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Date Filters ── */}
        <View className="mb-4">
          <Text className="text-xs font-bold px-5 mb-2 uppercase tracking-wide" style={{ color: colors.textSecondary }}>Date</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          >
            {DATE_FILTERS.map((df) => {
              const isActive = activeDateFilter === df.id;
              return (
                <Pressable
                  key={df.id}
                  onPress={() => setActiveDateFilter(df.id)}
                  className="px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: isActive ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: isActive ? colors.primary : colors.border,
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#FFFFFF' : colors.textSecondary }}>
                    {df.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Custom Range Inputs ── */}
        {activeDateFilter === 'custom' && (
          <View style={{ marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-xs font-bold uppercase tracking-wide" style={{ color: colors.text }}>Select Date Range</Text>
              {(customStartDate || customEndDate) && (
                <Pressable onPress={clearCustomRange} className="active:opacity-75">
                  <Text className="text-xs font-semibold" style={{ color: colors.dangerText }}>Reset</Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowStartPicker(true)}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                }}
                className="active:opacity-75"
              >
                <View>
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textMuted }}>Start Date</Text>
                  <Text className="text-sm font-semibold mt-0.5" style={{ color: colors.text }}>
                    {customStartDate ? customStartDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </Pressable>

              <Pressable
                onPress={() => setShowEndPicker(true)}
                style={{
                  flex: 1, padding: 12, borderRadius: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                }}
                className="active:opacity-75"
              >
                <View>
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textMuted }}>End Date</Text>
                  <Text className="text-sm font-semibold mt-0.5" style={{ color: colors.text }}>
                    {customEndDate ? customEndDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Main List ── */}
        <View className="px-5 mt-2">
          {loading ? (
            <View className="items-center py-16">
              <ActivityIndicator color={colors.primary} size="large" />
              <Text className="mt-4 text-sm" style={{ color: colors.textMuted }}>Loading upvoted reports…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="items-center py-16 border rounded-3xl p-6">
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Ionicons name="arrow-up-circle-outline" size={32} color={colors.primary} />
              </View>
              <Text className="font-bold text-base" style={{ color: colors.text }}>No upvoted reports</Text>
              <Text className="text-sm text-center mt-1 leading-5" style={{ color: colors.textMuted }}>
                Issues you support or upvote will be shown here. Use filters to adjust search.
              </Text>
            </View>
          ) : (
            <>
              {/* Results count text */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs" style={{ color: colors.textMuted }}>
                  Showing <Text className="font-bold" style={{ color: colors.primary }}>{visibleReports.length}</Text> of <Text className="font-semibold" style={{ color: colors.text }}>{filtered.length}</Text> reports
                </Text>
              </View>

              {visibleReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onPress={() => setSelectedReportId(report.id)}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <Pressable
                  onPress={() => setVisibleCount((c) => c + LOAD_MORE_SIZE)}
                  style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}
                  className="mt-2 mb-4 py-4 rounded-2xl items-center justify-center active:opacity-75"
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="chevron-down-circle-outline" size={20} color={colors.primary} />
                    <Text className="font-bold text-sm" style={{ color: colors.primary }}>
                      Load More ({Math.min(LOAD_MORE_SIZE, filtered.length - visibleCount)} more)
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* End indicator */}
              {!hasMore && filtered.length > INITIAL_PAGE_SIZE && (
                <View className="items-center py-4">
                  <Text className="text-xs" style={{ color: colors.textMuted }}>All {filtered.length} reports shown</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* ── Start Date Picker Modal ── */}
      {showStartPicker && (
        <CalendarModal
          title="Select Start Date"
          value={customStartDate}
          onChange={(d) => setCustomStartDate(d)}
          onClose={() => setShowStartPicker(false)}
        />
      )}

      {/* ── End Date Picker Modal ── */}
      {showEndPicker && (
        <CalendarModal
          title="Select End Date"
          value={customEndDate}
          onChange={(d) => setCustomEndDate(d)}
          onClose={() => setShowEndPicker(false)}
        />
      )}

      <ReportDetailSheet
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────
// Calendar & Modals Custom Styling
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    alignItems: 'center',
  },
  calendarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  arrowButton: {
    padding: 8,
  },
  monthYearText: {
    fontSize: 16,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedDayCell: {
    // dynamically set in component
  },
  dayText: {
    fontSize: 14,
  },
  selectedDayText: {
    fontWeight: 'bold',
  },
  closeCalendarButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  closeCalendarText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
