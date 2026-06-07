import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams } from 'expo-router';
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../config/themeContext';
import { DARK_MAP_STYLE } from '../../config/mapStyle';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAuth } from '../../config/authConfig';
import { db } from '../../services/firebase';
import ReportDetailSheet from '../../components/ReportDetailSheet';


// ─────────────────────────────────────────────
// Types
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
  description: string;
  address: string;
  upvoteCount: number;
  createdAt: any;
  image?: string;
}

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const FILTER_CHIPS = [
  { id: 'all', label: 'All', icon: 'warning-outline', color: '#D97706' },
  { id: 'road_traffic', label: 'Roads', icon: 'car-outline', color: '#0D8A72' },
  { id: 'water_drainage', label: 'Water', icon: 'water-outline', color: '#3B82F6' },
  { id: 'waste_environment', label: 'Waste', icon: 'trash-outline', color: '#059669' },
  { id: 'social_safety', label: 'Safety', icon: 'shield-outline', color: '#7C3AED' },
  { id: 'bridge_structural', label: 'Structural', icon: 'git-network-outline', color: '#D97706' },
  { id: 'other', label: 'Other', icon: 'help-circle-outline', color: '#6B7280' },
];

const DEFAULT_REGION = {
  latitude: 6.8900,
  longitude: 79.8950,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: '#D97706',
  ASSIGNED: '#3B82F6',
  FIXING: '#0D8A72',
  RESOLVED: '#059669',
  REJECTED: '#DC2626',
};

