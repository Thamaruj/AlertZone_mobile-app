import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollContext } from '../../config/tabBarScrollContext';

// ─────────────────────────────────────────────
// TODO: Replace with Firebase fetch
// import { auth, db } from '../../services/firebase';
// import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
// useEffect(() => {
//   const q = query(
//     collection(db, 'reports'),
//     where('uid', '==', auth.currentUser.uid),
//     orderBy('createdAt', 'desc')
//   );
//   const unsub = onSnapshot(q, (snap) => setReports(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
//   return unsub;
// }, []);
// ─────────────────────────────────────────────

type ReportStatus = 'PENDING' | 'FIXING' | 'RESOLVED' | 'REJECTED';

interface Report {
  id: string;
  refId: string;
  title: string;
  category: string;
  categoryIcon: string;
  location: string;
  description: string;
  status: ReportStatus;
  date: string;
  image?: string;
  resolvedNote?: string;
  upvotes: number;
}

const STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bg: string; icon: string }> = {
  PENDING:  { label: 'Pending',  color: '#F59E0B', bg: '#3D2E0A', icon: 'time-outline'             },
  FIXING:   { label: 'Fixing',   color: '#4CC2D1', bg: '#0D2A35', icon: 'construct-outline'        },
  RESOLVED: { label: 'Resolved', color: '#30A89C', bg: '#0D3D35', icon: 'checkmark-circle-outline' },
  REJECTED: { label: 'Rejected', color: '#E05C5C', bg: '#3D1515', icon: 'close-circle-outline'     },
};

// ── Mock Data ──
const MOCK_REPORTS: Report[] = [
  {
    id: '1', refId: 'AZ-9921',
    title: 'Large Pothole',
    category: 'Road & Traffic', categoryIcon: 'car-outline',
    location: 'No. 06, Nawala Road, Rajagiriya, Sri Lanka',
    description: 'There is a very large pothole on the left lane that has caused multiple near-accidents.',
    status: 'FIXING', date: '2 hours ago',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&q=80',
    upvotes: 12,
  },
  {
    id: '2', refId: 'AZ-9880',
    title: 'Broken Streetlight',
    category: 'Road & Traffic', categoryIcon: 'car-outline',
    location: '4th & Mission St, Colombo',
    description: 'The streetlight has been out for 3 days creating a safety hazard at night.',
    status: 'PENDING', date: 'Yesterday',
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80',
    upvotes: 5,
  },
  {
    id: '3', refId: 'AZ-9750',
    title: 'Blocked Drain',
    category: 'Water & Drainage', categoryIcon: 'water-outline',
    location: 'Main St, Nugegoda',
    description: 'Drain is completely blocked causing flooding after rain.',
    status: 'RESOLVED', date: '3 days ago',
    resolvedNote: 'Municipal crew cleared the drain and conducted a full inspection.',
    upvotes: 28,
  },
  {
    id: '4', refId: 'AZ-9600',
    title: 'Illegal Dumping',
    category: 'Waste & Env.', categoryIcon: 'trash-outline',
    location: 'Havelock Road, Colombo 5',
    description: 'Large pile of construction waste dumped on the roadside.',
    status: 'REJECTED', date: '1 week ago',
    resolvedNote: 'Unable to verify location. Please resubmit with clearer evidence.',
    upvotes: 3,
  },
  {
    id: '5', refId: 'AZ-9540',
    title: 'Damaged Footpath',
    category: 'Bridge & Structural', categoryIcon: 'git-network-outline',
    location: 'Park Avenue, Borella',
    description: 'Footpath tiles are cracked and uplifted, posing a tripping hazard.',
    status: 'PENDING', date: '1 week ago',
    upvotes: 9,
  },
];

const FILTER_TABS = ['All', 'Pending', 'Fixing', 'Resolved', 'Rejected'] as const;
type FilterTab = typeof FILTER_TABS[number];

