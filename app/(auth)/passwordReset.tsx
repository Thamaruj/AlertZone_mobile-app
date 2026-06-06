import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import Toast from 'react-native-toast-message';

// Firebase imports
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { useTheme } from '../../config/themeContext';


export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const handleReset = async () => {
    if (!email) {
        Toast.show({
        type: 'error',
        text1: 'Incomplete Details',
        text2: 'Please enter your registered email address.',
        });

        return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);

        Toast.show({
        type: 'success',
        text1: 'Password Reset Email Sent',
        text2: 'A password reset link has been sent to your email. Please check your inbox (and spam folder).',
        });

        setTimeout(()=>router.replace("/(auth)/loginScreen"),1500)
      
    } catch (error: any) {
      console.error("❌ Reset Error:", error.code);
        let message = "Could not send reset email. Please try again.";
        if (error.code === 'auth/user-not-found') message = "No account found with this email.";
        if (error.code === 'auth/missing-email') message = "Please enter your email address.";

        Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message,
        });

      setEmail("")
      
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
          <View className="flex-1 px-8 justify-center">
            
            {/* Header Section */}
            <View className="items-center mb-10">
              <View
                className="p-5 rounded-full border mb-6"
                style={{ backgroundColor: colors.card, borderColor: colors.primary }}
              >
                <View className="p-2 rounded-full items-center justify-center" style={{ backgroundColor: colors.card }}>
                  <Ionicons name="key-outline" size={50} color={colors.primary} />
                </View>
              </View>
              <Text className="text-3xl font-bold" style={{ color: colors.text }}>Forgot Password?</Text>
              <Text className="text-center mt-3 leading-6 px-4" style={{ color: colors.textSecondary }}>
                Don't worry! Enter your email and we'll send you a link to reset your password.
              </Text>
            </View>

            <View
              className="border rounded-2xl py-2 flex-row items-center"
              style={{
                backgroundColor: colors.card,
                borderColor: isEmailFocused ? colors.primary : colors.border
              }}
            >
              {/* Icon Box */}
              <View
                className="px-4 py-3 border-r justify-center items-center"
                style={{ borderRightColor: colors.border }}
              >
                <Ionicons name="mail-outline" size={25} color={colors.primary} />
              </View>

              {/* Text Box */}
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
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                />
              </View>
            </View>

            {/* Reset Button */}
            <View className="mt-8">
              <Pressable 
                className="p-4 rounded-full active:opacity-70 shadow-lg items-center"
                style={{ backgroundColor: loading ? (isDark ? '#4CC2D180' : '#0D8A7280') : colors.primary }}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={isDark ? '#122D36' : '#FFFFFF'} />
                ) : (
                  <Text className="text-center font-bold text-lg" style={{ color: isDark ? '#122D36' : '#FFFFFF' }}>Send Reset Link</Text>
                )}
              </Pressable>
            </View>

            {/* Return to Login */}
            <Pressable 
              onPress={() => router.replace("/(auth)/loginScreen")}
              className="mt-8 active:opacity-70"
            >
              <Text className="text-center" style={{ color: colors.textSecondary }}>
                Remember your password? <Text className="font-bold" style={{ color: colors.primary }}>Log In</Text>
              </Text>
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}