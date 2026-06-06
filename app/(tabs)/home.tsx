import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollContext } from '../../config/tabBarScrollContext';
import * as Location from 'expo-location';
import { collection, collectionGroup, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import ReportDetailSheet from '../../components/ReportDetailSheet';
import { db } from '../../services/firebase';
import { useAuth } from '../../config/authConfig';

// ─────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────
interface ReportPin {
  id: string;
  title: string;
  categoryId: string;
  categoryIcon: string;
  categoryColor: string;
  latitude: number;
  longitude: number;
  status: string;
  address: string;
  image?: string;
  createdAt: any;
  distance?: number;
  upvoteCount?: number;
}



const STATUS_COLOR: Record<string, string> = {
  PENDING: '#D97706',
  ASSIGNED: '#3B82F6',
  FIXING: '#0D8A72',
  RESOLVED: '#059669',
  REJECTED: '#DC2626',
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distKm: number) => {
  if (distKm < 1) return `${Math.round(distKm * 1000)}m away`;
  return `${distKm.toFixed(1)}km away`;
};

const timeAgo = (date: Date) => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' years ago';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' months ago';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' days ago';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' hours ago';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' mins ago';
  return 'Just now';
};

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────
function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '700' }}>{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction} className="active:opacity-70">
          <Text style={{ color: '#0D8A72', fontSize: 13, fontWeight: '600' }}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}



function NearbyCard({ item, onPress }: { item: ReportPin; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="mr-3 active:opacity-90" style={{ width: 180 }}>
      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E8E8' }}>
        <View style={{ height: 110, backgroundColor: '#F0F0F0' }}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
               <Ionicons name={item.categoryIcon as any} size={40} color={item.categoryColor} style={{ opacity: 0.4 }} />
            </View>
          )}
          <View className="absolute top-2 left-2 px-2 py-0.5 rounded-md" style={{ backgroundColor: STATUS_COLOR[item.status] || '#D97706' }}>
            <Text className="text-[10px] font-bold text-white tracking-wider">{item.status}</Text>
          </View>
        </View>
        <View className="px-3 py-2.5">
          <Text style={{ color: '#1A1A1A', fontWeight: '600', fontSize: 13 }} numberOfLines={1}>{item.title}</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={12} color="#9CA3AF" />
            <Text style={{ color: '#6B7280', fontSize: 11, marginLeft: 4 }} numberOfLines={1}>{item.distance ? formatDistance(item.distance) : 'Nearby'}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function NearbyListRow({ item, onPress }: { item: ReportPin; onPress: () => void }) {
  const statusColor = STATUS_COLOR[item.status] || '#D97706';
  const statusBg = statusColor + '14';
  
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
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
          backgroundColor: '#F5F5F5',
          marginRight: 12,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: item.categoryColor + '18',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={item.categoryIcon as any} size={18} color={item.categoryColor} />
          </View>
        )}
      </View>

      {/* Title & Details */}
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text style={{ color: '#1A1A1A', fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 11, marginTop: 2 }}>
          {item.address || 'Sri Lanka'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="location-outline" size={12} color="#0D8A72" />
            <Text style={{ color: '#0D8A72', fontSize: 11, fontWeight: '600' }}>
              {item.distance ? formatDistance(item.distance) : 'Nearby'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="arrow-up-circle-outline" size={12} color="#6B7280" />
            <Text style={{ color: '#6B7280', fontSize: 11 }}>
              {item.upvoteCount ?? 0} upvotes
            </Text>
          </View>
        </View>
      </View>

      {/* Status Pill & Arrow */}
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <View style={{ backgroundColor: statusBg, borderWidth: 1, borderColor: statusColor + '40', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 }}>
          <Text style={{ color: statusColor, fontSize: 10, fontWeight: 'bold' }}>{item.status}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
      </View>
    </Pressable>
  );
}

