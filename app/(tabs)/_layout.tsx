import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs, usePathname, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from "../../config/authConfig";
import { ScrollProvider, useScrollContext } from '../../config/tabBarScrollContext';

// ─────────────────────────────────────────────
// Tab definition
// ─────────────────────────────────────────────
const TABS = [
  { name: 'home',    label: 'Home',    icon: 'home-outline',   iconFocused: 'home'   },
  { name: 'map',     label: 'Map',     icon: 'map-outline',    iconFocused: 'map'    },
  { name: 'report',  label: 'Report',  icon: 'add',            iconFocused: 'add'    },
  { name: 'history', label: 'History', icon: 'time-outline',   iconFocused: 'time'   },
  { name: 'profile', label: 'Profile', icon: 'person-outline', iconFocused: 'person' },
] as const;

const ACTIVE_COLOR   = '#0D8A72';
const INACTIVE_COLOR = '#9CA3AF';

// ─────────────────────────────────────────────
// Custom Tab Bar
// ─────────────────────────────────────────────
function CustomTabBar() {
  const router   = useRouter();
  const pathname = usePathname();
  const insets   = useSafeAreaInsets();
  const { tabBarTranslateY } = useScrollContext();

  const bottomOffset = Math.max(insets.bottom, 8) + 12;

  return (
    <Animated.View
      style={{ 
        position: 'absolute', 
        left: 24, 
        right: 24, 
        bottom: bottomOffset,
        transform: [{ translateY: tabBarTranslateY }],
      }}
    >
      <View className="flex-row items-end justify-around bg-white rounded-[28px] px-2 pt-2.5 pb-3"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 8,
          borderWidth: 1,
          borderColor: '#F0F0F0',
        }}
      >
        {TABS.map((tab) => {
          const isActive = pathname.includes(tab.name);
          const isFab    = tab.name === 'report';

          if (isFab) {
            return (
          <Pressable
            key={tab.name}
            onPress={() => router.push(`/(tabs)/${tab.name}`)}
            className="flex-1 items-center justify-end"
            style={{ marginTop: -60 }}
          >

            {/* FAB circle */}
            <View
              className={`w-[54px] h-[54px] rounded-full items-center justify-center bg-[#0D8A72]`}
              style={{
                elevation: 6,
                shadowColor: '#0D8A72',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
            >
              <Ionicons name="add" size={30} color="#FFFFFF" />
            </View>

            <Text
              className="text-[10px] font-semibold mt-1.5"
              style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}
            >
              {tab.label}
            </Text>
          </Pressable>
            );
          }

          return (
            <Pressable
              key={tab.name}
              onPress={() => router.push(`/(tabs)/${tab.name}`)}
              className="flex-1 items-center justify-center pb-0.5 gap-0.5"
            >
              <Ionicons
                name={isActive ? tab.iconFocused : tab.icon}
                size={23}
                color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
              />
              <Text
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Root Layout
// ─────────────────────────────────────────────
export default function TabLayout() {
    const { user, loading, isProfileComplete } = useAuth();

    // Still checking auth state — show spinner
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#0D8A72" size="large" />
      </View>
    );
  }

  // Not logged in → redirect to login
  if (!user) {
    return <Redirect href="/(auth)/loginScreen" />;
  }

  // Logged in but profile is incomplete → redirect to completeProfile
  if (!isProfileComplete) {
    return <Redirect href={"/(auth)/completeProfile" as any} />;
  }

  return (
    
    <ScrollProvider>
      <Tabs
        tabBar={() => <CustomTabBar />}
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="home"    options={{ title: 'Home'    }} />
        <Tabs.Screen name="map"     options={{ title: 'Map'     }} />
        <Tabs.Screen name="report"  options={{ title: 'Report'  }} />
        <Tabs.Screen name="history" options={{ title: 'History' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
      </Tabs>
    </ScrollProvider>
  );
}