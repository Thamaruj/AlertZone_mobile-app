import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { useTheme } from '../../config/themeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordFromStorage, setIsPasswordFromStorage] = useState(false);

  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnrolled, setIsBiometricEnrolled] = useState(false);
  const [hasBiometricSetup, setHasBiometricSetup] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [pendingCredentials, setPendingCredentials] = useState<{ email: string; password: string } | null>(null);

  const passwordRef = useRef<TextInput>(null);

  // Pre-fill email if Remember Me was previously saved & securely purge legacy password data
  useEffect(() => {
    // Purge old format containing passwords if present
    AsyncStorage.getItem('rememberMeData').then((json) => {
      if (json) {
        try {
          const data = JSON.parse(json);
          if (data.email) {
            setEmail(data.email);
            setRememberMe(true);
            AsyncStorage.setItem('rememberMeEmail', data.email);
          }
        } catch {
          setEmail(json);
          setRememberMe(true);
          AsyncStorage.setItem('rememberMeEmail', json);
        }
        AsyncStorage.removeItem('rememberMeData');
      }
    });

    // Load new secure format
    AsyncStorage.getItem('rememberMeEmail').then((val) => {
      if (val) {
        setEmail(val);
        setRememberMe(true);
      }
    });
  }, []);

  // Biometrics availability check
  useEffect(() => {
    (async () => {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
      if (compatible) {
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        setIsBiometricEnrolled(enrolled);
      }
      
      const storedCreds = await SecureStore.getItemAsync('biometricCredentials');
      if (storedCreds) {
        setHasBiometricSetup(true);

        // Skip automatic prompt if the user has just logged out or session expired
        try {
          const justLoggedOut = await AsyncStorage.getItem('justLoggedOut');
          if (justLoggedOut === 'true') {
            await AsyncStorage.removeItem('justLoggedOut');
            console.log('Skipping automatic biometric prompt as user just logged out/session expired.');
            return;
          }
        } catch (e) {
          console.error('Error handling justLoggedOut flag in loginScreen:', e);
        }

        // Automatically prompt biometrics if it was previously configured
        setTimeout(() => {
          handleBiometricAuth();
        }, 800);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Securely request biometric validation and sign in
  const handleBiometricAuth = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!compatible || !enrolled) return;

      const storedCreds = await SecureStore.getItemAsync('biometricCredentials');
      if (!storedCreds) return;

      const { email: savedEmail, password: savedPassword } = JSON.parse(storedCreds);

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Log in to AlertZone',
        fallbackLabel: 'Use password',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setLoading(true);
        setEmail(savedEmail);
        setPassword(savedPassword);

        const userCredential = await signInWithEmailAndPassword(auth, savedEmail, savedPassword);
        const uid = userCredential.user.uid;
        const userDoc = await getDoc(doc(db, 'users', uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData.lastPasswordChange) {
            await AsyncStorage.setItem('lastPasswordChangeLocal', userData.lastPasswordChange);
          } else {
            await AsyncStorage.removeItem('lastPasswordChangeLocal');
          }
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: `Welcome, ${userData.fullName}!`,
          });
        } else {
          Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: 'Welcome!',
          });
        }
        setTimeout(() => {
          router.replace('/(tabs)/home');
        }, 1000);
      }
    } catch (error: any) {
      console.error('❌ Biometrics auth error:', error);
      Toast.show({
        type: 'error',
        text1: 'Biometrics Failed',
        text2: 'Could not log in using biometrics. Please enter password.',
      });
      setLoading(false);
    }
  };

  // Check and prompt to enable biometric login
  const navigateToHomeWithBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const storedCreds = await SecureStore.getItemAsync('biometricCredentials');

      if (compatible && enrolled && !storedCreds) {
        setPendingCredentials({ email, password });
        setShowBiometricPrompt(true);
      } else {
        router.replace('/(tabs)/home');
      }
    } catch {
      router.replace('/(tabs)/home');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
         Toast.show({
        type: 'error',
        text1: 'Incomplete Details',
        text2: 'Email and password are required to continue.',
         });
      return;
    }

    setLoading(true);

    try {
      // 1. Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

       // 2. Save or clear Remember Me (only storing email for security)
      if (rememberMe) {
        await AsyncStorage.setItem('rememberMeEmail', email);
      } else {
        await AsyncStorage.removeItem('rememberMeEmail');
      }

      // 3. Fetch user profile from Firestore to get their name for the welcome toast
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.lastPasswordChange) {
          await AsyncStorage.setItem('lastPasswordChangeLocal', userData.lastPasswordChange);
        } else {
          await AsyncStorage.removeItem('lastPasswordChangeLocal');
        }

        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: `Welcome back, ${userData.fullName}! 👋`,
        });

        setTimeout(() => {
          navigateToHomeWithBiometrics();
        }, 1000);

      } else {
        // Auth worked but no Firestore profile — navigate anyway
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: 'Welcome back!',
        });
        setTimeout(() => {
          navigateToHomeWithBiometrics();
        }, 1000);
      }

    } catch (error: any) {
        console.error('❌ Login Error:', error.code);

      let errorMessage = 'Invalid email or password.';
      if (error.code === 'auth/network-request-failed') errorMessage = 'Network error. Check your connection.';
      if (error.code === 'auth/too-many-requests')      errorMessage = 'Too many attempts. Try again later.';
      if (error.code === 'auth/user-disabled')          errorMessage = 'This account has been disabled.';

      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
      });

        setPassword('');
        setRememberMe(false);

    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.card, colors.background]}
      className="flex-1"
    >
      <KeyboardAvoidingView 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View className="flex-1 px-8 pt-20 pb-10 justify-center">
            
            {/* 1. Logo Section */}
            <View className="items-center mb-8">
              <Image 
                source={require('../../assets/images/iconAlerZone-Bg-none.png')} 
                className="w-24 h-24"
                resizeMode="contain"
              />
              <Text className="text-3xl font-bold mt-4" style={{ color: colors.text }}>Welcome!</Text>
              <Text className="text-center mt-2" style={{ color: colors.textSecondary }}>
                Log in to continue making your{"\n"}community safer.
              </Text>
            </View>

            {/* 2. Input Fields */}
            <View className="space-y-4">
              {/* Email Field */}
              <View
                className="border rounded-2xl flex-row items-center p-1"
                style={{
                  backgroundColor: colors.card,
                  borderColor: isEmailFocused ? colors.primary : colors.border
                }}
              >
                <View
                  className="px-3 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                </View>
                <View className="flex-1 px-3 py-2">
                  <Text className="text-xs p-0 m-0" style={{ color: colors.textSecondary }}>E-mail:</Text>
                  <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor={colors.textSecondary}
                    className="text-base p-0 m-0"
                    style={{ color: colors.text, paddingLeft: 0, marginLeft: 0 }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    editable={!loading}
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                  />
                </View>
              </View>

              {/* Password Field */}
              <View
                className="border rounded-2xl flex-row items-center p-1 mt-4"
                style={{
                  backgroundColor: colors.card,
                  borderColor: isPasswordFocused ? colors.primary : colors.border
                }}
              >
                <View
                  className="px-3 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                </View>
                <View className="flex-1 px-3 py-2">
                  <Text className="text-xs p-0 m-0" style={{ color: colors.textSecondary }}>Password:</Text>
                  <TextInput
                    ref={passwordRef}
                    placeholder="Enter your password"
                    placeholderTextColor={colors.textSecondary}
                    className="text-base p-0 m-0"
                    style={{ color: colors.text, paddingLeft: 0, marginLeft: 0 }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    value={password}
                    onChangeText={(val) => {
                      if (isPasswordFromStorage) {
                        setPassword('');
                        setIsPasswordFromStorage(false);
                      } else {
                        setPassword(val);
                      }
                    }}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>
                <Pressable 
                  onPress={() => {
                    if (isPasswordFromStorage) {
                      Toast.show({
                        type: 'info',
                        text1: 'Password Hidden',
                        text2: 'Type to reveal your password.',
                      });
                      return;
                    }
                    setShowPassword(!showPassword);
                  }} 
                  className="px-3"
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={isPasswordFromStorage ? colors.border : colors.primary}
                  />
                </Pressable>
              </View>
            </View>

            {/* 3. Remember Me & Forgot Password */}
            <View className="flex-row justify-between items-center mt-4 px-1">
              <Pressable 
                className="flex-row items-center" 
                onPress={() => setRememberMe(!rememberMe)}
              >
                <View
                  className="w-5 h-5 rounded border items-center justify-center"
                  style={{
                    backgroundColor: rememberMe ? colors.primary : 'transparent',
                    borderColor: rememberMe ? colors.primary : colors.textSecondary
                  }}
                >
                  {rememberMe && <Ionicons name="checkmark" size={14} color={isDark ? '#122D36' : '#FFFFFF'} />}
                </View>
                <Text className="ml-2" style={{ color: colors.textSecondary }}>Remember me</Text>
              </Pressable>
              
              <Pressable
                onPress={() => router.push("/(auth)/passwordReset")}
                className="active:opacity-70"
              >
                <Text style={{ color: colors.primary }}>Forgot Password?</Text>
              </Pressable>
            </View>

            {/* 4. Action Buttons */}
            <View className="mt-8">
              <View className="flex-row gap-3 items-center">
                <Pressable 
                  className="flex-1 p-4 rounded-full shadow-lg items-center active:opacity-70"
                  style={{
                    backgroundColor: loading ? (isDark ? '#4CC2D180' : '#0D8A7280') : colors.primary
                  }}
                  onPress={handleLogin}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={isDark ? '#122D36' : '#FFFFFF'} />
                  ) : (
                    <Text className="text-center font-bold text-lg" style={{ color: isDark ? '#122D36' : '#FFFFFF' }}>Log In</Text>
                  )}
                </Pressable>

                {isBiometricSupported && isBiometricEnrolled && hasBiometricSetup && (
                  <Pressable
                    onPress={handleBiometricAuth}
                    className="w-14 h-14 rounded-full border items-center justify-center active:opacity-80"
                    style={{
                      backgroundColor: colors.card,
                      borderColor: colors.border
                    }}
                  >
                    <Ionicons name="finger-print" size={26} color={colors.primary} />
                  </Pressable>
                )}
              </View>
            </View>

            {/* 5. Footer */}
            <View className="flex-row justify-center mt-10">
              <Text style={{ color: colors.textSecondary }}>Don&apos;t have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/signupScreen")} className="active:opacity-70">
                <Text className="font-bold" style={{ color: colors.primary }}>Create Account</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Visual Custom Biometric Prompt Dialog */}
      <Modal visible={showBiometricPrompt} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/75 px-6">
          <View
            className="w-full max-w-sm rounded-3xl p-6 border items-center"
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 15,
              elevation: 20
            }}
          >
            <View
              className="w-16 h-16 rounded-full items-center justify-center mb-4 border"
              style={{
                backgroundColor: colors.card,
                borderColor: isDark ? '#4CC2D150' : '#0D8A7230'
              }}
            >
              <Ionicons name="finger-print" size={32} color={colors.primary} />
            </View>
            <Text className="text-xl font-bold text-center mb-2" style={{ color: colors.text }}>Enable Biometrics</Text>
            <Text className="text-sm text-center leading-5 mb-6" style={{ color: colors.textSecondary }}>
              Would you like to log in quickly using Face ID or Fingerprint next time?
            </Text>
            <View className="w-full flex-row gap-3">
              <Pressable
                onPress={() => {
                  setShowBiometricPrompt(false);
                  router.replace('/(tabs)/home');
                }}
                className="flex-1 py-3.5 border rounded-xl items-center active:opacity-75"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border
                }}
              >
                <Text className="font-semibold text-sm" style={{ color: colors.textSecondary }}>Maybe Later</Text>
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (pendingCredentials) {
                    await SecureStore.setItemAsync(
                      'biometricCredentials',
                      JSON.stringify(pendingCredentials)
                    );
                    setHasBiometricSetup(true);
                  }
                  setShowBiometricPrompt(false);
                  Toast.show({
                    type: 'success',
                    text1: 'Biometrics Enabled!',
                    text2: 'Fingerprint / Face ID setup complete.',
                  });
                  setTimeout(() => {
                    router.replace('/(tabs)/home');
                  }, 800);
                }}
                className="flex-1 py-3.5 rounded-xl items-center active:opacity-75"
                style={{
                  backgroundColor: colors.primary
                }}
              >
                <Text className="font-bold text-sm" style={{ color: isDark ? '#122D36' : '#FFFFFF' }}>Enable</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}