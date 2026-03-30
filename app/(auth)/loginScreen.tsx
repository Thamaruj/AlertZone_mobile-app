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

// --- FIREBASE IMPORTS ---
import { auth, db } from '../../services/firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';


export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ✅ Ref for keyboard "Next" chain: Email → Password → Submit
  const passwordRef = useRef<TextInput>(null);

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, "users", uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("✅ Auth Success:", userData.fullName);

        Toast.show({
        type: 'success',
        text1: 'Auth Successful',
        text2: `Hang tight`,
        });

        setTimeout(() => {
            router.replace("/(tabs)/home");
        }, 500);
            
        setTimeout(() =>{
            Toast.show({
            type: 'success',
            text1: 'Login Successful',
            text2: `Welcome ${userData.fullName}`,
            });
        },1500)

      } else {
            Toast.show({
            type: 'error',
            text1: 'Database Error',
            text2: 'Auth successful, but no profile found in Firestore.',
            });
      }

    } catch (error: any) {
      console.error("❌ Login Error:", error.message);
      
      let errorMessage = "Invalid email or password.";
      if (error.code === 'auth/network-request-failed') errorMessage = "Network error. Check your connection.";
      
        Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: `${errorMessage}`,
        });

        setPassword("")
        setRememberMe(false)

    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} className="flex-1">

      {/* ✅ FIX 1: behavior="padding" works on both platforms.
              keyboardVerticalOffset gives breathing room on Android */}
      <KeyboardAvoidingView 
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        className="flex-1"
      >
        {/* ✅ FIX 2: keyboardShouldPersistTaps so buttons stay tappable while
                keyboard is open. paddingBottom so nothing gets clipped. */}
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
              <Text className="text-white text-3xl font-bold mt-4">Welcome Back!</Text>
              <Text className="text-gray-400 text-center mt-2">
                Log in to continue making your{"\n"}community safer.
              </Text>
            </View>

            {/* 2. Input Fields */}
            <View className="space-y-4">
            {/* Email Field */}
            <View className={`bg-[#1E3A44] border rounded-2xl flex-row items-center ${
                isEmailFocused ? "border-[#4CC2D1]" : "border-[#2D4F5C]"
            }`}>
                <View className="px-3 py- border-r border-[#2D4F5C] justify-center items-center">
                <Ionicons name="mail-outline" size={20} color="#30A89C" />
                </View>
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
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                />
                </View>
            </View>

            {/* Password Field */}
            <View className={`bg-[#1E3A44] border rounded-2xl flex-row items-center mt-4 ${
                isPasswordFocused ? "border-[#4CC2D1]" : "border-[#2D4F5C]"
            }`}>
                <View className="px-3 py-3 border-r border-[#2D4F5C] justify-center items-center">
                <Ionicons name="lock-closed-outline" size={20} color="#30A89C" />
                </View>
                <View className="flex-1 px-3 py-2">
                <Text className="text-gray-400 text-xs p-0 m-0">Password:</Text>
                <TextInput
                    ref={passwordRef}
                    placeholder="Enter your password"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 m-0"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={() => setIsPasswordFocused(false)}
                    editable={!loading}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                />
                </View>
                <Pressable onPress={() => setShowPassword(!showPassword)} className="px-3">
                <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color="#30A89C"
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
                <View className={`w-5 h-5 rounded border ${rememberMe ? 'bg-[#30A89C] border-[#30A89C]' : 'border-gray-500'} items-center justify-center`}>
                   {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
                </View>
                <Text className="text-gray-400 ml-2">Remember me</Text>
              </Pressable>
              
              <Pressable
                onPress={()=>router.push("/(auth)/passwordReset")}
                className='active:opacity-70'>
                <Text className="text-[#4CC2D1]">Forgot Password?</Text>
              </Pressable>
            </View>

            {/* 4. Action Buttons */}
            <View className="mt-8">
              <Pressable 
                className={`p-4 rounded-full shadow-lg items-center active:opacity-70 ${loading ? 'bg-[#4CC2D1]/50' : 'bg-[#4CC2D1]'}`}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#122D36" />
                ) : (
                  <Text className="text-[#122D36] text-center font-bold text-lg ">Log In</Text>
                )}
              </Pressable>

              <Text className="text-gray-500 text-center my-6">or Log in with</Text>

              <Pressable className="bg-[#1E3A44] border border-[#2D4F5C] p-4 rounded-2xl flex-row justify-center items-center active:opacity-80">
                <Ionicons name="logo-google" size={20} color="white" className="mr-3" />
                <Text className="text-white font-semibold ml-2">Log In with Google</Text>
              </Pressable>
            </View>

            {/* 5. Footer */}
            <View className="flex-row justify-center mt-10">
              <Text className="text-gray-400">Don't have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/signupScreen")} className="active:opacity-70">
                <Text className="text-[#4CC2D1] font-bold">Create Account</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}