// ─────────────────────────────────────────────
// Nearby List Row Component
// ─────────────────────────────────────────────
function NearbyListRow({ item, onPress }: { item: ReportPin & { distance?: number }; onPress: () => void }) {
  const { colors } = useTheme();
  const statusColor = STATUS_COLOR[item.status] || '#D97706';
  const statusBg = statusColor + '14';
  
  const formatDistance = (dist: number) => {
    if (dist < 1) {
      return `${Math.round(dist * 1000)}m`;
    }
    return `${dist.toFixed(1)}km`;
  };

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.card,
        borderRadius: 14,
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
          backgroundColor: colors.background,
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
        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }} numberOfLines={1}>
          {item.address || 'Sri Lanka'}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="location-outline" size={12} color={colors.primary} />
            <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>
              {item.distance !== undefined ? formatDistance(item.distance) : 'Nearby'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="arrow-up-circle-outline" size={12} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
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
        <Ionicons name="chevron-forward" size={16} color={colors.border} />
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Map Screen
// ─────────────────────────────────────────────
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const mapRef = useRef<MapView>(null);
  const params = useLocalSearchParams<{ lat?: string; lng?: string; id?: string }>();
  const { user, profile } = useAuth();

  const [reports, setReports] = useState<ReportPin[]>([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPin, setSelectedPin] = useState<ReportPin | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [region, setRegion] = useState(DEFAULT_REGION);
  const [locationGranted, setLocationGranted] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [radiusKm, setRadiusKm] = useState(5);
  const [isListOpen, setIsListOpen] = useState(false);
  const [detailReportId, setDetailReportId] = useState<string | null>(null);

  // ── Sync radius with profile ──
  useEffect(() => {
    if (profile?.alertRadius) {
      const numericRadius = parseInt(profile.alertRadius.replace(/[^0-9]/g, ''));
      if (!isNaN(numericRadius)) {
        setRadiusKm(numericRadius);
      }
    }
  }, [profile?.alertRadius]);

  // ── Handle incoming navigation params (View on Map) ──
  useEffect(() => {
    if (params.lat && params.lng) {
      const lat = parseFloat(params.lat);
      const lng = parseFloat(params.lng);
      if (!isNaN(lat) && !isNaN(lng)) {
        const targetRegion = {
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(targetRegion);
        setTimeout(() => {
          mapRef.current?.animateToRegion(targetRegion, 1000);
        }, 500);

        if (params.id && reports.length > 0) {
          const pin = reports.find(r => r.id === params.id);
          if (pin) setSelectedPin(pin);
        }
      }
    }
  }, [params.lat, params.lng, params.id, reports]);

  // ── Auto-open detail sheet if id is passed in search params ──
  useEffect(() => {
    if (params.id) {
      setDetailReportId(params.id);
      
      if (!params.lat || !params.lng) {
        const pin = reports.find(r => r.id === params.id);
        if (pin) {
          setSelectedPin(pin);
          const targetRegion = {
            latitude: pin.latitude,
            longitude: pin.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(targetRegion);
          setTimeout(() => {
            mapRef.current?.animateToRegion(targetRegion, 800);
          }, 300);
        }
      }
    }
  }, [params.id, reports, params.lat, params.lng]);

  // ── Subscribe to Firestore reports ──
  useEffect(() => {
    const q = query(
      collection(db, 'reports'),
      where('isArchived', '==', false),
      orderBy('createdAt', 'desc'),
    );

    const unsub = onSnapshot(q, (snap) => {
      const pins: ReportPin[] = snap.docs
        .map((d) => {
          const data = d.data();
          if (!data.location?.latitude || !data.location?.longitude) return null;
          if (data.status === 'RESOLVED' || data.status === 'REJECTED') return null;
          return {
            id: d.id,
            title: data.title ?? data.category ?? 'Report',
            categoryId: data.categoryId ?? 'road_traffic',
            categoryIcon: data.categoryIcon ?? 'warning-outline',
            categoryColor: data.categoryColor ?? '#0D8A72',
            latitude: data.location.latitude,
            longitude: data.location.longitude,
            status: data.status ?? 'PENDING',
            description: data.description ?? '',
            address: data.location.address ?? '',
            upvoteCount: data.upvoteCount ?? 0,
            createdAt: data.createdAt,
            image: data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls[0] : undefined,
          } as ReportPin;
        })
        .filter(Boolean) as ReportPin[];
      setReports(pins);
    });

    return unsub;
  }, []);

  // ── Request location ──
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      setLocationGranted(true);
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setUserLocation(coords);
      const userRegion = { ...coords, latitudeDelta: 0.05, longitudeDelta: 0.05 };
      setRegion(userRegion);
      mapRef.current?.animateToRegion(userRegion, 800);
    })();
  }, []);

  const zoomIn = () => {
    const next = { ...region, latitudeDelta: region.latitudeDelta / 2, longitudeDelta: region.longitudeDelta / 2 };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
  };

  const zoomOut = () => {
    const next = { ...region, latitudeDelta: region.latitudeDelta * 2, longitudeDelta: region.longitudeDelta * 2 };
    setRegion(next);
    mapRef.current?.animateToRegion(next, 300);
  };

  const goToMyLocation = async () => {
    if (!locationGranted) return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setUserLocation(coords);
    const r = { ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 };
    setRegion(r);
    mapRef.current?.animateToRegion(r, 800);
  };

  const updateProfileRadius = async (newRadius: number) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { alertRadius: `${newRadius} Km` });
    } catch (error) {
      console.error('❌ Radius sync error:', error);
    }
  };

  const increaseRadius = () => {
    const next = Math.min(radiusKm + 1, 15);
    setRadiusKm(next);
    updateProfileRadius(next);
  };

  const decreaseRadius = () => {
    const next = Math.max(radiusKm - 1, 1);
    setRadiusKm(next);
    updateProfileRadius(next);
  };

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const reportsInRadius = reports.filter(pin => {
    if (params.id === pin.id || selectedPin?.id === pin.id) return true;
    if (!userLocation) return true;
    const dist = getDistance(userLocation.latitude, userLocation.longitude, pin.latitude, pin.longitude);
    return dist <= radiusKm;
  });

  const counts = reportsInRadius.reduce((acc, pin) => {
    acc[pin.categoryId] = (acc[pin.categoryId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filteredPins = reportsInRadius.filter((pin) => {
    if (params.id === pin.id || selectedPin?.id === pin.id) return true;
    const matchesCategory = activeFilter === 'all' || pin.categoryId === activeFilter;
    return matchesCategory;
  });

  const activeChip = FILTER_CHIPS.find(c => c.id === activeFilter) || FILTER_CHIPS[0];
  const activeCount = activeFilter === 'all' ? reportsInRadius.length : (counts[activeFilter] || 0);

  const processedPins = filteredPins.map(pin => ({
    ...pin,
    distance: userLocation ? getDistance(userLocation.latitude, userLocation.longitude, pin.latitude, pin.longitude) : undefined
  }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation={locationGranted}
        showsMyLocationButton={false}
        onRegionChangeComplete={setRegion}
        customMapStyle={isDark ? DARK_MAP_STYLE : []}
      >
        {userLocation && (
          <Circle
            center={userLocation}
            radius={radiusKm * 1000}
            strokeColor={colors.primary + '66'}
            fillColor={colors.primary + '14'}
            strokeWidth={2}
          />
        )}
        {filteredPins.map((pin) => (
          <Marker
            key={pin.id}
            coordinate={{ latitude: pin.latitude, longitude: pin.longitude }}
            onPress={() => setSelectedPin(pin)}
          >
            <View style={{
              backgroundColor: pin.categoryColor,
              borderRadius: 20, padding: 6,
              borderWidth: 2, borderColor: colors.card,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
            }}>
              <Ionicons name={pin.categoryIcon as any} size={16} color="white" />
            </View>
          </Marker>
        ))}
      </MapView>

      <View style={{ position: 'absolute', top: insets.top + 8, left: 0, right: 0, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10, zIndex: 10 }}>
          {/* Dropdown Selector Button */}
          <Pressable
            onPress={() => setShowDropdown(!showDropdown)}
            style={{
              flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: colors.card, borderRadius: 14,
              paddingHorizontal: 14, paddingVertical: 12,
              borderWidth: 1, borderColor: colors.border,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06, shadowRadius: 6, elevation: 4,
            }}
            className="active:opacity-75"
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name={activeChip.icon as any} size={18} color={activeChip.color} />
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: '600' }}>
                {activeChip.label} {activeCount > 0 ? `(${activeCount})` : ''}
              </Text>
            </View>
            <Ionicons name={showDropdown ? "chevron-up" : "chevron-down"} size={18} color={colors.textSecondary} />
          </Pressable>

          {/* List Toggle Button */}
          <Pressable
            onPress={() => { setIsListOpen(!isListOpen); setShowDropdown(false); }}
            style={{
              backgroundColor: colors.card, width: 44, borderRadius: 14,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 1, borderColor: colors.border,
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06, shadowRadius: 6, elevation: 4,
            }}
            className="active:opacity-70"
          >
            <Ionicons name={isListOpen ? "map-outline" : "list-outline"} size={20} color={colors.primary} />
          </Pressable>
        </View>

        {/* Dropdown Floating Options Card */}
        {showDropdown && (
          <View
            style={{
              position: 'absolute', top: 52, left: 16, right: 68,
              backgroundColor: colors.card, borderRadius: 14,
              borderWidth: 1, borderColor: colors.border,
              paddingVertical: 6,
              shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1, shadowRadius: 10, elevation: 8,
              zIndex: 100,
            }}
          >
            {FILTER_CHIPS.map((chip) => {
              const isSelected = activeFilter === chip.id;
              const count = chip.id === 'all' ? reportsInRadius.length : (counts[chip.id] || 0);
              return (
                <Pressable
                  key={chip.id}
                  onPress={() => {
                    setActiveFilter(chip.id);
                    setSelectedPin(null);
                    setShowDropdown(false);
                  }}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 16, paddingVertical: 10,
                    backgroundColor: isSelected ? colors.primary + '12' : (pressed ? colors.background : 'transparent'),
                  })}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name={chip.icon as any} size={16} color={chip.color} />
                    <Text style={{ color: isSelected ? colors.primary : colors.text, fontSize: 13, fontWeight: isSelected ? '700' : '500' }}>
                      {chip.label}
                    </Text>
                  </View>
                  <View style={{ backgroundColor: isSelected ? colors.primary : colors.border, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ color: isSelected ? '#FFFFFF' : colors.textSecondary, fontSize: 10, fontWeight: '700' }}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {isListOpen && (
          <View style={{
            marginTop: 10, backgroundColor: colors.card, borderRadius: 16,
            maxHeight: 350, borderWidth: 1, borderColor: colors.border,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
            overflow: 'hidden'
          }}>
            <View style={{ padding: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 13 }}>
                Nearby Reports ({processedPins.length})
              </Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 12 }}>
              {processedPins.length === 0 ? (
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Ionicons name="warning-outline" size={30} color={colors.border} />
                  <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 10 }}>No reports found in this area.</Text>
                </View>
              ) : (
                processedPins.map((item) => (
                  <NearbyListRow
                    key={item.id}
                    item={item}
                    onPress={() => {
                      setSelectedPin(item);
                      setIsListOpen(false);
                      mapRef.current?.animateToRegion({
                        latitude: item.latitude,
                        longitude: item.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01
                      }, 800);
                    }}
                  />
                ))
              )}
            </ScrollView>
          </View>
        )}
      </View>

      <View style={{ position: 'absolute', bottom: selectedPin ? 280 : 170, left: 16 }}>
        <View style={{
          backgroundColor: colors.card, borderRadius: 14,
          padding: 10, borderWidth: 1, borderColor: colors.border,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 6, elevation: 4,
        }}>
          <View className="items-center mr-2">
            <Text style={{ color: colors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Radius</Text>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{radiusKm}km</Text>
          </View>
          <Pressable onPress={decreaseRadius} style={{ width: 32, height: 32, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }} className="active:opacity-70">
            <Ionicons name="remove" size={18} color={colors.primary} />
          </Pressable>
          <Pressable onPress={increaseRadius} style={{ width: 32, height: 32, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }} className="active:opacity-70">
            <Ionicons name="add" size={18} color={colors.primary} />
          </Pressable>
        </View>
      </View>

      <View style={{ position: 'absolute', right: 16, bottom: selectedPin ? 260 : 170 }}>
        <Pressable onPress={goToMyLocation} className="active:opacity-80" style={{
          width: 40, height: 40, backgroundColor: colors.primary,
          borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        }}>
          <Ionicons name="navigate" size={18} color="#FFFFFF" />
        </Pressable>
        <Pressable onPress={zoomIn} className="active:opacity-80" style={{
          width: 40, height: 40, backgroundColor: colors.card,
          borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: colors.border, marginBottom: 8,
        }}>
          <Ionicons name="add" size={20} color={colors.text} />
        </Pressable>
        <Pressable onPress={zoomOut} className="active:opacity-80" style={{
          width: 40, height: 40, backgroundColor: colors.card,
          borderRadius: 10, alignItems: 'center', justifyContent: 'center',
          borderWidth: 1, borderColor: colors.border,
        }}>
          <Ionicons name="remove" size={20} color={colors.text} />
        </Pressable>
      </View>

      {selectedPin && (
        <Pressable
          onPress={() => setDetailReportId(selectedPin.id)}
          style={{
            position: 'absolute', bottom: 110, left: 16, right: 16,
          }}
        >
        <View style={{
          backgroundColor: colors.card, borderRadius: 18, padding: 16,
          borderWidth: 1, borderColor: colors.border,
          shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1, shadowRadius: 12, elevation: 8,
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <View style={{
              backgroundColor: (STATUS_COLOR[selectedPin.status] ?? '#D97706') + '14',
              borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
              borderWidth: 1, borderColor: (STATUS_COLOR[selectedPin.status] ?? '#D97706') + '40',
            }}>
              <Text style={{ color: STATUS_COLOR[selectedPin.status] ?? '#D97706', fontSize: 11, fontWeight: '700' }}>
                {selectedPin.status}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>Tap for full details</Text>
              <Pressable onPress={(e) => { e.stopPropagation?.(); setSelectedPin(null); }} className="active:opacity-70 p-1">
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 44, height: 44, borderRadius: 12,
              backgroundColor: selectedPin.categoryColor + '18',
              alignItems: 'center', justifyContent: 'center', marginRight: 12,
            }}>
              <Ionicons name={selectedPin.categoryIcon as any} size={22} color={selectedPin.categoryColor} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={1}>{selectedPin.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>{selectedPin.address}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Ionicons name="arrow-up-circle-outline" size={13} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '600' }}>{selectedPin.upvoteCount} upvotes</Text>
                </View>
              </View>
            </View>
          </View>
          {selectedPin.description.length > 0 && (
            <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 10, lineHeight: 17 }} numberOfLines={2}>
              {selectedPin.description}
            </Text>
          )}
        </View>
        </Pressable>
      )}

      {!selectedPin && (
        <View style={{
          position: 'absolute', bottom: 110, left: 16, right: 16,
          backgroundColor: colors.card, borderRadius: 14,
          paddingHorizontal: 16, paddingVertical: 10,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          borderWidth: 1, borderColor: colors.border,
          shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06, shadowRadius: 6, elevation: 4,
        }}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}>
            {reports.length === 0 ? 'No active reports yet' : `${filteredPins.length} reports in radius · Tap a pin for details`}
          </Text>
        </View>
      )}

      <ReportDetailSheet
        reportId={detailReportId}
        onClose={() => setDetailReportId(null)}
      />
    </View>
  );
}