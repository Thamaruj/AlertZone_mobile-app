import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Pressable, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// Firebase imports
import { auth } from '../../services/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';


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
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} className="flex-1">

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
              <View className="bg-[#1E3A44] p-5 rounded-full border border-[#30A89C] mb-6">
                <View className="p-2 bg-[#1E3A44] rounded-full items-center justify-center">
                    <Ionicons name="key-outline" size={50} color="#30A89C" />
                </View>
              </View>
              <Text className="text-white text-3xl font-bold">Forgot Password?</Text>
              <Text className="text-gray-400 text-center mt-3 leading-6 px-4">
                Don't worry! Enter your email and we'll send you a link to reset your password.
              </Text>
            </View>

            <View className={`bg-[#1E3A44] border rounded-2xl py-2 flex-row items-center ${
              isEmailFocused ? "border-[#4CC2D1]" : "border-[#2D4F5C]"
            }`}>

                {/* Icon Box */}
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                <Ionicons name="mail-outline" size={25} color="#30A89C" />
                </View>

                {/* Text Box */}
                <View className="flex-1 px-3 py-2">
                <Text className="text-gray-400 text-xs p-0 m-0">E-mail:</Text>
                <TextInput
                    placeholder="Enter your email"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 m-0"
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
                className={`p-4 rounded-full active:opacity-70 shadow-lg items-center ${loading ? 'bg-[#4CC2D1]/50' : 'bg-[#4CC2D1]'}`}
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
              <Text className="text-gray-400 text-center">
                Remember your password? <Text className="text-[#4CC2D1]  font-bold">Log In</Text>
              </Text>
            </Pressable>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}