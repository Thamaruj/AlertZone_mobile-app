import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
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
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';

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
  description: string;
  status: ReportStatus;
  upvoteCount: number;
  imageUrls: string[];
  location: {
    address: string;
    latitude: number;
    longitude: number;
    province?: string;
    district?: string;
    localGovernmentArea?: string;
  };
  resolutionNote?: string;
  createdAt: any;
  updatedAt?: any;
  isArchived?: boolean;
  statusHistory: Array<{ status: string; changedAt: any; changedBy: string; note?: string }>;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:  { label: 'Pending',  color: '#D97706', bg: '#FEF3C7', icon: 'time-outline'             },
  ASSIGNED: { label: 'Assigned', color: '#3B82F6', bg: '#DBEAFE', icon: 'person-add-outline'        },
  FIXING:   { label: 'Fixing',   color: '#0D8A72', bg: '#E6F7F3', icon: 'construct-outline'         },
  RESOLVED: { label: 'Resolved', color: '#059669', bg: '#D1FAE5', icon: 'checkmark-circle-outline'  },
  REJECTED: { label: 'Rejected', color: '#DC2626', bg: '#FEE2E2', icon: 'close-circle-outline'      },
};

const TIMELINE_STATUSES: ReportStatus[] = ['PENDING', 'ASSIGNED', 'FIXING', 'RESOLVED'];

const CATEGORIES = [
  { id: 'all',               label: 'All Categories',     icon: 'grid-outline',          color: '#0D8A72' },
  { id: 'road_traffic',      label: 'Road & Traffic',     icon: 'car-outline',          color: '#0D8A72' },
  { id: 'water_drainage',    label: 'Water & Drainage',   icon: 'water-outline',         color: '#3B82F6' },
  { id: 'waste_environment', label: 'Waste & Environment',icon: 'trash-outline',        color: '#34D399' },
  { id: 'social_safety',     label: 'Social Safety',      icon: 'shield-outline',        color: '#A78BFA' },
  { id: 'bridge_structural', label: 'Bridge & Structural',icon: 'git-network-outline',   color: '#D97706' },
  { id: 'other',             label: 'Other',              icon: 'help-circle-outline',   color: '#94A3B8' },
] as const;

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

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