function UpdateRow({ item, onPress }: { item: ReportPin; onPress: () => void }) {
  const isResolved = item.status === 'RESOLVED';
  const isNew = item.status === 'PENDING';
  
  const icon = isResolved ? 'checkmark-circle' : (isNew ? 'alert-circle' : 'construct');
  const iconColor = STATUS_COLOR[item.status] || '#D97706';
  const iconBg = iconColor + '14';
  
  let titlePrefix = 'Status Update: ';
  if (isResolved) titlePrefix = 'Resolved: ';
  else if (isNew) titlePrefix = 'New Report: ';

  const timeStr = item.createdAt ? timeAgo(item.createdAt.toDate()) : 'Recently';
  const addressStr = item.address ? item.address.split(',')[0] : 'Unknown location';

  return (
    <Pressable onPress={onPress} className="flex-row items-center py-3 active:opacity-70">
      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: iconBg }}>
        <Ionicons name={icon as any} size={20} color={iconColor} />
      </View>
      <View className="flex-1 pr-2">
        <Text style={{ color: '#1A1A1A', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
          {titlePrefix}{item.title}
        </Text>
        <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          {addressStr} • {timeStr}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </Pressable>
  );
}

function SkeletonCard() {
  return (
    <View className="mr-3 rounded-2xl overflow-hidden" style={{ width: 180, borderWidth: 1, borderColor: '#E8E8E8', backgroundColor: '#FFFFFF' }}>
      <View style={{ height: 110, backgroundColor: '#F0F0F0' }} />
      <View className="px-3 py-3 gap-2">
        <View className="h-4 bg-[#E5E7EB] rounded w-3/4" />
        <View className="h-3 bg-[#E5E7EB] rounded w-1/2" />
      </View>
    </View>
  );
}

function SkeletonUpdate() {
  return (
    <View className="flex-row items-center py-3">
      <View className="w-10 h-10 rounded-full bg-[#F0F0F0] mr-3" />
      <View className="flex-1 gap-2">
        <View className="h-4 bg-[#F0F0F0] rounded w-2/3" />
        <View className="h-3 bg-[#F0F0F0] rounded w-1/3" />
      </View>
    </View>
  );
}

