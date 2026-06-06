import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
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
import { sriLankaGeographics } from '../../config/sriLankaRegions';
import SelectionModal from '../../components/SelectionModal';

// Firebase Imports
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { useTheme } from '../../config/themeContext';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);

  // Form Data States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nic, setNic] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [lga, setLga] = useState('');

  // Selector Modal Visibility States
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [lgaModalVisible, setLgaModalVisible] = useState(false);

  // Refs for keyboard "Next" flow
  const emailRef        = useRef<TextInput>(null);
  const phoneRef        = useRef<TextInput>(null);
  const passwordRef     = useRef<TextInput>(null);
  const confirmPassRef  = useRef<TextInput>(null);

  const validatePassword = (password:string) => {
    let isValidPassword = true;

    // Minimum 8 characters
    if (!/.{8,}/.test(password)) {
      Toast.show({
        type: "error",
        text1: "Password too short",
        text2: "Password must be at least 8 characters long.",
      });
      isValidPassword = false;
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      Toast.show({
        type: "error",
        text1: "Missing Uppercase",
        text2: "Password must contain at least one uppercase letter.",
      });
      isValidPassword = false;
    }

    // At least one number
    if (!/[0-9]/.test(password)) {
      Toast.show({
        type: "error",
        text1: "Missing Number",
        text2: "Password must contain at least one number.",
      });
      isValidPassword = false;
    }

    return isValidPassword;
  };

  const handleSignUp = async () => {
    if (!fullName || !email || !phone || !password || !nic || !province || !district || !lga) {
      Toast.show({ type: 'error', text1: 'Missing Info', text2: 'Please fill in all fields (including NIC and Region) to join AlertZone.' });
      return;
    }
    const validateNIC = (nicValue: string) => {
      const oldFormat = /^[0-9]{9}[vVxX]$/;
      const newFormat = /^[0-9]{12}$/;
      return oldFormat.test(nicValue) || newFormat.test(nicValue);
    };
    if (!validateNIC(nic)) {
      Toast.show({ type: 'error', text1: 'Invalid NIC', text2: 'Please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits).' });
      return;
    }
    if (!validatePassword(password)) {
        return;
    }
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Password Error', text2: 'Passwords do not match.' });
      setConfirmPassword('');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        phoneNumber: phone,
        role: 'citizen', 
        createdAt: new Date().toISOString(),
        uid: user.uid,
        status: 'active',
        isVerified: false,
        nic,
        province,
        district,
        localGovernmentArea: lga,
        level: 1,
        contributionPoints: 0,
        reportsValidated: 0
      });

      console.log("✅ Citizen Registered & Verification Link Sent");
      Toast.show({ type: 'success', text1: 'Registration Successful', text2: "Verify your email" });
      setLoading(false);
      setIsSuccessModalVisible(true);

    } catch (error: any) {
      console.error("❌ Firebase Error:", error.code);
      setLoading(false);
      
      let message = "An error occurred during sign up.";
      if (error.code === 'auth/email-already-in-use')  message = "This email is already in use.";
      if (error.code === 'auth/invalid-email')         message = "Please enter a valid email address.";
      if (error.code === 'auth/weak-password')         message = "Password should be at least 6 characters.";

      Toast.show({ type: 'error', text1: 'Sign Up Failed', text2: message });
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
        >
          <View className="flex-1 px-8 pt-12 pb-10 justify-center">
            
            {/* Header */}
            <View className="items-center mb-6">
              <Image source={require('../../assets/images/iconAlerZone-Bg-none.png')} className="w-20 h-20" resizeMode="contain" />
              <Text className="text-3xl font-bold mt-4" style={{ color: colors.text }}>Create Account</Text>
              <Text className="mt-1" style={{ color: colors.textSecondary }}>Get started with AlertZone.</Text>
            </View>

            {/* Inputs Section */}
            <View className="space-y-2">
              {/* Full Name */}
              <View
                className="border rounded-2xl p-2 flex-row items-center"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View
                  className="px-4 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>Full Name:</Text>
                  <TextInput
                    placeholder="John Snow"
                    placeholderTextColor={colors.textSecondary}
                    className="text-base p-0 mt-0.5"
                    style={{ color: colors.text, paddingLeft: 0, marginLeft: 0 }}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>

              {/* Email */}
              <View
                className="border rounded-2xl p-2 flex-row items-center mt-3"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View
                  className="px-4 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="mail-outline" size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>E-mail:</Text>
                  <TextInput
                    ref={emailRef}
                    placeholder="john@email.com"
                    placeholderTextColor={colors.textSecondary}
                    className="text-base p-0 mt-0.5"
                    style={{ color: colors.text, paddingLeft: 0, marginLeft: 0 }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Phone */}
              <View
                className="border rounded-2xl p-2 flex-row items-center mt-3"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View
                  className="px-4 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="call-outline" size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>Phone Number:</Text>
                  <TextInput
                    ref={phoneRef}
                    placeholder="+94 7X XXX XXXX"
                    placeholderTextColor={colors.textSecondary}
                    className="text-base p-0 mt-0.5"
                    style={{ color: colors.text, paddingLeft: 0, marginLeft: 0 }}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>
              </View>

              {/* NIC */}
              <View
                className="border rounded-2xl p-2 flex-row items-center mt-3"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View
                  className="px-4 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="card-outline" size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>NIC Number:</Text>
                  <TextInput
                    placeholder="199912345678 or 991234567V"
                    placeholderTextColor={colors.textSecondary}
                    className="text-base p-0 mt-0.5"
                    style={{ color: colors.text, paddingLeft: 0, marginLeft: 0 }}
                    returnKeyType="next"
                    value={nic}
                    onChangeText={setNic}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              {/* Province Selector */}
              <Pressable
                onPress={() => setProvinceModalVisible(true)}
                className="border rounded-2xl p-2 flex-row items-center mt-3 active:opacity-80"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View
                  className="px-4 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="map-outline" size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>Province:</Text>
                  <Text
                    className="text-base mt-0.5"
                    style={{ color: province ? colors.text : colors.textSecondary }}
                  >
                    {province || 'Select Province'}
                  </Text>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              </Pressable>

              {/* District Selector */}
              <Pressable
                onPress={() => {
                  if (!province) {
                    Toast.show({ type: 'info', text1: 'Province Required', text2: 'Please select a province first.' });
                    return;
                  }
                  setDistrictModalVisible(true);
                }}
                className="border rounded-2xl p-2 flex-row items-center mt-3 active:opacity-80"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: !province ? 0.5 : 1
                }}
              >
                <View
                  className="px-4 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="navigate-outline" size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>District:</Text>
                  <Text
                    className="text-base mt-0.5"
                    style={{ color: district ? colors.text : colors.textSecondary }}
                  >
                    {district || 'Select District'}
                  </Text>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              </Pressable>

              {/* LGA Selector */}
              <Pressable
                onPress={() => {
                  if (!district) {
                    Toast.show({ type: 'info', text1: 'District Required', text2: 'Please select a district first.' });
                    return;
                  }
                  setLgaModalVisible(true);
                }}
                className="border rounded-2xl p-2 flex-row items-center mt-3 active:opacity-80"
                style={{
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: !district ? 0.5 : 1
                }}
              >
                <View
                  className="px-4 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="business-outline" size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>Local Government Authority:</Text>
                  <Text
                    className="text-base mt-0.5"
                    style={{ color: lga ? colors.text : colors.textSecondary }}
                  >
                    {lga || 'Select Local Government'}
                  </Text>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
              </Pressable>

              {/* Password */}
              <View
                className="border rounded-2xl p-2 flex-row items-center mt-3"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View
                  className="px-4 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>Password:</Text>
                  <TextInput
                    ref={passwordRef}
                    placeholder="••••••••••••"
                    placeholderTextColor={colors.textSecondary}
                    className="text-base p-0 mt-0.5"
                    style={{ color: colors.text, paddingLeft: 0, marginLeft: 0 }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmPassRef.current?.focus()}
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? "eye-outline": "eye-off-outline"} size={20} color={colors.primary} />
                </Pressable>
              </View>

              {/* Confirm Password */}
              <View
                className="border rounded-2xl p-2 flex-row items-center mt-3"
                style={{ backgroundColor: colors.card, borderColor: colors.border }}
              >
                <View
                  className="px-4 py-3 border-r justify-center items-center"
                  style={{ borderRightColor: colors.border }}
                >
                  <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                </View>
                <View className="ml-3 flex-1 ">
                  <Text className="text-[10px] uppercase font-bold" style={{ color: colors.textSecondary }}>Confirm Password:</Text>
                  <TextInput
                    ref={confirmPassRef}
                    placeholder="••••••••••••"
                    placeholderTextColor={colors.textSecondary}
                    className="text-base p-0 mt-0.5"
                    style={{ color: colors.text, paddingLeft: 0, marginLeft: 0 }}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSignUp}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Ionicons name={showConfirmPassword ? "eye-outline": "eye-off-outline"} size={20} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <View className="mt-2 px-1">
              <Text className="text-sm" style={{ color: colors.textSecondary }}>
                Password must be at least 8 characters long, include an uppercase letter and a number.
              </Text>
            </View>

            {/* Primary Action Buttons */}
            <View className="mt-6">
              <Pressable
                className="p-4 rounded-full shadow-lg items-center"
                style={{ backgroundColor: loading ? (isDark ? '#4CC2D180' : '#0D8A7280') : colors.primary }}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={isDark ? '#122D36' : '#FFFFFF'} />
                ) : (
                  <Text className="text-center font-bold text-lg" style={{ color: isDark ? '#122D36' : '#FFFFFF' }}>Sign Up</Text>
                )}
              </Pressable>
            </View>

            <View className="flex-row justify-center mt-8">
              <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
              <Pressable onPress={() => router.push("/(auth)/loginScreen")} className='active:opacity-70'>
                <Text className="font-bold" style={{ color: colors.primary }}>Log In</Text>
              </Pressable>
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* --- SUCCESS MODAL --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isSuccessModalVisible}
      >
        <View
          style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, backgroundColor: colors.modalBackdrop }}
        >
          <View
            className="rounded-3xl p-8 w-full items-center shadow-2xl border"
            style={{ backgroundColor: colors.card, borderColor: colors.primary }}
          >
            <View
              className="p-5 rounded-full mb-6"
              style={{ backgroundColor: isDark ? '#4CC2D120' : '#05966920' }}
            >
              <Ionicons name="mail-unread-outline" size={60} color={colors.primary} />
            </View>

            <Text className="text-2xl font-bold text-center" style={{ color: colors.text }}>
              Verify Your Email
            </Text>
            
            <Text className="text-center mt-4 leading-6" style={{ color: colors.textSecondary }}>
              A verification link has been sent to:{"\n"}
              <Text className="font-bold" style={{ color: colors.primary }}>{email}</Text>
            </Text>

            <Text className="text-xs text-center mt-6 italic" style={{ color: colors.textMuted }}>
              Please check your inbox (and spam folder) before logging in.
            </Text>

            <View className="space-y-3 mb-6 active:opacity-70">
              <Pressable 
                className="border p-4 rounded-xl mt-3 mb-3"
                style={{ borderColor: colors.textSecondary }}
                onPress={() => {
                  setIsSuccessModalVisible(false);
                  router.replace("/(auth)/loginScreen");
                }}
              >
                <Text className="text-center font-medium" style={{ color: colors.text }}>
                  Proceed to Login
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Selector Modals */}
      <SelectionModal
        visible={provinceModalVisible}
        onClose={() => setProvinceModalVisible(false)}
        title="Select Province"
        options={Object.keys(sriLankaGeographics)}
        onSelect={(selectedProvince) => {
          setProvince(selectedProvince);
          setDistrict('');
          setLga('');
        }}
        selectedValue={province}
      />

      <SelectionModal
        visible={districtModalVisible}
        onClose={() => setDistrictModalVisible(false)}
        title="Select District"
        options={province && sriLankaGeographics[province] ? Object.keys(sriLankaGeographics[province]) : []}
        onSelect={(selectedDistrict) => {
          setDistrict(selectedDistrict);
          setLga('');
        }}
        selectedValue={district}
      />

      <SelectionModal
        visible={lgaModalVisible}
        onClose={() => setLgaModalVisible(false)}
        title="Select Local Government"
        options={province && district && sriLankaGeographics[province]?.[district] ? sriLankaGeographics[province][district] : []}
        onSelect={(selectedLga) => {
          setLga(selectedLga);
        }}
        selectedValue={lga}
      />

    </LinearGradient>
  );
}