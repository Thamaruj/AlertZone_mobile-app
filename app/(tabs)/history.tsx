import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { useScrollContext } from '../../config/tabBarScrollContext';
import { useAuth } from '../../config/authConfig';
import { db } from '../../services/firebase';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { Image } from 'react-native';
import {
  awardAcceptedPoints,
  computeEarnedBadgeIds,
  incrementResolvedCount,
  syncBadgesToFirestore,
} from '../../services/gamification.service';

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
  // gamification flags — written by client to prevent double-awarding
  pointsAwarded?: boolean;
  resolvedCounted?: boolean;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:  { label: 'Pending',  color: '#F59E0B', bg: '#3D2E0A', icon: 'time-outline'             },
  ASSIGNED: { label: 'Assigned', color: '#60A5FA', bg: '#0D1A3D', icon: 'person-add-outline'        },
  FIXING:   { label: 'Fixing',   color: '#4CC2D1', bg: '#0D2A35', icon: 'construct-outline'         },
  RESOLVED: { label: 'Resolved', color: '#30A89C', bg: '#0D3D35', icon: 'checkmark-circle-outline'  },
  REJECTED: { label: 'Rejected', color: '#E05C5C', bg: '#3D1515', icon: 'close-circle-outline'      },
};

const TIMELINE_STATUSES: ReportStatus[] = ['PENDING', 'ASSIGNED', 'FIXING', 'RESOLVED'];

const FILTER_TABS = ['All', 'Pending', 'Fixing', 'Resolved', 'Rejected'] as const;
type FilterTab = typeof FILTER_TABS[number];

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

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

