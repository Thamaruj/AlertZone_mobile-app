import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { sriLankaGeographics } from '../../config/sriLankaRegions';
import SelectionModal from '../../components/SelectionModal';
import { useAuth } from '../../config/authConfig';

// Firebase Imports
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

export default function CompleteProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile, logout } = useAuth();

  // Loading and profile states
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(true);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nic, setNic] = useState('');
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [lga, setLga] = useState('');

  // Selector Modal Visibility States
  const [provinceModalVisible, setProvinceModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [lgaModalVisible, setLgaModalVisible] = useState(false);

  // Focus States
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isPhoneFocused, setIsPhoneFocused] = useState(false);
  const [isNicFocused, setIsNicFocused] = useState(false);

  const phoneRef = useRef<TextInput>(null);
  const nicRef = useRef<TextInput>(null);

  // Redirect to login if user object is not present
  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/loginScreen');
    }
  }, [user]);

  // Load existing profile details
  useEffect(() => {
    const fetchExistingDetails = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setFullName(data.fullName || user.displayName || '');
          setEmail(data.email || user.email || '');
          setPhone(data.phoneNumber || '');
          setNic(data.nic || '');
          setProvince(data.province || '');
          setDistrict(data.district || '');
          setLga(data.localGovernmentArea || '');
        } else {
          setFullName(user.displayName || '');
          setEmail(user.email || '');
        }
      } catch (error) {
        console.error('Error fetching existing profile details:', error);
      } finally {
        setFetchingProfile(false);
      }
    };

    fetchExistingDetails();
  }, [user]);

  const validatePhone = (phoneNum: string) => {
    // Simple validation for Sri Lankan phone numbers:
    // Starts with +94 and has 9 digits, or starts with 0 and has 9 digits (total 10 digits).
    const regex = /^(?:\+94|0)?7[0-9]{8}$/;
    return regex.test(phoneNum.replace(/\s+/g, ''));
  };

  const validateNIC = (nicValue: string) => {
    const oldFormat = /^[0-9]{9}[vVxX]$/;
    const newFormat = /^[0-9]{12}$/;
    return oldFormat.test(nicValue) || newFormat.test(nicValue);
  };

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Toast.show({ type: 'error', text1: 'Name Required', text2: 'Please enter your full name.' });
      return;
    }
    if (!phone.trim() || !validatePhone(phone)) {
      Toast.show({ type: 'error', text1: 'Invalid Phone', text2: 'Please enter a valid Sri Lankan phone number (e.g. 07XXXXXXXX).' });
      return;
    }
    if (!nic.trim() || !validateNIC(nic)) {
      Toast.show({ type: 'error', text1: 'Invalid NIC', text2: 'Please enter a valid Sri Lankan NIC (9 digits + V/X or 12 digits).' });
      return;
    }
    if (!province) {
      Toast.show({ type: 'error', text1: 'Province Required', text2: 'Please select your province.' });
      return;
    }
    if (!district) {
      Toast.show({ type: 'error', text1: 'District Required', text2: 'Please select your district.' });
      return;
    }
    if (!lga) {
      Toast.show({ type: 'error', text1: 'LGA Required', text2: 'Please select your Local Government Authority.' });
      return;
    }

    setLoading(true);

    try {
      if (!user) throw new Error('No authenticated user found');

      // Fetch latest profile to merge stats if they exist
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      const existingData = docSnap.exists() ? docSnap.data() : {};

      await setDoc(docRef, {
        ...existingData,
        fullName: fullName.trim(),
        email: email || user.email || '',
        phoneNumber: phone.trim(),
        role: existingData.role || 'citizen',
        createdAt: existingData.createdAt || new Date().toISOString(),
        uid: user.uid,
        status: existingData.status || 'active',
        isVerified: existingData.isVerified ?? false,
        nic: nic.trim().toUpperCase(),
        province,
        district,
        localGovernmentArea: lga,
        level: existingData.level || 1,
        contributionPoints: existingData.contributionPoints || 0,
        reportsValidated: existingData.reportsValidated || 0,
      });

      Toast.show({ type: 'success', text1: 'Profile Setup Complete', text2: 'Welcome to AlertZone!' });
      
      // Refresh context profile to trigger routing update
      await refreshProfile();

      setTimeout(() => {
        router.replace('/(tabs)/home');
      }, 1000);
    } catch (error: any) {
      console.error('❌ Error saving profile details:', error);
      Toast.show({ type: 'error', text1: 'Save Failed', text2: error.message || 'An error occurred.' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/loginScreen');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (fetchingProfile) {
    return (
      <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} className="flex-1 items-center justify-center">
        <ActivityIndicator color="#4CC2D1" size="large" />
        <Text className="text-gray-400 mt-4 text-center">Loading details...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} className="flex-1">
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
          <View className="flex-1 px-8 pt-16 pb-10 justify-center">
            {/* Header */}
            <View className="items-center mb-6">
              <Image source={require('../../assets/images/iconAlerZone-Bg-none.png')} className="w-20 h-20" resizeMode="contain" />
              <Text className="text-white text-3xl font-bold mt-4">Complete Profile</Text>
              <Text className="text-gray-400 mt-1 text-center">
                Please provide these required details to access the application.
              </Text>
            </View>

            {/* Inputs Section */}
            <View className="space-y-4">
              {/* Full Name */}
              <View className={`bg-[#1E3A44] border rounded-2xl p-1 flex-row items-center mt-3 ${
                isNameFocused ? 'border-[#4CC2D1]' : 'border-[#2D4F5C]'
              }`}>
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                  <Ionicons name="person-outline" size={20} color="#30A89C" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Full Name:</Text>
                  <TextInput
                    placeholder="John Doe"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 mt-0.5"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    returnKeyType="next"
                    onSubmitEditing={() => phoneRef.current?.focus()}
                    onFocus={() => setIsNameFocused(true)}
                    onBlur={() => setIsNameFocused(false)}
                    value={fullName}
                    onChangeText={setFullName}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Phone Number */}
              <View className={`bg-[#1E3A44] border rounded-2xl p-1 flex-row items-center mt-3 ${
                isPhoneFocused ? 'border-[#4CC2D1]' : 'border-[#2D4F5C]'
              }`}>
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                  <Ionicons name="call-outline" size={20} color="#30A89C" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Phone Number:</Text>
                  <TextInput
                    ref={phoneRef}
                    placeholder="07XXXXXXXX"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 mt-0.5"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    keyboardType="phone-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => nicRef.current?.focus()}
                    onFocus={() => setIsPhoneFocused(true)}
                    onBlur={() => setIsPhoneFocused(false)}
                    value={phone}
                    onChangeText={setPhone}
                    editable={!loading}
                  />
                </View>
              </View>

              {/* NIC */}
              <View className={`bg-[#1E3A44] border rounded-2xl p-1 flex-row items-center mt-3 ${
                isNicFocused ? 'border-[#4CC2D1]' : 'border-[#2D4F5C]'
              }`}>
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                  <Ionicons name="card-outline" size={20} color="#30A89C" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">NIC Number:</Text>
                  <TextInput
                    ref={nicRef}
                    placeholder="199912345678 or 991234567V"
                    placeholderTextColor="#5A7D8A"
                    className="text-white text-base p-0 mt-0.5"
                    style={{ paddingLeft: 0, marginLeft: 0 }}
                    returnKeyType="done"
                    onFocus={() => setIsNicFocused(true)}
                    onBlur={() => setIsNicFocused(false)}
                    value={nic}
                    onChangeText={setNic}
                    autoCapitalize="characters"
                    editable={!loading}
                  />
                </View>
              </View>

              {/* Province Selector */}
              <Pressable
                onPress={() => !loading && setProvinceModalVisible(true)}
                className="bg-[#1E3A44] border border-[#2D4F5C] rounded-2xl p-2 flex-row items-center mt-3 active:opacity-80"
              >
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                  <Ionicons name="map-outline" size={20} color="#30A89C" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Province:</Text>
                  <Text className={`text-base mt-0.5 ${province ? 'text-white' : 'text-[#5A7D8A]'}`}>
                    {province || 'Select Province'}
                  </Text>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color="#30A89C" style={{ marginRight: 8 }} />
              </Pressable>

              {/* District Selector */}
              <Pressable
                onPress={() => {
                  if (loading) return;
                  if (!province) {
                    Toast.show({ type: 'info', text1: 'Province Required', text2: 'Please select a province first.' });
                    return;
                  }
                  setDistrictModalVisible(true);
                }}
                className={`bg-[#1E3A44] border border-[#2D4F5C] rounded-2xl p-2 flex-row items-center mt-3 active:opacity-80 ${!province ? 'opacity-50' : ''}`}
              >
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                  <Ionicons name="navigate-outline" size={20} color="#30A89C" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">District:</Text>
                  <Text className={`text-base mt-0.5 ${district ? 'text-white' : 'text-[#5A7D8A]'}`}>
                    {district || 'Select District'}
                  </Text>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color="#30A89C" style={{ marginRight: 8 }} />
              </Pressable>

              {/* LGA Selector */}
              <Pressable
                onPress={() => {
                  if (loading) return;
                  if (!district) {
                    Toast.show({ type: 'info', text1: 'District Required', text2: 'Please select a district first.' });
                    return;
                  }
                  setLgaModalVisible(true);
                }}
                className={`bg-[#1E3A44] border border-[#2D4F5C] rounded-2xl p-2 flex-row items-center mt-3 active:opacity-80 ${!district ? 'opacity-50' : ''}`}
              >
                <View className="px-4 py-3 border-r border-[#2D4F5C] justify-center items-center">
                  <Ionicons name="business-outline" size={20} color="#30A89C" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-400 text-[10px] uppercase font-bold">Local Government Authority:</Text>
                  <Text className={`text-base mt-0.5 ${lga ? 'text-white' : 'text-[#5A7D8A]'}`}>
                    {lga || 'Select Local Government'}
                  </Text>
                </View>
                <Ionicons name="chevron-down-outline" size={20} color="#30A89C" style={{ marginRight: 8 }} />
              </Pressable>
            </View>

            {/* Save Buttons */}
            <View className="mt-8 space-y-3">
              <Pressable
                className={`p-4 rounded-full shadow-lg items-center active:opacity-80 ${loading ? 'bg-[#4CC2D1]/50' : 'bg-[#4CC2D1]'}`}
                onPress={handleSaveProfile}
                disabled={loading}
              >
                {loading ? <ActivityIndicator color="#122D36" /> : <Text className="text-[#122D36] text-center font-bold text-lg">Save Profile</Text>}
              </Pressable>

              <Pressable
                onPress={handleLogout}
                disabled={loading}
                className="bg-transparent border border-red-500 p-4 rounded-full flex-row justify-center items-center active:opacity-75 mt-3"
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 6 }} />
                <Text className="text-red-500 font-bold text-base">Cancel & Log Out</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
