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
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../config/authConfig';
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
const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string }> = {
  PENDING:  { label: 'Pending',  color: '#D97706', bg: '#FEF3C7' },
  ASSIGNED: { label: 'Assigned', color: '#3B82F6', bg: '#DBEAFE' },
  FIXING:   { label: 'Fixing',   color: '#0D8A72', bg: '#E6F7F3' },
  RESOLVED: { label: 'Resolved', color: '#059669', bg: '#D1FAE5' },
  REJECTED: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2' },
};

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

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const handlePrevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
    setSelectedDay(null);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, key: `empty-${i}` });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, key: `day-${d}` });

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    onChange(new Date(currentYear, currentMonth, day));
    onClose();
  };

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>{title}</Text>
          <View style={styles.calendarHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={20} color="#0D8A72" />
            </Pressable>
            <Text style={styles.monthYearText}>{months[currentMonth]} {currentYear}</Text>
            <Pressable onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color="#0D8A72" />
            </Pressable>
          </View>
          <View style={styles.weekdaysRow}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <Text key={d} style={styles.weekdayText}>{d}</Text>
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
                  style={[styles.dayCell, isSelected && styles.selectedDayCell]}
                >
                  {cell.day && (
                    <Text style={[styles.dayText, isSelected && styles.selectedDayText]}>
                      {cell.day}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
          <Pressable onPress={onClose} style={styles.closeCalendarButton}>
            <Text style={styles.closeCalendarText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Report Card
// ─────────────────────────────────────────────
function ReportCard({ report, onPress }: { report: Report; onPress: () => void }) {
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING;
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E8E8E8',
        marginBottom: 10,
      }}
    >
      {/* Image / Icon preview */}
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#1A1A1A',
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
              backgroundColor: (report.categoryColor ?? '#0D8A72') + '22',
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
        <Text style={{ color: '#1A1A1A', fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>
          {report.title}
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>
          {report.location?.address ?? 'Sri Lanka'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="time-outline" size={12} color="#6B7280" />
            <Text style={{ color: '#6B7280', fontSize: 11 }}>
              {formatDate(report.createdAt)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="arrow-up-circle-outline" size={12} color="#6B7280" />
            <Text style={{ color: '#6B7280', fontSize: 11 }}>
              {report.upvoteCount ?? 0} upvotes
            </Text>
          </View>
        </View>
      </View>

      {/* Status Pill & Arrow */}
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <View style={{ backgroundColor: cfg.bg, borderWidth: 1, borderColor: cfg.color, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
          <Text style={{ color: cfg.color, fontSize: 10, fontWeight: 'bold' }}>{cfg.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#E8E8E8" />
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
      // Extract unique report IDs from parent paths
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

      // Fetch each report individually (handles any list size)
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
  const hasMore = visibleCount < filtered.length;

  return (
    <LinearGradient colors={['#F5F5F5', '#FAFAFA', '#F5F5F5']} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 60 }}
      >
        {/* ── Header ── */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 20, gap: 12 }}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: pressed ? '#FFFFFF' : '#E8E8E8',
              alignItems: 'center', justifyContent: 'center',
            })}
          >
            <Ionicons name="arrow-back" size={20} color="#0D8A72" />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#1A1A1A', fontSize: 20, fontWeight: '800' }}>My Upvoted Reports</Text>
            <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>{"Issues you've supported in your community"}</Text>
          </View>
          <View style={{ backgroundColor: '#E8E8E8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
            <Text style={{ color: '#0D8A72', fontSize: 12, fontWeight: '700' }}>{filtered.length}</Text>
          </View>
        </View>

        {/* ── Category Filter ── */}
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 }}>
            Category
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {CATEGORIES.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveCategory(cat.id)}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: isActive ? '#0D8A72' : '#FFFFFF',
                    borderWidth: 1, borderColor: isActive ? '#0D8A72' : '#E8E8E8',
                  }}
                >
                  <Ionicons name={cat.icon as any} size={13} color={isActive ? '#F5F5F5' : cat.color} />
                  <Text style={{ color: isActive ? '#F5F5F5' : '#6B7280', fontSize: 12, fontWeight: '600' }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Status Filter ── */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 }}>
            Status
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {STATUS_FILTERS.map((sf) => {
              const isActive = activeStatus === sf;
              return (
                <Pressable
                  key={sf}
                  onPress={() => setActiveStatus(sf)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: isActive ? '#0D8A72' : '#FFFFFF',
                    borderWidth: 1, borderColor: isActive ? '#0D8A72' : '#E8E8E8',
                  }}
                >
                  <Text style={{ color: isActive ? '#F5F5F5' : '#6B7280', fontSize: 12, fontWeight: '600' }}>{sf}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Date Filter ── */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 }}>
            Date Filter
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {DATE_FILTERS.map((df) => {
              const isActive = activeDateFilter === df.id;
              return (
                <Pressable
                  key={df.id}
                  onPress={() => setActiveDateFilter(df.id)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                    backgroundColor: isActive ? '#0D8A72' : '#FFFFFF',
                    borderWidth: 1, borderColor: isActive ? '#0D8A72' : '#E8E8E8',
                  }}
                >
                  <Text style={{ color: isActive ? '#F5F5F5' : '#6B7280', fontSize: 12, fontWeight: '600' }}>
                    {df.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Custom Date Range Picker ── */}
        {activeDateFilter === 'custom' && (
          <View style={{ marginHorizontal: 20, marginBottom: 16, padding: 16, borderRadius: 18, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#E8E8E8' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#1A1A1A', fontSize: 10, fontWeight: '700', letterSpacing: 1.5, textTransform: 'uppercase' }}>Select Date Range</Text>
              {(customStartDate || customEndDate) && (
                <Pressable onPress={clearCustomRange} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                  <Text style={{ color: '#DC2626', fontSize: 12, fontWeight: '600' }}>Reset</Text>
                </Pressable>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable
                onPress={() => setShowStartPicker(true)}
                style={({ pressed }) => ({
                  flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#E8E8E8',
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.75 : 1
                })}
              >
                <View>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Start Date</Text>
                  <Text style={{ color: '#1A1A1A', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                    {customStartDate ? customStartDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color="#0D8A72" />
              </Pressable>

              <Pressable
                onPress={() => setShowEndPicker(true)}
                style={({ pressed }) => ({
                  flex: 1, padding: 12, borderRadius: 12, backgroundColor: '#1A1A1A', borderWidth: 1, borderColor: '#E8E8E8',
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', opacity: pressed ? 0.75 : 1
                })}
              >
                <View>
                  <Text style={{ color: '#6B7280', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>End Date</Text>
                  <Text style={{ color: '#1A1A1A', fontSize: 14, fontWeight: '600', marginTop: 2 }}>
                    {customEndDate ? customEndDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color="#0D8A72" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Report List ── */}
        <View style={{ paddingHorizontal: 20 }}>
          {loading ? (
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <ActivityIndicator color="#0D8A72" size="large" />
              <Text style={{ color: '#6B7280', marginTop: 12, fontSize: 13 }}>Loading your upvoted reports…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={{
              alignItems: 'center', paddingVertical: 50,
              backgroundColor: '#1A1A1A', borderRadius: 24, padding: 30,
              borderWidth: 1, borderColor: '#E8E8E8',
            }}>
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Ionicons name="arrow-up-circle-outline" size={32} color="#0D8A72" />
              </View>
              <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 15, textAlign: 'center' }}>
                {reports.length === 0 ? 'No upvoted reports yet' : 'No matches found'}
              </Text>
              <Text style={{ color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>
                {reports.length === 0
                  ? 'Tap the upvote button on any nearby issue to support it.'
                  : 'Try changing your category or status filter.'}
              </Text>
            </View>
          ) : (
            <>
              {/* Results count */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <Text style={{ color: '#6B7280', fontSize: 12 }}>
                  Showing <Text style={{ color: '#0D8A72', fontWeight: 'bold' }}>{visibleReports.length}</Text> of <Text style={{ color: '#1A1A1A', fontWeight: '600' }}>{filtered.length}</Text> reports
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
                  style={({ pressed }) => ({
                    marginTop: 8, marginBottom: 16, paddingVertical: 16, borderRadius: 18,
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: '#E8E8E8', backgroundColor: '#1A1A1A',
                    opacity: pressed ? 0.75 : 1
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="chevron-down-circle-outline" size={20} color="#0D8A72" />
                    <Text style={{ color: '#0D8A72', fontWeight: 'bold', fontSize: 14 }}>
                      Load More ({Math.min(LOAD_MORE_SIZE, filtered.length - visibleCount)} more)
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* End indicator */}
              {!hasMore && filtered.length > INITIAL_PAGE_SIZE && (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Text style={{ color: '#9CA3AF', fontSize: 12 }}>All {filtered.length} reports shown</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Calendar Modals */}
      {showStartPicker && (
        <CalendarModal
          title="Select Start Date"
          value={customStartDate}
          onChange={(d) => setCustomStartDate(d)}
          onClose={() => setShowStartPicker(false)}
        />
      )}
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
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────
// Calendar Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  calendarContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    padding: 20,
    alignItems: 'center',
  },
  calendarTitle: {
    color: '#1A1A1A',
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
  arrowButton: { padding: 8 },
  monthYearText: { color: '#1A1A1A', fontSize: 16, fontWeight: '600' },
  weekdaysRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    color: '#6B7280',
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%' },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedDayCell: { backgroundColor: '#0D8A72' },
  dayText: { color: '#4A4A4A', fontSize: 14 },
  selectedDayText: { color: '#1A1A1A', fontWeight: 'bold' },
  closeCalendarButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  closeCalendarText: { color: '#6B7280', fontWeight: '600', fontSize: 14 },
});
