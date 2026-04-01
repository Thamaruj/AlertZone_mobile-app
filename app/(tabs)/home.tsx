import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollContext } from '../../config/tabBarScrollContext';

// ─────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────
const CATEGORIES = [
  { id: '1', label: 'Hazard',   icon: 'warning-outline'      },
  { id: '2', label: 'Lighting', icon: 'bulb-outline'         },
  { id: '3', label: 'Waste',    icon: 'trash-outline'        },
  { id: '4', label: 'Roads',    icon: 'construct-outline'    },
  { id: '5', label: 'Water',    icon: 'water-outline'        },
  { id: '6', label: 'Safety',   icon: 'shield-outline'       },
];

const NEARBY_ISSUES = [
  {
    id: '1',
    title: 'Large Pothole',
    distance: '200m away',
    status: 'PENDING',
    statusColor: '#F59E0B',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&q=80',
  },
  {
    id: '2',
    title: 'Broken Streetlight',
    distance: '450m away',
    status: 'FIXING',
    statusColor: '#4CC2D1',
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&q=80',
  },
  {
    id: '3',
    title: 'Overflowing Bin',
    distance: '1.1km away',
    status: 'REPORTED',
    statusColor: '#A78BFA',
    image: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&q=80',
  },
];

const LATEST_UPDATES = [
  {
    id: '1',
    title: 'Issue Resolved: "Blocked Drain"',
    subtitle: 'Main St. • 2 hours ago',
    icon: 'checkmark-circle',
    iconColor: '#30A89C',
    iconBg: '#0D3D35',
  },
  {
    id: '2',
    title: 'Status Update: "Broken Footpath"',
    subtitle: 'Park Ave. • 5 hours ago',
    icon: 'construct',
    iconColor: '#F59E0B',
    iconBg: '#3D2E0A',
  },
  {
    id: '3',
    title: 'New Report Near You: "Graffiti"',
    subtitle: 'High St. • Yesterday',
    icon: 'alert-circle',
    iconColor: '#E05C5C',
    iconBg: '#3D1515',
  },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <Text className="text-white text-lg font-bold">{title}</Text>
      {actionLabel && (
        <Pressable onPress={onAction}>
          <Text className="text-[#4CC2D1] text-sm font-semibold">{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

function CategoryChip({ label, icon }: { label: string; icon: string }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      className="items-center"
      style={{ width: 72 }}
    >
      <View className={`w-14 h-14 rounded-2xl items-center justify-center mb-1.5 ${pressed ? 'bg-[#30A89C]/30' : 'bg-[#1E3A44]'}`}
        style={{ borderWidth: 1, borderColor: pressed ? '#30A89C' : '#2D4F5C' }}
      >
        <Ionicons name={icon as any} size={24} color={pressed ? '#4CC2D1' : '#5A7D8A'} />
      </View>
      <Text className="text-gray-400 text-[11px] text-center">{label}</Text>
    </Pressable>
  );
}

function NearbyCard({ item }: { item: typeof NEARBY_ISSUES[0] }) {
  return (
    <Pressable className="mr-3 active:opacity-90" style={{ width: 180 }}>
      <View className="rounded-2xl overflow-hidden bg-[#1E3A44]" style={{ borderWidth: 1, borderColor: '#2D4F5C' }}>
        {/* Image */}
        <View style={{ height: 110 }}>
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
          {/* Status badge */}
          <View
            className="absolute top-2 left-2 px-2 py-0.5 rounded-md"
            style={{ backgroundColor: item.statusColor }}
          >
            <Text className="text-[10px] font-bold text-white tracking-wider">{item.status}</Text>
          </View>
        </View>
        {/* Info */}
        <View className="px-3 py-2.5">
          <Text className="text-white font-semibold text-sm" numberOfLines={1}>{item.title}</Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="location-outline" size={12} color="#5A7D8A" />
            <Text className="text-gray-500 text-xs ml-1">{item.distance}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function UpdateRow({ item }: { item: typeof LATEST_UPDATES[0] }) {
  return (
    <Pressable className="flex-row items-center py-3 active:opacity-70">
      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: item.iconBg }}>
        <Ionicons name={item.icon as any} size={20} color={item.iconColor} />
      </View>
      <View className="flex-1">
        <Text className="text-white text-sm font-semibold" numberOfLines={1}>{item.title}</Text>
        <Text className="text-gray-500 text-xs mt-0.5">{item.subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color="#2D4F5C" />
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function HomeScreen() {
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { onScroll } = useScrollContext();

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120, // space for floating tab bar
        }}
      >

        {/* ── 1. Top Nav ── */}
        <View className="flex-row justify-between items-center px-5 mb-5">
          <View className="flex-row items-center gap-2">
            <Image
              source={require('../../assets/images/iconAlerZone-Bg-none.png')}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            <Text className="text-white text-xl font-bold tracking-tight">AlertZone</Text>
          </View>

          {/* Notification bell with badge */}
          <Pressable className="active:opacity-70">
            <View className="w-10 h-10 rounded-full bg-[#1E3A44] items-center justify-center"
              style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
            >
              <Ionicons name="notifications-outline" size={20} color="#5A7D8A" />
            </View>
            <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E05C5C] items-center justify-center">
              <Text className="text-white text-[10px] font-bold">10</Text>
            </View>
          </Pressable>
        </View>

        {/* ── 2. Hero Banner ── */}
        <View className="mx-5 mb-6">
          <LinearGradient
            colors={['#1A3D4A', '#0F2D38']}
            className="rounded-3xl overflow-hidden p-5"
            style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
          >
            <View className="flex-row items-center">
              {/* Left: Text + Buttons */}
              <View className="flex-1 pr-3">
                <Text className="text-white text-xl font-bold leading-7">
                  Your Voice Builds{'\n'}a Better City.
                </Text>
                <Text className="text-gray-400 text-xs mt-2 leading-4">
                  Report infrastructure issues{'\n'}directly to local authorities.
                </Text>

                <Pressable
                  className="mt-4 bg-[#4CC2D1] rounded-xl flex-row items-center px-3 py-2 active:opacity-80"
                  onPress={() => router.push('/(tabs)/report')}
                >
                  <Ionicons name="camera-outline" size={15} color="#071318" />
                  <Text className="text-[#071318] font-bold text-sm ml-1.5">New Report</Text>
                </Pressable>

                <Pressable
                  className="mt-2 rounded-xl flex-row items-center px-3 py-2 active:opacity-70"
                  style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
                >
                  <Ionicons name="list-outline" size={15} color="#4CC2D1" />
                  <Text className="text-[#4CC2D1] font-semibold text-sm ml-1.5">View My Reports</Text>
                </Pressable>
              </View>

              {/* Right: Illustration placeholder */}
              <View
                className="w-28 h-28 rounded-2xl overflow-hidden items-center justify-center bg-[#0D2A35]"
                style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
              >
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=300&q=80' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
                {/* Teal tint overlay */}
                <View className="absolute inset-0 bg-[#4CC2D1]/20" />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── 3. Browse Categories ── */}
        <View className="px-5 mb-6">
          <SectionHeader
            title="Browse Categories"
            actionLabel="See All"
          />
          <View className="flex-row flex-wrap gap-y-3" style={{ gap: 8 }}>
            {CATEGORIES.map((cat) => (
              <CategoryChip key={cat.id} label={cat.label} icon={cat.icon} />
            ))}
          </View>
        </View>

        {/* ── 4. Nearby Issues ── */}
        <View className="mb-6">
          <View className="px-5">
            <SectionHeader
              title="Nearby Issues"
              actionLabel="View Map"
              onAction={() => router.push('/(tabs)/map')}
            />
          </View>
          <FlatList
            data={NEARBY_ISSUES}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
            renderItem={({ item }) => <NearbyCard item={item} />}
          />
        </View>

        {/* ── 5. Latest Updates ── */}
        <View className="px-5">
          <SectionHeader title="Latest Updates" />
          <View
            className="bg-[#111E27] rounded-2xl px-4"
            style={{ borderWidth: 1, borderColor: '#1E3347' }}
          >
            {LATEST_UPDATES.map((item, index) => (
              <View key={item.id}>
                <UpdateRow item={item} />
                {index < LATEST_UPDATES.length - 1 && (
                  <View className="h-px bg-[#1E3347]" />
                )}
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </LinearGradient>
  );
}