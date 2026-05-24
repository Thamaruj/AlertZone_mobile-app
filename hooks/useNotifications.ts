import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useAuth } from '../config/authConfig';
import { registerForPushNotificationsAsync } from '../services/notification.service';

/**
 * Hook to manage notification setup, registration, and action handling.
 * To be called in the root layout of the app.
 */
export function useNotifications() {
  const { user } = useAuth();
  const router = useRouter();
  
  const notificationListener = useRef<any>(null);
  const responseListener = useRef<any>(null);

  useEffect(() => {
    // 1. If user is authenticated, register push token
    if (user?.uid) {
      registerForPushNotificationsAsync(user.uid);
    }

    // 2. Listen for notifications that are received while the app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Foreground Notification Received:', notification);
      }
    );

    // 3. Listen for when user taps on or interacts with a notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        console.log('🖱️ Notification Action Response Tapped:', data);

        if (data && data.reportId) {
          const { reportId, latitude, longitude } = data;
          
          if (latitude && longitude) {
            console.log(`🗺️ Navigating to Map tab: Report ${reportId} @ [${latitude}, ${longitude}]`);
            router.push(`/(tabs)/map?id=${reportId}&lat=${latitude}&lng=${longitude}` as any);
          } else {
            console.log(`🗺️ Navigating to Map tab: Report ${reportId} (no coordinates)`);
            router.push(`/(tabs)/map?id=${reportId}` as any);
          }
        }
      }
    );

    // Cleanup listeners on unmount
    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [user?.uid]);
}