// ─────────────────────────────────────────────
// Custom Calendar Modal Component
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

  // Build grid cells
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
      <View style={styles.modalOverlay}>
        <View style={styles.calendarContainer}>
          <Text style={styles.calendarTitle}>{title}</Text>
          
          <View style={styles.calendarHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-back" size={20} color="#0D8A72" />
            </Pressable>
            <Text style={styles.monthYearText}>
              {months[currentMonth]} {currentYear}
            </Text>
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
                  style={[
                    styles.dayCell,
                    isSelected && styles.selectedDayCell
                  ]}
                >
                  {cell.day && (
                    <Text
                      style={[
                        styles.dayText,
                        isSelected && styles.selectedDayText
                      ]}
                    >
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
      className="active:opacity-85"
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
// Report Detail Modal
// ─────────────────────────────────────────────
function ReportDetailModal({ report, onClose }: { report: Report | null; onClose: () => void }) {
  if (!report) return null;
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING;
  const timelineIndex = TIMELINE_STATUSES.indexOf(report.status);

  return (
    <Modal visible={!!report} animationType="slide" transparent={false}>
      <LinearGradient colors={['#F5F5F5', '#FAFAFA', '#F5F5F5']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
          <View className="px-5 pt-14 pb-4 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="arrow-back" size={24} color="#0D8A72" />
            </Pressable>
            <Text className="text-[#1A1A1A] text-xl font-bold flex-1">Archived Report Details</Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
              <Text className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          {report.imageUrls?.[0] && (
            <View className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ height: 180 }}>
              <Image source={{ uri: report.imageUrls[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          )}

          <View className="px-5 mb-4">
            <Text className="text-[#0D8A72] text-xs font-bold mb-1">
              Ref: {report.id}
            </Text>
            <Text className="text-[#1A1A1A] text-2xl font-bold">{report.title}</Text>
            <View className="flex-row items-center mt-2 gap-2">
              <Ionicons name={report.categoryIcon as any} size={13} color="#6B7280" />
              <Text className="text-[#9CA3AF] text-xs">{formatDate(report.createdAt)}</Text>
            </View>
          </View>

          <View className="px-5 gap-3 mb-4">
            <View className="bg-white rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#E8E8E8' }}>
              <Text className="text-[#1A1A1A] font-bold mb-4">Status Timeline</Text>
              {report.status === 'REJECTED' ? (
                <>
                  {(['PENDING'] as ReportStatus[]).map((s) => {
                    const sc = STATUS_CONFIG[s];
                    return (
                      <View key={s} className="flex-row items-center mb-3">
                        <View className="w-8 h-8 rounded-full items-center justify-center mr-3" style={{ backgroundColor: sc.bg }}>
                          <Ionicons name={sc.icon as any} size={16} color={sc.color} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-sm font-semibold" style={{ color: sc.color }}>{sc.label}</Text>
                        </View>
                        <Ionicons name="checkmark" size={14} color={sc.color} />
                      </View>
                    );
                  })}
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-[#FEE2E2]">
                      <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#DC2626] font-semibold text-sm">Rejected</Text>
                      <Text className="text-[#9CA3AF] text-xs">Current status</Text>
                    </View>
                    <View className="w-2 h-2 rounded-full bg-[#DC2626]" />
                  </View>
                </>
              ) : (
                TIMELINE_STATUSES.map((s, i) => {
                  const sc = STATUS_CONFIG[s];
                  const done = timelineIndex >= i;
                  const isCurrent = report.status === s;
                  return (
                    <View key={s} className="flex-row items-center mb-3">
                      <View style={{ alignItems: 'center', marginRight: 12 }}>
                        <View className="w-8 h-8 rounded-full items-center justify-center"
                          style={{ backgroundColor: done ? sc.bg : '#F0F0F0' }}>
                          <Ionicons name={sc.icon as any} size={16} color={done ? sc.color : '#E8E8E8'} />
                        </View>
                        {i < TIMELINE_STATUSES.length - 1 && (
                          <View style={{
                            width: 2, height: 16, marginTop: 2,
                            backgroundColor: done ? sc.color + '40' : '#E8E8E8',
                          }} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: done ? sc.color : '#9CA3AF' }}>
                          {sc.label}
                        </Text>
                        {isCurrent && <Text className="text-[#9CA3AF] text-xs">Current status</Text>}
                      </View>
                      {isCurrent && <View className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />}
                      {done && !isCurrent && <Ionicons name="checkmark" size={14} color={sc.color} />}
                    </View>
                  );
                })
              )}
            </View>

            <View className="bg-white rounded-2xl p-4 flex-row items-start gap-3"
              style={{ borderWidth: 1, borderColor: '#E8E8E8' }}>
              <View className="w-8 h-8 rounded-lg bg-[#E8E8E8] items-center justify-center">
                <Ionicons name="location-outline" size={16} color="#0D8A72" />
              </View>
              <View className="flex-1">
                <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide mb-1">Location</Text>
                <Text className="text-[#1A1A1A] text-sm leading-5">{report.location?.address ?? 'Unknown'}</Text>
                {(report.location?.province || report.location?.district || report.location?.localGovernmentArea) && (
                  <View className="mt-2 pt-2 border-t border-[#E8E8E8] gap-1">
                    {report.location?.province && (
                      <Text className="text-[#4A4A4A] text-xs">
                        <Text className="text-[#9CA3AF] font-semibold">Province: </Text>{report.location.province}
                      </Text>
                    )}
                    {report.location?.district && (
                      <Text className="text-[#4A4A4A] text-xs">
                        <Text className="text-[#9CA3AF] font-semibold">District: </Text>{report.location.district}
                      </Text>
                    )}
                    {report.location?.localGovernmentArea && (
                      <Text className="text-[#4A4A4A] text-xs">
                        <Text className="text-[#9CA3AF] font-semibold">LGA: </Text>{report.location.localGovernmentArea}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View className="bg-white rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#E8E8E8' }}>
              <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide mb-2">Description</Text>
              <Text className="text-[#1A1A1A] text-sm leading-6">{report.description}</Text>
            </View>

            {report.resolutionNote && (
              <View className="bg-white rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#E8E8E8' }}>
                <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold tracking-wide mb-2">
                  {report.status === 'REJECTED' ? 'Rejection Reason' : 'Resolution Note'}
                </Text>
                <Text className="text-[#1A1A1A] text-sm leading-6">{report.resolutionNote}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Main Archive Screen
// ─────────────────────────────────────────────
export default function ArchiveScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();

  const [reports, setReports] = useState<Report[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilterId>('all');
  
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  // ── Subscribe to user's archived reports ──
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reports'),
      where('uid', '==', user.uid),
      where('isArchived', '==', true),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const data: Report[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Report, 'id'>),
        }));
        setReports(data);
        setFirestoreLoading(false);
      },
      (err) => {
        console.error('❌ Archive Firestore error:', err);
        setFirestoreLoading(false);
      },
    );

    return unsub;
  }, [user]);

  // Update selected report if database updates
  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find((r) => r.id === selectedReport.id);
      if (updated) setSelectedReport(updated);
    }
  }, [reports]);

  // Filtering implementation
  const filtered = reports.filter((r) => {
    // 1. Category Filter
    if (activeCategory !== 'all' && r.categoryId !== activeCategory) {
      return false;
    }

    // 2. Date Filter
    const reportDate = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    const now = new Date();

    if (activeDateFilter === 'today') {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      if (reportDate < startOfToday) return false;
    } else if (activeDateFilter === '7d') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      if (reportDate < sevenDaysAgo) return false;
    } else if (activeDateFilter === '30d') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      if (reportDate < thirtyDaysAgo) return false;
    } else if (activeDateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        if (reportDate < start) return false;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        if (reportDate > end) return false;
      }
    }

    return true;
  });

  const clearCustomRange = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    setActiveDateFilter('all');
  };

  // Reset pagination when filters change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setVisibleCount(INITIAL_PAGE_SIZE); }, [activeCategory, activeDateFilter, customStartDate, customEndDate]);

  const visibleReports = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <LinearGradient colors={['#F5F5F5', '#FAFAFA', '#F5F5F5']} style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 60 }}
      >
        {/* ── Header ── */}
        <View className="flex-row items-center px-5 mb-5 gap-3">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-white items-center justify-center active:opacity-75">
            <Ionicons name="arrow-back" size={20} color="#0D8A72" />
          </Pressable>
          <View className="flex-1">
            <Text className="text-[#1A1A1A] text-xl font-bold tracking-tight">Archive</Text>
            <Text className="text-[#9CA3AF] text-xs mt-0.5">View resolved and historical reports</Text>
          </View>
          <View className="bg-[#E8E8E8] px-3 py-1.5 rounded-full">
            <Text className="text-[#0D8A72] text-xs font-bold">{filtered.length} Found</Text>
          </View>
        </View>

        {/* ── Category Filter List ── */}
        <View className="mb-4">
          <Text className="text-[#6B7280] text-xs font-bold px-5 mb-2 uppercase tracking-wide">Category</Text>
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
                    backgroundColor: isActive ? '#0D8A72' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isActive ? '#0D8A72' : '#E8E8E8',
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={isActive ? '#F5F5F5' : cat.color}
                  />
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#F5F5F5' : '#6B7280' }}>
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Date Filters ── */}
        <View className="mb-4">
          <Text className="text-[#6B7280] text-xs font-bold px-5 mb-2 uppercase tracking-wide">Date Filter</Text>
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
                    backgroundColor: isActive ? '#0D8A72' : '#FFFFFF',
                    borderWidth: 1,
                    borderColor: isActive ? '#0D8A72' : '#E8E8E8',
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#F5F5F5' : '#6B7280' }}>
                    {df.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Custom Date Picker Inputs ── */}
        {activeDateFilter === 'custom' && (
          <View className="mx-5 mb-4 p-4 rounded-2xl bg-white border border-[#E8E8E8]">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[#1A1A1A] text-xs font-bold uppercase tracking-wide">Select Date Range</Text>
              {(customStartDate || customEndDate) && (
                <Pressable onPress={clearCustomRange} className="active:opacity-75">
                  <Text className="text-[#DC2626] text-xs font-semibold">Reset</Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowStartPicker(true)}
                className="flex-1 p-3 rounded-xl bg-white border border-[#E8E8E8] flex-row justify-between items-center active:opacity-75"
              >
                <View>
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold">Start Date</Text>
                  <Text className="text-[#1A1A1A] text-sm font-semibold mt-0.5">
                    {customStartDate ? customStartDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color="#0D8A72" />
              </Pressable>

              <Pressable
                onPress={() => setShowEndPicker(true)}
                className="flex-1 p-3 rounded-xl bg-white border border-[#E8E8E8] flex-row justify-between items-center active:opacity-75"
              >
                <View>
                  <Text className="text-[#9CA3AF] text-[10px] uppercase font-bold">End Date</Text>
                  <Text className="text-[#1A1A1A] text-sm font-semibold mt-0.5">
                    {customEndDate ? customEndDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color="#0D8A72" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Reports List ── */}
        <View className="px-5 mt-2">
          {firestoreLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#0D8A72" size="large" />
              <Text className="text-[#9CA3AF] mt-4 text-sm">Loading archive…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center py-16 bg-white border border-[#E8E8E8] rounded-3xl p-6">
              <View className="w-16 h-16 rounded-full bg-white items-center justify-center mb-4">
                <Ionicons name="archive-outline" size={30} color="#0D8A72" />
              </View>
              <Text className="text-[#1A1A1A] font-bold text-base">No archived reports</Text>
              <Text className="text-[#9CA3AF] text-sm text-center mt-1 leading-5">
                Reports resolved for over 24 hours will automatically move to the archive. Use filters to adjust search.
              </Text>
            </View>
          ) : (
            <>
              {/* Results count */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-[#9CA3AF] text-xs">
                  Showing <Text className="text-[#0D8A72] font-bold">{visibleReports.length}</Text> of <Text className="text-[#1A1A1A] font-semibold">{filtered.length}</Text> reports
                </Text>
              </View>

              {visibleReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onPress={() => setSelectedReport(report)}
                />
              ))}

              {/* Load More Button */}
              {hasMore && (
                <Pressable
                  onPress={() => setVisibleCount((c) => c + LOAD_MORE_SIZE)}
                  className="mt-2 mb-4 py-4 rounded-2xl items-center justify-center active:opacity-75"
                  style={{ borderWidth: 1, borderColor: '#E8E8E8', backgroundColor: '#1A1A1A' }}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="chevron-down-circle-outline" size={20} color="#0D8A72" />
                    <Text className="text-[#0D8A72] font-bold text-sm">
                      Load More ({Math.min(LOAD_MORE_SIZE, filtered.length - visibleCount)} more)
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* End indicator */}
              {!hasMore && filtered.length > INITIAL_PAGE_SIZE && (
                <View className="items-center py-4">
                  <Text className="text-[#9CA3AF] text-xs">All {filtered.length} reports shown</Text>
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

      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────
// Calendar & Modals Custom Styling
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
  arrowButton: {
    padding: 8,
  },
  monthYearText: {
    color: '#1A1A1A',
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
    color: '#6B7280',
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
    backgroundColor: '#0D8A72',
  },
  dayText: {
    color: '#4A4A4A',
    fontSize: 14,
  },
  selectedDayText: {
    color: '#1A1A1A',
    fontWeight: 'bold',
  },
  closeCalendarButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  closeCalendarText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
