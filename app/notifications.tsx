import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../config/authConfig';
import { useTheme } from '../config/themeContext';
import { AppNotification, NotificationType } from '../types/notification';

// ─────────────────────────────────────────────
// UI Constants & Meta
// ─────────────────────────────────────────────
const TYPE_META: Record<
  NotificationType,
  { color: string; bg: string; icon: string }
> = {
  status_change: { color: '#0D8A72', bg: 'rgba(13, 138, 114, 0.1)', icon: 'construct' },
  upvote: { color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)', icon: 'arrow-up-circle' },
  badge_earned: { color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)', icon: 'trophy' },
  system: { color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)', icon: 'alert-circle' },
  comment: { color: '#A78BFA', bg: 'rgba(167, 139, 250, 0.1)', icon: 'chatbubble-ellipses' },
};

const timeAgo = (createdAt: any) => {
  if (!createdAt) return 'Recently';
  let date: Date;
  if (typeof createdAt.toDate === 'function') {
    date = createdAt.toDate();
  } else if (createdAt instanceof Date) {
    date = createdAt;
  } else {
    date = new Date(createdAt);
  }

  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 0) return 'Just now'; // prevent negative timing due to clock drift
  
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

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'unread' | 'all' | NotificationType>('unread');

  // Staggered exit animation state for "Clear All"
  const [clearingAll, setClearingAll] = useState(false);
  const [clearedCount, setClearedCount] = useState(0);
  const [clearingIds, setClearingIds] = useState<string[]>([]);

  const handleClearAll = () => {
    if (filteredNotifications.length === 0 || clearingAll) return;
    const idsToClear = filteredNotifications.map((n) => n.id);
    setClearingIds(idsToClear);
    setClearedCount(0);
    setClearingAll(true);
  };

  const handleItemAnimationComplete = () => {
    setClearedCount((prev) => {
      const next = prev + 1;
      if (next >= clearingIds.length) {
        executeClearAll(clearingIds);
      }
      return next;
    });
  };

  const executeClearAll = async (ids: string[]) => {
    try {
      const batch = writeBatch(db);
      ids.forEach((id) => {
        batch.delete(doc(db, 'notifications', id));
      });
      await batch.commit();
    } catch (e) {
      console.error('❌ Error clearing all notifications:', e);
    } finally {
      setClearingAll(false);
      setClearingIds([]);
      setClearedCount(0);
    }
  };

  // 1. Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: AppNotification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            recipientUid: data.recipientUid,
            type: data.type,
            title: data.title ?? 'AlertZone Notification',
            body: data.body ?? '',
            reportId: data.reportId,
            data: data.data,
            isRead: data.isRead ?? false,
            createdAt: data.createdAt,
          } as AppNotification;
        });

        setNotifications(list);
        setLoading(false);
      },
      (error) => {
        console.error('❌ Error listening to notifications:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // Actions
  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { isRead: true });
    } catch (e) {
      console.error('❌ Error marking notification as read:', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error('❌ Error deleting notification:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter((n) => !n.isRead);
    if (unread.length === 0) return;

    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { isRead: true });
      });
      await batch.commit();
    } catch (e) {
      console.error('❌ Error marking all as read:', e);
    }
  };

  const handleNotificationPress = (item: AppNotification) => {
    if (!item.isRead) {
      handleMarkAsRead(item.id);
    }

    if (item.reportId) {
      const lat = item.data?.latitude || item.data?.reportLocation?.latitude;
      const lng = item.data?.longitude || item.data?.reportLocation?.longitude;

      if (lat && lng) {
        router.push({
          pathname: '/(tabs)/map',
          params: {
            id: item.reportId,
            lat: String(lat),
            lng: String(lng),
          },
        });
      } else {
        router.push({
          pathname: '/(tabs)/map',
          params: { id: item.reportId },
        });
      }
    }
  };

  // Filter list
  const filteredNotifications = notifications.filter((notif) => {
    if (activeFilter === 'unread') return !notif.isRead;
    if (activeFilter === 'all') return true;
    return notif.type === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingBottom: 12,
          paddingHorizontal: 20,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full items-center justify-center border active:opacity-75"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </Pressable>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text className="text-lg font-bold" style={{ color: colors.text }}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={{ backgroundColor: '#DC2626', paddingHorizontal: 6, paddingVertical: 1.5, borderRadius: 10, minWidth: 18, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '800' }}>{unreadCount}</Text>
                </View>
              )}
            </View>
            {unreadCount > 0 && (
              <Text className="text-xs font-semibold" style={{ color: colors.primary }}>{unreadCount} unread messages</Text>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-2">
          {unreadCount > 0 && (
            <Pressable
              onPress={handleMarkAllAsRead}
              disabled={clearingAll}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border active:opacity-75"
              style={{ backgroundColor: colors.successBg, borderColor: colors.successBorder }}
            >
              <Ionicons name="checkmark-done" size={14} color={colors.successText} />
              <Text style={{ color: colors.successText, fontSize: 12, fontWeight: 'bold' }}>Read All</Text>
            </Pressable>
          )}

          {filteredNotifications.length > 0 && (
            <Pressable
              onPress={handleClearAll}
              disabled={clearingAll}
              className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-lg border active:opacity-75"
              style={{ backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }}
            >
              <Ionicons name="trash-outline" size={14} color={colors.dangerText} />
              <Text style={{ color: colors.dangerText, fontSize: 12, fontWeight: 'bold' }}>Clear All</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <View className="px-5 py-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { id: 'unread', label: 'Unread' },
            { id: 'all', label: 'All' },
            { id: 'status_change', label: 'Reports' },
            { id: 'upvote', label: 'Upvotes' },
            { id: 'comment', label: 'Comments' },
            { id: 'badge_earned', label: 'Rewards' },
            { id: 'system', label: 'System' },
          ]}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => {
            const isActive = activeFilter === item.id;
            return (
              <Pressable
                onPress={() => setActiveFilter(item.id as any)}
                disabled={clearingAll}
                className="mr-2 active:opacity-80"
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: colors.card,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: isActive ? colors.primary : colors.border,
                }}
              >
                <Text
                  style={{
                    color: isActive ? colors.primary : colors.textSecondary,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {item.label}
                </Text>
                {item.id === 'unread' && unreadCount > 0 && (
                  <View
                    style={{
                      marginLeft: 6,
                      backgroundColor: '#DC2626',
                      borderRadius: 10,
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      minWidth: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '800' }}>
                      {unreadCount}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      </View>

      {/* List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View className="flex-1 justify-center items-center px-8">
          <View className="w-16 h-16 rounded-full items-center justify-center mb-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <Ionicons name="notifications-off-outline" size={28} color={colors.primary} />
          </View>
          <Text className="text-base font-bold mb-1" style={{ color: colors.text }}>All caught up!</Text>
          <Text className="text-xs text-center leading-5" style={{ color: colors.textMuted }}>
            {"You don't have any notifications under this filter at the moment."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          renderItem={({ item, index }) => {
            const isItemClearing = clearingIds.includes(item.id);
            const clearDelay = Math.min(index * 60, 600);

            return (
              <NotificationCard
                item={item}
                isClearingAll={isItemClearing}
                clearDelay={clearDelay}
                onAnimationComplete={handleItemAnimationComplete}
                onPress={handleNotificationPress}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
              />
            );
          }}
        />
      )}
    </View>
  );
}

// ─────────────────────────────────────────────
// Notification Card Component with Exit Animations
// ─────────────────────────────────────────────
interface NotificationCardProps {
  item: AppNotification;
  isClearingAll: boolean;
  clearDelay: number;
  onAnimationComplete: () => void;
  onPress: (item: AppNotification) => void;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationCard({
  item,
  isClearingAll,
  clearDelay,
  onAnimationComplete,
  onPress,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
  const meta = TYPE_META[item.type] || TYPE_META.system;
  const animValue = useRef(new Animated.Value(1)).current;
  const [isDeletingLocal, setIsDeletingLocal] = useState(false);
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (isClearingAll) {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 300,
        delay: clearDelay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start(() => {
        onAnimationComplete();
      });
    }
  }, [isClearingAll]);

  const handleDeletePress = () => {
    if (isDeletingLocal) return;
    setIsDeletingLocal(true);
    Animated.timing(animValue, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start(() => {
      onDelete(item.id);
    });
  };

  const scale = animValue;
  const opacity = animValue;
  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [400, 0],
  });

  const maxHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const marginBottom = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 12],
  });

  return (
    <Animated.View
      style={{
        opacity,
        maxHeight,
        marginBottom,
        overflow: 'hidden',
        transform: [{ scale }, { translateX }],
      }}
    >
      <View
        className="rounded-2xl border overflow-hidden relative"
        style={{
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderLeftWidth: item.isRead ? 1 : 4,
          borderLeftColor: item.isRead ? colors.border : meta.color,
        }}
      >
        {/* Glow/Dot indicator */}
        {!item.isRead && (
          <View className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[#DC2626]" />
        )}

        <Pressable
          onPress={() => onPress(item)}
          className="p-4 flex-row items-start gap-3 active:opacity-90"
        >
          <View
            className="w-10 h-10 rounded-xl items-center justify-center flex-shrink-0"
            style={{ backgroundColor: meta.bg }}
          >
            <Ionicons name={meta.icon as any} size={20} color={meta.color} />
          </View>

          <View className="flex-1 pr-4">
            <Text className="font-bold text-sm" style={{ color: colors.text }} numberOfLines={1}>
              {item.title}
            </Text>
            <Text className="text-xs mt-1 leading-5" style={{ color: colors.textSecondary }}>
              {item.body}
            </Text>
            {item.reportId && (
              <Text className="text-[11px] font-semibold mt-1" style={{ color: colors.primary }}>
                Ref: {item.reportId}
              </Text>
            )}
            <Text className="text-[10px] mt-2 font-medium" style={{ color: colors.textMuted }}>
              {timeAgo(item.createdAt)}
            </Text>
          </View>
        </Pressable>

        {/* Actions Panel */}
        <View
          className="px-4 py-2 border-t flex-row justify-end items-center gap-3"
          style={{
            borderTopColor: colors.border,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
          }}
        >
          {item.reportId && (
            <Pressable
              onPress={() => onPress(item)}
              className="flex-row items-center gap-1 py-1 px-2.5 rounded border active:opacity-75"
              style={{ backgroundColor: colors.card, borderColor: colors.border }}
            >
              <Ionicons name="map-outline" size={12} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 10, fontWeight: 'bold' }}>View on Map</Text>
            </Pressable>
          )}

          {!item.isRead && (
            <Pressable
              onPress={() => onMarkAsRead(item.id)}
              className="flex-row items-center gap-1 py-1 px-2.5 rounded border active:opacity-75"
              style={{ backgroundColor: colors.successBg, borderColor: colors.successBorder }}
            >
              <Ionicons name="checkmark" size={12} color={colors.successText} />
              <Text style={{ color: colors.successText, fontSize: 10, fontWeight: 'bold' }}>Mark as read</Text>
            </Pressable>
          )}

          <Pressable
            onPress={handleDeletePress}
            className="flex-row items-center gap-1 py-1 px-2.5 rounded border active:opacity-75"
            style={{ backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }}
          >
            <Ionicons name="trash-outline" size={12} color={colors.dangerText} />
            <Text style={{ color: colors.dangerText, fontSize: 10, fontWeight: 'bold' }}>Delete</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}
