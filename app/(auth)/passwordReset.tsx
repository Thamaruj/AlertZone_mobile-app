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


export default function ForgotPasswordScreen() {
  const router = useRouter();
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
    <LinearGradient colors={['#F5F5F5', '#FAFAFA', '#F5F5F5']} className="flex-1">

      {/* ✅ behavior="padding" + keyboardVerticalOffset fixes keyboard hiding the input */}
      <KeyboardAvoidingView 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        className="flex-1"
      >
        {/* ✅ keyboardShouldPersistTaps so the button stays tappable while keyboard is open */}
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View className="flex-1 px-8 justify-center">
            
            {/* Header Section */}
            <View className="items-center mb-10">
              <View className="bg-[#FFFFFF] p-5 rounded-full border border-[#059669] mb-6">
                <View className="p-2 bg-[#FFFFFF] rounded-full items-center justify-center">
                    <Ionicons name="key-outline" size={50} color="#059669" />
                </View>
              </View>
              <Text className="text-[#1A1A1A] text-3xl font-bold">Forgot Password?</Text>
              <Text className="text-[#6B7280] text-center mt-3 leading-6 px-4">
                Don't worry! Enter your email and we'll send you a link to reset your password.
              </Text>
            </View>

             <View className={`bg-[#FFFFFF] border rounded-2xl py-2 flex-row items-center ${
              isEmailFocused ? "border-[#0D8A72]" : "border-[#E8E8E8]"
            }`}>

                {/* Icon Box */}
                <View className="px-4 py-3 border-r border-[#E8E8E8] justify-center items-center">
                <Ionicons name="mail-outline" size={25} color="#059669" />
                </View>

                {/* Text Box */}
                <View className="flex-1 px-3 py-2">
                <Text className="text-[#6B7280] text-xs p-0 m-0">E-mail:</Text>
                <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#6B7280"
                    className="text-[#1A1A1A] text-base p-0 m-0"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                    editable={!loading}
                    // ✅ "Done" on keyboard submits the form directly
                    returnKeyType="done"
                    onSubmitEditing={handleReset}
                />
                </View>

            </View>

            {/* Reset Button */}
            <View className="mt-8">
              <Pressable 
                className={`p-4 rounded-full active:opacity-70 shadow-lg items-center ${loading ? 'bg-[#0D8A72]/50' : 'bg-[#0D8A72]'}`}
                onPress={handleReset}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#122D36" />
                ) : (
                  <Text className="text-[#122D36] text-center font-bold text-lg">Send Reset Link</Text>
                )}
              </Pressable>
            </View>

            {/* Return to Login */}
            <Pressable 
              onPress={() => router.replace("/(auth)/loginScreen")}
              className="mt-8 active:opacity-70"
            >
              <Text className="text-[#6B7280] text-center">
                Remember your password? <Text className="text-[#0D8A72]  font-bold">Log In</Text>
              </Text>
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}