// ─────────────────────────────────────────────
// Custom Calendar Modal
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
              <Ionicons name="chevron-back" size={20} color="#4CC2D1" />
            </Pressable>
            <Text style={styles.monthYearText}>{months[currentMonth]} {currentYear}</Text>
            <Pressable onPress={handleNextMonth} style={styles.arrowButton}>
              <Ionicons name="chevron-forward" size={20} color="#4CC2D1" />
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
// Report Detail Modal
// ─────────────────────────────────────────────
function ReportDetailModal({ report, onClose }: { report: Report | null; onClose: () => void }) {
  if (!report) return null;
  const cfg = STATUS_CONFIG[report.status] ?? STATUS_CONFIG.PENDING;
  const timelineIndex = TIMELINE_STATUSES.indexOf(report.status);

  return (
    <Modal visible={!!report} animationType="slide" transparent={false}>
      <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 60 }} showsVerticalScrollIndicator={false}>

          {/* Header */}
          <View className="px-5 pt-14 pb-4 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="arrow-back" size={24} color="#4CC2D1" />
            </Pressable>
            <Text className="text-white text-xl font-bold flex-1">Report Details</Text>
            <View className="px-3 py-1 rounded-full" style={{ backgroundColor: cfg.bg }}>
              <Text className="text-xs font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
            </View>
          </View>

          {/* Image */}
          {report.imageUrls?.[0] && (
            <View className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ height: 180 }}>
              <Image source={{ uri: report.imageUrls[0] }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          )}

          {/* Title + meta */}
          <View className="px-5 mb-4">
            <Text className="text-[#4CC2D1] text-xs font-bold mb-1">Ref: {report.id}</Text>
            <Text className="text-white text-2xl font-bold">{report.title}</Text>
            <View className="flex-row items-center mt-2 gap-2">
              <Ionicons name={report.categoryIcon as any} size={13} color="#5A7D8A" />
              <Text className="text-gray-500 text-xs">{formatDate(report.createdAt)}</Text>
            </View>
          </View>

          <View className="px-5 gap-3 mb-4">

            {/* Status Timeline */}
            <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Text className="text-white font-bold mb-4">Status Timeline</Text>

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
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-[#3D1515]">
                      <Ionicons name="close-circle-outline" size={16} color="#E05C5C" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-[#E05C5C] font-semibold text-sm">Rejected</Text>
                      <Text className="text-gray-500 text-xs">Current status</Text>
                    </View>
                    <View className="w-2 h-2 rounded-full bg-[#E05C5C]" />
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
                          style={{ backgroundColor: done ? sc.bg : '#1A2D3D' }}>
                          <Ionicons name={sc.icon as any} size={16} color={done ? sc.color : '#2D4F5C'} />
                        </View>
                        {i < TIMELINE_STATUSES.length - 1 && (
                          <View style={{ width: 2, height: 16, marginTop: 2, backgroundColor: done ? sc.color + '40' : '#1E3347' }} />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-semibold" style={{ color: done ? sc.color : '#3A5060' }}>
                          {sc.label}
                        </Text>
                        {isCurrent && <Text className="text-gray-500 text-xs">Current status</Text>}
                      </View>
                      {isCurrent && <View className="w-2 h-2 rounded-full" style={{ backgroundColor: sc.color }} />}
                      {done && !isCurrent && <Ionicons name="checkmark" size={14} color={sc.color} />}
                    </View>
                  );
                })
              )}
            </View>

            {/* Location */}
            <View className="bg-[#111E27] rounded-2xl p-4 flex-row items-start gap-3"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <View className="w-8 h-8 rounded-lg bg-[#1E3347] items-center justify-center">
                <Ionicons name="location-outline" size={16} color="#4CC2D1" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-1">Location</Text>
                <Text className="text-white text-sm leading-5">{report.location?.address ?? 'Unknown'}</Text>
                {(report.location?.province || report.location?.district || report.location?.localGovernmentArea) && (
                  <View className="mt-2 pt-2 border-t border-[#1E3347] gap-1">
                    {report.location?.province && (
                      <Text className="text-[#CBD5E1] text-xs">
                        <Text className="text-gray-500 font-semibold">Province: </Text>{report.location.province}
                      </Text>
                    )}
                    {report.location?.district && (
                      <Text className="text-[#CBD5E1] text-xs">
                        <Text className="text-gray-500 font-semibold">District: </Text>{report.location.district}
                      </Text>
                    )}
                    {report.location?.localGovernmentArea && (
                      <Text className="text-[#CBD5E1] text-xs">
                        <Text className="text-gray-500 font-semibold">LGA: </Text>{report.location.localGovernmentArea}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            {/* Description */}
            <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-2">Description</Text>
              <Text className="text-white text-sm leading-6">{report.description}</Text>
            </View>

            {/* Upvotes */}
            <View className="bg-[#111E27] rounded-2xl p-4 flex-row items-center justify-between"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <View className="flex-row items-center gap-2">
                <Ionicons name="arrow-up-circle-outline" size={20} color="#4CC2D1" />
                <Text className="text-white font-semibold">{report.upvoteCount} community upvotes</Text>
              </View>
            </View>

            {/* View on Map */}
            <Pressable
              onPress={() => {
                onClose();
                router.push({
                  pathname: '/(tabs)/map',
                  params: { lat: report.location.latitude, lng: report.location.longitude, id: report.id }
                });
              }}
              className="bg-[#1E3347] rounded-2xl p-4 flex-row items-center justify-center gap-2 active:opacity-70"
              style={{ borderWidth: 1, borderColor: '#4CC2D1' }}
            >
              <Ionicons name="map-outline" size={20} color="#4CC2D1" />
              <Text className="text-[#4CC2D1] font-bold">View on Map</Text>
            </Pressable>

            {/* Resolution / Rejection note */}
            {report.resolutionNote && (
              <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
                <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-2">
                  {report.status === 'REJECTED' ? 'Rejection Reason' : 'Resolution Note'}
                </Text>
                <Text className="text-white text-sm leading-6">{report.resolutionNote}</Text>
              </View>
            )}
          </View>

        </ScrollView>
      </LinearGradient>
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
        backgroundColor: '#111E27',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#1E3347',
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
          backgroundColor: '#0D1F2D',
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
              backgroundColor: (report.categoryColor ?? '#4CC2D1') + '22',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image source={require('../../assets/images/iconAlerZone-Bg-none.png')} style={{ width: 22, height: 22 }} resizeMode="contain" />
          </View>
        )}
      </View>

      {/* Title & Details */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>
          {report.title}
        </Text>
        <Text style={{ color: '#5A7D8A', fontSize: 11, marginTop: 2 }}>
          {report.location?.address ?? 'Sri Lanka'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="time-outline" size={12} color="#5A7D8A" />
            <Text style={{ color: '#5A7D8A', fontSize: 11 }}>
              {formatDate(report.createdAt)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="arrow-up-circle-outline" size={12} color="#5A7D8A" />
            <Text style={{ color: '#5A7D8A', fontSize: 11 }}>
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
        <Ionicons name="chevron-forward" size={16} color="#2D4F5C" />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Resolution & Archive Helpers
// ─────────────────────────────────────────────
const getResolvedTime = (report: Report): Date | null => {
  if (report.status !== 'RESOLVED') return null;
  if (report.statusHistory && Array.isArray(report.statusHistory)) {
    const resolvedEntry = report.statusHistory.find(h => h.status === 'RESOLVED');
    if (resolvedEntry?.changedAt) {
      return resolvedEntry.changedAt.toDate ? resolvedEntry.changedAt.toDate() : new Date(resolvedEntry.changedAt);
    }
  }
  if (report.updatedAt) return report.updatedAt.toDate ? report.updatedAt.toDate() : new Date(report.updatedAt);
  if (report.createdAt) return report.createdAt.toDate ? report.createdAt.toDate() : new Date(report.createdAt);
  return null;
};

const isEligibleForArchive = (report: Report): boolean => {
  if (report.status !== 'RESOLVED') return false;
  if (report.isArchived === true) return false;
  const resolvedTime = getResolvedTime(report);
  if (!resolvedTime) return false;
  return (new Date().getTime() - resolvedTime.getTime()) >= 24 * 60 * 60 * 1000;
};

// ─────────────────────────────────────────────
// Main History Screen
// ─────────────────────────────────────────────
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { onScroll } = useScrollContext();
  const { user, profile, refreshProfile } = useAuth();
  const gamificationBusy = useRef(false);

  const [reports, setReports]           = useState<Report[]>([]);
  const [firestoreLoading, setFirestoreLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Date filter state
  const [activeDateFilter, setActiveDateFilter] = useState<DateFilterId>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate]   = useState<Date | null>(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker]   = useState(false);

  // Pagination state
  const [visibleCount, setVisibleCount] = useState(INITIAL_PAGE_SIZE);

  // ── Subscribe to current user's reports ──
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'reports'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const data: Report[] = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Report, 'id'>),
        }));
        setReports(data);
        setFirestoreLoading(false);

        // ── Gamification: award points & badges ─────────────────
        if (!user || !profile || gamificationBusy.current) return;
        gamificationBusy.current = true;
        try {
          const newlyAccepted = data.filter((r) => r.status === 'ASSIGNED' && !r.pointsAwarded);
          const newlyResolved = data.filter((r) => r.status === 'RESOLVED' && !r.resolvedCounted);

          for (const r of newlyAccepted) await awardAcceptedPoints(user.uid, r.id);
          for (const r of newlyResolved) await incrementResolvedCount(user.uid, r.id);

          if (newlyAccepted.length > 0) {
            const totalPts = newlyAccepted.length * 10;
            Toast.show({
              type: 'success',
              text1: `+${totalPts} Points Earned! 🎉`,
              text2: `${newlyAccepted.length} report${newlyAccepted.length > 1 ? 's' : ''} accepted by authorities.`,
            });
          }

          const updatedAccepted = (profile.reportsAccepted ?? 0) + newlyAccepted.length;
          const updatedResolved = (profile.reportsResolved ?? 0) + newlyResolved.length;
          const updatedPoints   = (profile.contributionPoints ?? 0) + newlyAccepted.length * 10;
          const timestamps = data.map((r) => r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt));

          const earnedIds = computeEarnedBadgeIds({
            totalReports: data.length,
            reportsAccepted: updatedAccepted,
            reportsResolved: updatedResolved,
            contributionPoints: updatedPoints,
            reportTimestamps: timestamps,
          });

          const newBadges = await syncBadgesToFirestore(user.uid, earnedIds, profile.badges ?? []);

          if (newBadges.length > 0) {
            Toast.show({
              type: 'success',
              text1: `🏅 New Badge${newBadges.length > 1 ? 's' : ''} Unlocked!`,
              text2: `Check your profile to see your rewards.`,
            });
          }

          if (newlyAccepted.length > 0 || newlyResolved.length > 0 || newBadges.length > 0) {
            await refreshProfile();
          }
        } catch (e) {
          console.error('❌ Gamification processing error:', e);
        } finally {
          gamificationBusy.current = false;
        }
      },
      (err) => {
        console.error('❌ History Firestore error:', err);
        setFirestoreLoading(false);
      },
    );

    return unsub;
  }, [user, profile]);

  // Update selected report when real-time data changes
  useEffect(() => {
    if (selectedReport) {
      const updated = reports.find((r) => r.id === selectedReport.id);
      if (updated) setSelectedReport(updated);
    }
  }, [reports]);

  // ── Auto-archiving resolved reports after 24 hours ──
  useEffect(() => {
    if (reports.length === 0) return;
    const toArchive = reports.filter(isEligibleForArchive);
    if (toArchive.length === 0) return;

    const archiveReports = async () => {
      try {
        const batch = writeBatch(db);
        toArchive.forEach((report) => {
          batch.update(doc(db, 'reports', report.id), { isArchived: true, updatedAt: new Date() });
        });
        await batch.commit();
      } catch (err) {
        console.error('[AutoArchive] Error auto-archiving reports:', err);
      }
    };

    archiveReports();
  }, [reports]);

  // ── Reset visible count when any filter changes ──
  useEffect(() => { setVisibleCount(INITIAL_PAGE_SIZE); }, [activeFilter, activeDateFilter, customStartDate, customEndDate]);

  const clearCustomRange = () => {
    setCustomStartDate(null);
    setCustomEndDate(null);
    setActiveDateFilter('all');
  };

  // ── Combined filtering ──
  const filtered = reports.filter((r) => {
    if (r.isArchived === true) return false;

    // Status filter
    if (activeFilter === 'Pending'  && r.status !== 'PENDING') return false;
    if (activeFilter === 'Fixing'   && r.status !== 'FIXING' && r.status !== 'ASSIGNED') return false;
    if (activeFilter === 'Resolved' && r.status !== 'RESOLVED') return false;
    if (activeFilter === 'Rejected' && r.status !== 'REJECTED') return false;

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

  const countFor = (tab: FilterTab): number => {
    const active = reports.filter((r) => r.isArchived !== true);
    if (tab === 'All')      return active.length;
    if (tab === 'Pending')  return active.filter((r) => r.status === 'PENDING').length;
    if (tab === 'Fixing')   return active.filter((r) => r.status === 'FIXING' || r.status === 'ASSIGNED').length;
    if (tab === 'Resolved') return active.filter((r) => r.status === 'RESOLVED').length;
    if (tab === 'Rejected') return active.filter((r) => r.status === 'REJECTED').length;
    return 0;
  };

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 120 }}
      >
        {/* ── Top Nav ── */}
        <View className="flex-row justify-between items-center px-5 mb-5">
          <View className="flex-row items-center gap-2">
            <Image
              source={require('../../assets/images/iconAlerZone-Bg-none.png')}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            <Text className="text-white text-xl font-bold tracking-tight">My Reports</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => router.push('/archive' as any)}
              className="bg-[#1E3347] px-3 py-1.5 rounded-full flex-row items-center gap-1.5 active:opacity-75"
              style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
            >
              <Ionicons name="archive-outline" size={14} color="#4CC2D1" />
              <Text className="text-[#4CC2D1] text-xs font-bold">Archive</Text>
            </Pressable>
            <View className="bg-[#111E27] px-3 py-1.5 rounded-full" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Text className="text-gray-400 text-xs font-bold">
                {filtered.length}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Status Filter Tabs ── */}
        <View className="mb-1">
          <Text className="text-gray-400 text-xs font-bold px-5 mb-2 uppercase tracking-wide">Status</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12, gap: 8 }}
          >
            {FILTER_TABS.map((tab) => {
              const isActive = activeFilter === tab;
              const count = countFor(tab);
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveFilter(tab)}
                  className="flex-row items-center px-4 py-2 rounded-full gap-1.5"
                  style={{
                    backgroundColor: isActive ? '#4CC2D1' : '#111E27',
                    borderWidth: 1,
                    borderColor: isActive ? '#4CC2D1' : '#1E3347',
                  }}
                >
                  <Text className="text-sm font-semibold" style={{ color: isActive ? '#071318' : '#5A7D8A' }}>
                    {tab}
                  </Text>
                  <View className="px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: isActive ? 'rgba(7,19,24,0.2)' : '#1E3347' }}>
                    <Text className="text-[10px] font-bold" style={{ color: isActive ? '#071318' : '#4CC2D1' }}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Date Filter ── */}
        <View className="mb-4">
          <Text className="text-gray-400 text-xs font-bold px-5 mb-2 uppercase tracking-wide">Date Filter</Text>
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
                    backgroundColor: isActive ? '#4CC2D1' : '#111E27',
                    borderWidth: 1,
                    borderColor: isActive ? '#4CC2D1' : '#1E3347',
                  }}
                >
                  <Text className="text-xs font-semibold" style={{ color: isActive ? '#071318' : '#5A7D8A' }}>
                    {df.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Custom Date Range Picker ── */}
        {activeDateFilter === 'custom' && (
          <View className="mx-5 mb-4 p-4 rounded-2xl bg-[#111E27] border border-[#1E3347]">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white text-xs font-bold uppercase tracking-wide">Select Date Range</Text>
              {(customStartDate || customEndDate) && (
                <Pressable onPress={clearCustomRange} className="active:opacity-75">
                  <Text className="text-[#E05C5C] text-xs font-semibold">Reset</Text>
                </Pressable>
              )}
            </View>
            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setShowStartPicker(true)}
                className="flex-1 p-3 rounded-xl bg-[#1E3A44] border border-[#2D4F5C] flex-row justify-between items-center active:opacity-75"
              >
                <View>
                  <Text className="text-gray-500 text-[10px] uppercase font-bold">Start Date</Text>
                  <Text className="text-white text-sm font-semibold mt-0.5">
                    {customStartDate ? customStartDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color="#4CC2D1" />
              </Pressable>

              <Pressable
                onPress={() => setShowEndPicker(true)}
                className="flex-1 p-3 rounded-xl bg-[#1E3A44] border border-[#2D4F5C] flex-row justify-between items-center active:opacity-75"
              >
                <View>
                  <Text className="text-gray-500 text-[10px] uppercase font-bold">End Date</Text>
                  <Text className="text-white text-sm font-semibold mt-0.5">
                    {customEndDate ? customEndDate.toLocaleDateString('en-GB') : 'Select...'}
                  </Text>
                </View>
                <Ionicons name="calendar-outline" size={16} color="#4CC2D1" />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Report List ── */}
        <View className="px-5">
          {firestoreLoading ? (
            <View className="items-center py-16">
              <ActivityIndicator color="#4CC2D1" size="large" />
              <Text className="text-gray-500 mt-4 text-sm">Loading your reports…</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View className="items-center py-16 bg-[#111E27] border border-[#1E3347] rounded-3xl p-6">
              <View className="w-16 h-16 rounded-full bg-[#1E3A44] items-center justify-center mb-4">
                <Ionicons name="document-outline" size={30} color="#2D4F5C" />
              </View>
              <Text className="text-white font-bold text-base">
                {activeFilter === 'All' ? 'No reports found' : `No ${activeFilter} reports`}
              </Text>
              <Text className="text-gray-500 text-sm mt-1 text-center leading-5">
                {activeFilter === 'All' && activeDateFilter === 'all'
                  ? 'Submit your first report using the + button'
                  : 'Try adjusting your filters'}
              </Text>
            </View>
          ) : (
            <>
              {/* Results count */}
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-500 text-xs">
                  Showing <Text className="text-[#4CC2D1] font-bold">{visibleReports.length}</Text> of <Text className="text-white font-semibold">{filtered.length}</Text> reports
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
                  style={{ borderWidth: 1, borderColor: '#2D4F5C', backgroundColor: '#111E27' }}
                >
                  <View className="flex-row items-center gap-2">
                    <Ionicons name="chevron-down-circle-outline" size={20} color="#4CC2D1" />
                    <Text className="text-[#4CC2D1] font-bold text-sm">
                      Load More ({Math.min(LOAD_MORE_SIZE, filtered.length - visibleCount)} more)
                    </Text>
                  </View>
                </Pressable>
              )}

              {/* End indicator */}
              {!hasMore && filtered.length > INITIAL_PAGE_SIZE && (
                <View className="items-center py-4">
                  <Text className="text-gray-600 text-xs">All {filtered.length} reports shown</Text>
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

      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
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
    backgroundColor: '#111E27',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E3347',
    padding: 20,
    alignItems: 'center',
  },
  calendarTitle: {
    color: '#FFFFFF',
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
  monthYearText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  weekdaysRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekdayText: {
    color: '#5A7D8A',
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
  selectedDayCell: { backgroundColor: '#4CC2D1' },
  dayText: { color: '#E2E8F0', fontSize: 14 },
  selectedDayText: { color: '#071318', fontWeight: 'bold' },
  closeCalendarButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2D4F5C',
  },
  closeCalendarText: { color: '#5A7D8A', fontWeight: '600', fontSize: 14 },
});