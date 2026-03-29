import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../services/firebase'; 
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('admin-test@alertzone.com'); // Pre-filled for your PM testing
  const [password, setPassword] = useState('password123'); // Pre-filled for your PM testing
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }

    setLoading(true);
    try {
      // 1. Send credentials to Firebase Cloud
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Mobile Auth Success for:", userCredential.user.email);

      // 2. The Success Alert (Your Handshake Confirmation)
      Alert.alert(
        "Handshake Successful", 
        `Connection to AlertZone Firebase verified.\nLogged in as: ${userCredential.user.email}`,
        [
          { 
            text: "Continue to Dashboard", 
            onPress: () => {
              // Navigation will happen automatically if your Root _layout.tsx is configured
              // Otherwise, we can force it here:
              router.replace("/(tabs)/home");
            } 
          }
        ]
      );

    } catch (error: any) {
      console.error("❌ Login Error:", error.message);
      
      // Handle specific Firebase errors for better PM debugging
      let errorMessage = "An unknown error occurred.";
      if (error.code === 'auth/invalid-credential') errorMessage = "Invalid email or password.";
      if (error.code === 'auth/network-request-failed') errorMessage = "Network error. Check your Wi-Fi connection.";
      
      Alert.alert("Handshake Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        {/* Branding Header */}
        <View className="items-center mb-10">
          <View className="bg-blue-800 p-4 rounded-3xl mb-4">
            <Text className="text-white text-3xl font-bold">AZ</Text>
          </View>
          <Text className="text-3xl font-bold text-gray-800">AlertZone</Text>
          <Text className="text-gray-500 mt-2">Authority & Citizen Portal</Text>
        </View>

        {/* Input Fields */}
        <View className="space-y-4">
          <View>
            <Text className="text-gray-600 mb-2 ml-1">Email Address</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800"
              placeholder="admin@alertzone.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View className="mt-4">
            <Text className="text-gray-600 mb-2 ml-1">Password</Text>
            <TextInput
              className="bg-gray-50 border border-gray-200 p-4 rounded-2xl text-gray-800"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Login Button */}
        <TouchableOpacity 
          activeOpacity={0.7}
          className={`mt-8 py-4 rounded-2xl items-center shadow-lg ${loading ? 'bg-blue-400' : 'bg-blue-800'}`}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-bold text-lg">Verify Handshake</Text>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <Text className="text-center text-gray-400 mt-8 text-xs">
          AlertZone Project v1.0 | Sprint 1 Verification
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}