// ─────────────────────────────────────────────
// Report Detail Modal
// ─────────────────────────────────────────────
function ReportDetailModal({ report, onClose }: { report: Report | null; onClose: () => void }) {
  if (!report) return null;
  const cfg = STATUS_CONFIG[report.status];

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
          {report.image && (
            <View className="mx-5 mb-4 rounded-2xl overflow-hidden" style={{ height: 180 }}>
              <Image source={{ uri: report.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            </View>
          )}

          {/* Ref + Title */}
          <View className="px-5 mb-4">
            <Text className="text-[#4CC2D1] text-xs font-bold mb-1">Ref: {report.refId}</Text>
            <Text className="text-white text-2xl font-bold">{report.title}</Text>
            <View className="flex-row items-center mt-2 gap-2">
              <View className="flex-row items-center gap-1">
                <Ionicons name={report.categoryIcon as any} size={13} color="#5A7D8A" />
                <Text className="text-gray-500 text-xs">{report.category}</Text>
              </View>
              <Text className="text-gray-600">•</Text>
              <Text className="text-gray-500 text-xs">{report.date}</Text>
            </View>
          </View>

          {/* Info Cards */}
          <View className="px-5 gap-3 mb-4">
            {/* Status timeline */}
            <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Text className="text-white font-bold mb-3">Status Timeline</Text>
              {(['PENDING', 'FIXING', 'RESOLVED'] as ReportStatus[]).map((s, i) => {
                const stepCfg   = STATUS_CONFIG[s];
                const isDone    = ['PENDING', 'FIXING', 'RESOLVED'].indexOf(report.status) >= i;
                const isCurrent = report.status === s;
                if (report.status === 'REJECTED' && s !== 'PENDING') return null;
                return (
                  <View key={s} className="flex-row items-center mb-3">
                    <View className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: isDone ? stepCfg.bg : '#1A2D3D' }}
                    >
                      <Ionicons name={stepCfg.icon as any} size={16} color={isDone ? stepCfg.color : '#2D4F5C'} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-sm font-semibold" style={{ color: isDone ? stepCfg.color : '#3A5060' }}>
                        {stepCfg.label}
                      </Text>
                      {isCurrent && <Text className="text-gray-500 text-xs">Current status</Text>}
                    </View>
                    {isCurrent && (
                      <View className="w-2 h-2 rounded-full" style={{ backgroundColor: stepCfg.color }} />
                    )}
                  </View>
                );
              })}
              {report.status === 'REJECTED' && (
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-3 bg-[#3D1515]">
                    <Ionicons name="close-circle-outline" size={16} color="#E05C5C" />
                  </View>
                  <Text className="text-[#E05C5C] font-semibold text-sm">Rejected</Text>
                </View>
              )}
            </View>

            {/* Location */}
            <View className="bg-[#111E27] rounded-2xl p-4 flex-row items-start gap-3"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}
            >
              <View className="w-8 h-8 rounded-lg bg-[#1E3347] items-center justify-center">
                <Ionicons name="location-outline" size={16} color="#4CC2D1" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-1">Location</Text>
                <Text className="text-white text-sm leading-5">{report.location}</Text>
              </View>
            </View>

            {/* Description */}
            <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
              <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-2">Description</Text>
              <Text className="text-white text-sm leading-6">{report.description}</Text>
            </View>

            {/* Community upvotes */}
            <View className="bg-[#111E27] rounded-2xl p-4 flex-row items-center justify-between"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}
            >
              <View className="flex-row items-center gap-2">
                <Ionicons name="arrow-up-circle-outline" size={20} color="#4CC2D1" />
                <Text className="text-white font-semibold">{report.upvotes} community upvotes</Text>
              </View>
              <Pressable className="px-4 py-2 rounded-xl bg-[#1E3347] active:opacity-70">
                <Text className="text-[#4CC2D1] text-sm font-semibold">Upvote</Text>
              </Pressable>
            </View>

            {/* Resolution note (if exists) */}
            {report.resolvedNote && (
              <View className="bg-[#111E27] rounded-2xl p-4" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
                <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-2">
                  {report.status === 'REJECTED' ? 'Rejection Reason' : 'Resolution Note'}
                </Text>
                <Text className="text-white text-sm leading-6">{report.resolvedNote}</Text>
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
  const cfg = STATUS_CONFIG[report.status];
  return (
    <Pressable onPress={onPress} className="mb-3 active:opacity-80">
      <View className="bg-[#111E27] rounded-2xl overflow-hidden" style={{ borderWidth: 1, borderColor: '#1E3347' }}>
        <View className="flex-row">
          {/* Image thumbnail */}
          {report.image ? (
            <Image source={{ uri: report.image }} style={{ width: 90, height: 90 }} resizeMode="cover" />
          ) : (
            <View className="w-[90px] h-[90px] bg-[#1E3347] items-center justify-center">
              <Ionicons name={report.categoryIcon as any} size={28} color="#2D4F5C" />
            </View>
          )}

          {/* Info */}
          <View className="flex-1 p-3 justify-between">
            <View className="flex-row justify-between items-start">
              <Text className="text-white font-bold text-sm flex-1 mr-2" numberOfLines={1}>{report.title}</Text>
              <View className="px-2 py-0.5 rounded-full" style={{ backgroundColor: cfg.bg }}>
                <Text className="text-[10px] font-bold" style={{ color: cfg.color }}>{cfg.label}</Text>
              </View>
            </View>
            <Text className="text-gray-500 text-xs mt-1" numberOfLines={1}>{report.category}</Text>
            <View className="flex-row items-center justify-between mt-2">
              <View className="flex-row items-center gap-1">
                <Ionicons name="location-outline" size={11} color="#3A6070" />
                <Text className="text-gray-600 text-[11px]" numberOfLines={1} style={{ maxWidth: 140 }}>
                  {report.location}
                </Text>
              </View>
              <Text className="text-gray-600 text-[10px]">{report.date}</Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollContext();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('All');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // TODO: Replace MOCK_REPORTS with Firebase snapshot
  const allReports = MOCK_REPORTS;

  const filtered = allReports.filter((r) => {
    if (activeFilter === 'All')      return true;
    if (activeFilter === 'Pending')  return r.status === 'PENDING';
    if (activeFilter === 'Fixing')   return r.status === 'FIXING';
    if (activeFilter === 'Resolved') return r.status === 'RESOLVED';
    if (activeFilter === 'Rejected') return r.status === 'REJECTED';
    return true;
  });

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
          <View className="bg-[#1E3347] px-3 py-1.5 rounded-full">
            <Text className="text-[#4CC2D1] text-xs font-bold">{allReports.length} Total</Text>
          </View>
        </View>

        {/* ── Filter Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 16, gap: 8 }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab;
            const count = tab === 'All'
              ? allReports.length
              : allReports.filter(r => r.status === tab.toUpperCase()).length;
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
                  style={{ backgroundColor: isActive ? 'rgba(7,19,24,0.2)' : '#1E3347' }}
                >
                  <Text className="text-[10px] font-bold" style={{ color: isActive ? '#071318' : '#4CC2D1' }}>
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Report List ── */}
        <View className="px-5">
          {filtered.length === 0 ? (
            <View className="items-center py-16">
              <View className="w-16 h-16 rounded-full bg-[#111E27] items-center justify-center mb-4">
                <Ionicons name="document-outline" size={30} color="#2D4F5C" />
              </View>
              <Text className="text-gray-500 font-semibold">No {activeFilter} reports</Text>
              <Text className="text-gray-600 text-sm mt-1">Your reports will appear here</Text>
            </View>
          ) : (
            filtered.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onPress={() => setSelectedReport(report)}
              />
            ))
          )}
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </LinearGradient>
  );
}