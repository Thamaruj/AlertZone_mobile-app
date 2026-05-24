import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// Configure notification behavior when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers the device for push notifications, retrieves the Expo Push Token,
 * and saves it to the user's Firestore profile document.
 * 
 * @param userId The authenticated user's ID
 * @returns The Expo Push Token string, or null if registration failed
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  let token: string | null = null;

  try {
    // 1. Check if device is emulator or physical device (informational only)
    if (!Platform.isTV) { // Platform check if needed, but we check physical device
      // expo-device can be used, but standard permission flow is sufficient
    }

    // 2. Check and request notification permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.warn('⚠️ Push notification permission not granted!');
      return null;
    }

    // 3. Get the Expo Push Token using the project ID
    // Expo Go requires a projectId from the configuration
    const projectId = 
      Constants.expoConfig?.extra?.eas?.projectId ?? 
      Constants.easConfig?.projectId;
      
    console.log('📱 Fetching Expo Push Token with Project ID:', projectId);

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    
    token = tokenData.data;
    console.log('🔔 Expo Push Token retrieved:', token);

    // 4. Update the user's document in Firestore
    if (token && userId) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        expoPushToken: token,
        fcmToken: token, // Stored as fcmToken as well for legacy backend queries
        updatedAt: new Date()
      });
      console.log('✅ Registered token in Firestore for user:', userId);
    }

    // 5. Setup Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }
  } catch (error) {
    console.error('❌ Error registering for push notifications:', error);
  }

  return token;
}

/**
 * Removes the push token from the user's Firestore profile document (e.g. on logout).
 * 
 * @param userId The user's ID
 */
export async function unregisterPushNotificationsAsync(userId: string): Promise<void> {
  try {
    if (userId) {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        expoPushToken: null,
        fcmToken: null,
        updatedAt: new Date()
      });
      console.log('✅ Unregistered push token for user:', userId);
    }
  } catch (error) {
    console.error('❌ Error unregistering push notifications:', error);
  }
}