function EmptyState({ title, subtitle, icon }: { title: string; subtitle: string; icon: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 16, backgroundColor: '#FFFFFF' }}>
      <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#E6F7F3', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <Ionicons name={icon as any} size={24} color="#0D8A72" />
      </View>
      <Text style={{ color: '#1A1A1A', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>{title}</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 12, textAlign: 'center', lineHeight: 18 }}>{subtitle}</Text>
    </View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function HomeScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { onScroll } = useScrollContext();
  const { user, profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [reports, setReports] = useState<ReportPin[]>([]);
  const [nearbyIssues, setNearbyIssues] = useState<ReportPin[]>([]);
  const [latestUpdates, setLatestUpdates] = useState<ReportPin[]>([]);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [upvotedCount, setUpvotedCount] = useState(0);
  const [nearbyFilter, setNearbyFilter] = useState<'ALL' | 'PENDING' | 'ASSIGNED' | 'FIXING'>('ALL');
  const [isListViewVisible, setIsListViewVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    let coords = profile?.homeLocation || null;
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      }
    } catch (e) {
      console.warn('Location error on Home Refresh:', e);
    }
    setUserLocation(coords);
    await new Promise(resolve => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  const radiusKm = profile?.alertRadius ? parseInt(profile.alertRadius.replace(/[^0-9]/g, '')) || 5 : 5;
  const firstName = profile?.fullName ? profile.fullName.split(' ')[0] : 'Citizen';

  const filteredNearbyIssues = nearbyIssues.filter(issue => {
    if (nearbyFilter === 'ALL') return true;
    return issue.status === nearbyFilter;
  });

  // 1. Fetch location
  useEffect(() => {
    (async () => {
      let coords = profile?.homeLocation || null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      } catch (e) {
        console.warn('Location error on Home:', e);
      }
      setUserLocation(coords);
    })();
  }, [profile?.homeLocation]);

  // 2. Fetch active reports in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const pins: ReportPin[] = snap.docs
        .map(d => {
          const data = d.data();
          if (data.status === 'RESOLVED' || data.status === 'REJECTED') return null;
          return {
            id: d.id,
            title: data.title ?? data.category ?? 'Report',
            categoryId: data.categoryId ?? 'road_traffic',
            categoryIcon: data.categoryIcon ?? 'warning-outline',
            categoryColor: data.categoryColor ?? '#0D8A72',
            latitude: data.location?.latitude,
            longitude: data.location?.longitude,
            status: data.status ?? 'PENDING',
            address: data.location?.address ?? '',
            image: data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls[0] : undefined,
            createdAt: data.createdAt,
            upvoteCount: data.upvoteCount ?? 0,
          } as ReportPin;
        })
        .filter((p): p is ReportPin => p !== null && p.latitude !== undefined && p.longitude !== undefined);
      
      setReports(pins);
    }, (err) => {
      console.error("Home reports listener error:", err);
      setLoading(false);
    });
    return unsub;
  }, []);

  // 2.5. Fetch unread notifications count in real-time
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid),
      where('isRead', '==', false)
    );
    const unsub = onSnapshot(q, (snap) => {
      setUnreadCount(snap.docs.length);
    }, (err) => {
      console.error("Home unread count listener error:", err);
    });
    return unsub;
  }, [user?.uid]);

  // 2.6. Fetch count of reports this user has upvoted
  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collectionGroup(db, 'upvotes'),
      where('uid', '==', user.uid),
    );
    const unsub = onSnapshot(q, (snap) => {
      setUpvotedCount(snap.docs.length);
    }, (err) => {
      // collectionGroup may need an index — silently ignore in dev
      console.warn('Upvoted count error (index may be needed):', err);
    });
    return unsub;
  }, [user?.uid]);

  // 3. Process distances when data or location updates
  useEffect(() => {
    if (reports.length === 0) {
      setNearbyIssues([]);
      setLatestUpdates([]);
      // wait a bit for initial fetch before clearing loading
      const t = setTimeout(() => setLoading(false), 800);
      return () => clearTimeout(t);
    }

    if (!userLocation) {
      // Fallback: Just show latest reports globally if no location
      setLatestUpdates(reports.slice(0, 3));
      setNearbyIssues(reports.slice(0, 5));
      setLoading(false);
      return;
    }

    // Calculate distance and filter by radius
    const processed = reports.map(r => ({
      ...r,
      distance: getDistance(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude)
    }));
    
    const withinRadius = processed.filter(r => r.distance !== undefined && r.distance <= radiusKm);
    
    // Nearest issues (sort by distance)
    const nearby = [...withinRadius].sort((a, b) => (a.distance || 0) - (b.distance || 0));
    
    // Latest updates (already sorted by createdAt descending from query)
    const updates = [...withinRadius];

    setNearbyIssues(nearby);
    setLatestUpdates(updates.slice(0, 3));
    setLoading(false);
  }, [reports, userLocation, radiusKm]);

  const openReportDetail = (item: ReportPin) => {
    setSelectedReportId(item.id);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120, // space for floating tab bar
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#0D8A72"
            colors={["#0D8A72"]}
          />
        }
      >
        {/* ── 1. Top Nav ── */}
        <View className="flex-row justify-between items-center px-5 mb-5">
          <View className="flex-row items-center gap-2">
            <Image
              source={require('../../assets/images/iconAlerZone-Bg-none.png')}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            <Text style={{ color: '#1A1A1A', fontSize: 20, fontWeight: '700', letterSpacing: -0.3 }}>AlertZone</Text>
          </View>

          {/* Notification bell with badge */}
          <Pressable onPress={() => router.push('/notifications' as any)} className="active:opacity-70">
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E8E8' }}>
              <Ionicons name="notifications-outline" size={20} color="#6B7280" />
            </View>
            {unreadCount > 0 && (
              <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#DC2626] items-center justify-center">
                <Text className="text-white text-[10px] font-bold">{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── 2. Hero Banner ── */}
        <View className="mx-5 mb-6">
          <View
            style={{ borderRadius: 20, overflow: 'hidden', padding: 20, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E8E8' }}
          >
            <View className="flex-row items-center">
              <View className="flex-1 pr-3">
                <Text style={{ color: '#1A1A1A', fontSize: 19, fontWeight: '700', lineHeight: 26 }}>
                  Hello {firstName},{'\n'}Your Voice Matters.
                </Text>

                <View className="mt-4">
                  <Pressable
                    className="w-full rounded-xl flex-row items-center justify-center py-2.5 active:opacity-80"
                    style={{ backgroundColor: '#0D8A72' }}
                    onPress={() => router.push('/(tabs)/report')}
                  >
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                    <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13, marginLeft: 6 }}>New Report</Text>
                  </Pressable>
                </View>
              </View>

              <View
                style={{ width: 100, height: 100, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E8E8E8' }}
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=80' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
            </View>
          </View>
        </View>



        {/* ── 4. Nearby Issues ── */}
        <View className="mb-7">
          <View className="px-5">
            <SectionHeader
              title="Nearby Issues"
              actionLabel="View Map"
              onAction={() => router.push('/(tabs)/map')}
            />
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, marginBottom: 12 }}
            className="flex-row"
          >
            {(['ALL', 'PENDING', 'ASSIGNED', 'FIXING'] as const).map((status) => {
              const isActive = nearbyFilter === status;
              let label = 'All';
              if (status === 'PENDING') label = 'Pending';
              else if (status === 'ASSIGNED') label = 'Assigned';
              else if (status === 'FIXING') label = 'Fixing';

              let activeColor = '#0D8A72';
              if (status === 'PENDING') activeColor = '#D97706';
              else if (status === 'ASSIGNED') activeColor = '#3B82F6';
              else if (status === 'FIXING') activeColor = '#0D8A72';

              return (
                <Pressable
                  key={status}
                  onPress={() => setNearbyFilter(status)}
                  style={{
                    backgroundColor: isActive ? activeColor + '12' : '#FFFFFF',
                    borderColor: isActive ? activeColor : '#E8E8E8',
                    borderWidth: 1,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 8,
                  }}
                  className="active:opacity-85"
                >
                  <Text style={{ color: isActive ? activeColor : '#6B7280', fontWeight: 'bold', fontSize: 12 }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
          >
            {loading ? (
              <View className="flex-row">
                {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
              </View>
            ) : filteredNearbyIssues.length > 0 ? (
              filteredNearbyIssues.map(item => (
                <NearbyCard key={item.id} item={item} onPress={() => openReportDetail(item)} />
              ))
            ) : (
              <View style={{ width: 300 }}>
                <EmptyState
                  title="No reports match this status"
                  subtitle={nearbyFilter === 'ALL' 
                    ? `No active reports found within your ${radiusKm}km radius.`
                    : `No active ${nearbyFilter.toLowerCase()} reports inside your alert radius.`}
                  icon="leaf-outline"
                />
              </View>
            )}
          </ScrollView>

          {/* Action Buttons: View on Map & View List */}
          <View className="flex-row gap-3 px-5 mt-4">
            <Pressable
              onPress={() => router.push('/(tabs)/map')}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8E8E8', borderRadius: 12 }}
              className="active:opacity-80"
            >
              <Ionicons name="map-outline" size={16} color="#0D8A72" style={{ marginRight: 6 }} />
              <Text style={{ color: '#0D8A72', fontWeight: '700', fontSize: 13 }}>View on Map</Text>
            </Pressable>
            <Pressable
              onPress={() => setIsListViewVisible(true)}
              style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, backgroundColor: '#0D8A72', borderRadius: 12 }}
              className="active:opacity-80"
            >
              <Ionicons name="list-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>View List</Text>
            </Pressable>
          </View>
        </View>

        {/* ── 5. Latest Updates ── */}
        <View className="px-5">
          <SectionHeader title="Latest Updates" />
          
          <View
            style={{ backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E8E8E8' }}
          >
            {loading ? (
              <View className="px-4">
                {[1, 2, 3].map((i, index) => (
                  <View key={i}>
                    <SkeletonUpdate />
                    {index < 2 && <View style={{ height: 1, backgroundColor: '#F0F0F0' }} />}
                  </View>
                ))}
              </View>
            ) : latestUpdates.length > 0 ? (
              <View className="px-4">
                {latestUpdates.map((item, index) => (
                  <View key={item.id}>
                    <UpdateRow item={item} onPress={() => openReportDetail(item)} />
                    {index < latestUpdates.length - 1 && (
                      <View style={{ height: 1, backgroundColor: '#F0F0F0' }} />
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View className="p-2">
                 <EmptyState
                  title="No recent activity"
                  subtitle="It's quiet around here. Be the first to report an issue!"
                  icon="time-outline"
                />
              </View>
            )}
          </View>
        </View>

        {/* ── 6. My Upvoted Reports ── */}
        <View className="px-5 mt-7">
          <SectionHeader title="My Community Upvotes" />
          <Pressable
            onPress={() => router.push('/upvoted-reports' as any)}
            className="active:opacity-80"
          >
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                borderWidth: 1,
                borderColor: '#E8E8E8',
                flexDirection: 'row',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 50, height: 50, borderRadius: 25,
                  backgroundColor: '#E6F7F3',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="arrow-up-circle" size={26} color="#0D8A72" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#1A1A1A', fontWeight: '700', fontSize: 15 }}>My Upvoted Reports</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                  Reports you&apos;ve supported in your community
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ color: '#0D8A72', fontWeight: '800', fontSize: 20 }}>{upvotedCount}</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 10 }}>upvoted</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#D1D5DB" />
            </View>
          </Pressable>
        </View>

      </ScrollView>

      {/* ── Nearby Issues List Modal ── */}
      <Modal
        visible={isListViewVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setIsListViewVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: '#F5F5F5' }}>
          <View style={{ flex: 1, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 8 }}>
            
            {/* Header */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E8E8E8', backgroundColor: '#FFFFFF' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#1A1A1A', fontSize: 18, fontWeight: 'bold' }}>Nearby Issues List</Text>
                <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2 }}>
                  Showing active issues within {radiusKm}km
                </Text>
              </View>
              <Pressable
                onPress={() => setIsListViewVisible(false)}
                style={({ pressed }) => ({
                  width: 36, height: 36, borderRadius: 18,
                  backgroundColor: pressed ? '#F0F0F0' : '#FFFFFF',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: '#E8E8E8'
                })}
              >
                <Ionicons name="close" size={20} color="#6B7280" />
              </Pressable>
            </View>

            {/* Filter Bar in Modal */}
            <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0', backgroundColor: '#FFFFFF' }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
              >
                {(['ALL', 'PENDING', 'ASSIGNED', 'FIXING'] as const).map((status) => {
                  const isActive = nearbyFilter === status;
                  let label = 'All';
                  if (status === 'PENDING') label = 'Pending';
                  else if (status === 'ASSIGNED') label = 'Assigned';
                  else if (status === 'FIXING') label = 'Fixing';

                  let activeColor = '#0D8A72';
                  if (status === 'PENDING') activeColor = '#D97706';
                  else if (status === 'ASSIGNED') activeColor = '#3B82F6';
                  else if (status === 'FIXING') activeColor = '#0D8A72';

                  return (
                    <Pressable
                      key={status}
                      onPress={() => setNearbyFilter(status)}
                      style={{
                        backgroundColor: isActive ? activeColor + '12' : '#FFFFFF',
                        borderColor: isActive ? activeColor : '#E8E8E8',
                        borderWidth: 1,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        marginRight: 8,
                      }}
                      className="active:opacity-80"
                    >
                      <Text style={{ color: isActive ? activeColor : '#6B7280', fontWeight: 'bold', fontSize: 12 }}>
                        {label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* Scrollable vertical list */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 }}
              style={{ flex: 1 }}
            >
              {filteredNearbyIssues.length > 0 ? (
                filteredNearbyIssues.map((item) => (
                  <NearbyListRow
                    key={item.id}
                    item={item}
                    onPress={() => {
                      openReportDetail(item);
                    }}
                  />
                ))
              ) : (
                <View style={{ marginTop: 40 }}>
                  <EmptyState
                    title="No reports match this status"
                    subtitle={nearbyFilter === 'ALL' 
                      ? `No active reports found within your ${radiusKm}km radius.`
                      : `No active ${nearbyFilter.toLowerCase()} reports inside your alert radius.`}
                    icon="leaf-outline"
                  />
                </View>
              )}
            </ScrollView>
            
          </View>
        </View>
      </Modal>

      <ReportDetailSheet
        reportId={selectedReportId}
        onClose={() => setSelectedReportId(null)}
      />
    </View>
  );
}