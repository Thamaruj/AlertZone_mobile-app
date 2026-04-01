import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Modal,
  Switch,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScrollContext } from '../../config/tabBarScrollContext';

// ─────────────────────────────────────────────
// TODO: Replace with real Firebase user data
// import { auth, db } from '../../services/firebase';
// import { doc, getDoc, updateDoc } from 'firebase/firestore';
// import { useAuthState } from 'react-firebase-hooks/auth'; // or your auth hook
// ─────────────────────────────────────────────

// ── Mock Data (replace with Firebase fetch) ──
const MOCK_USER = {
  name: 'James Cam',
  role: 'Safety Contributor',
  level: 12,
  avatar: 'https://i.pravatar.cc/300?img=11',
  contributionPoints: 1250,
  pointsTrend: '+15% this month',
  reportsValidated: 84,
  reportsLabel: 'Top 8% in Seattle',
  email: 'james.cam123@gmail.com',
  phone: '+94 70 890 8524',
  address: '1st Lane, Crane Road, Jayewardenepura Kotte',
  notificationSound: true,
  alertRadius: '10 Km',
};

const BADGES = [
  { id: '1', label: 'First\nResponder', icon: 'shield',         color: '#4CC2D1', bg: '#0D2A35' },
  { id: '2', label: 'Early\nBird',      icon: 'sunny',          color: '#F59E0B', bg: '#3D2E0A' },
  { id: '3', label: 'Community\nHero',  icon: 'people',         color: '#A78BFA', bg: '#2D1F4A' },
  { id: '4', label: 'Mapper',           icon: 'map',            color: '#30A89C', bg: '#0D3D35' },
];

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

function StatCard({ label, value, trend, icon }: { label: string; value: string | number; trend?: string; icon: string }) {
  return (
    <View className="flex-1 bg-[#111E27] rounded-2xl p-3.5"
      style={{ borderWidth: 1, borderColor: '#1E3347' }}
    >
      <View className="flex-row justify-between items-start">
        <Text className="text-gray-500 text-[11px] font-semibold uppercase tracking-wide">{label}</Text>
        <View className="w-7 h-7 rounded-lg bg-[#1E3347] items-center justify-center">
          <Ionicons name={icon as any} size={14} color="#4CC2D1" />
        </View>
      </View>
      <Text className="text-white text-2xl font-bold mt-2">{value}</Text>
      {trend && <Text className="text-[#30A89C] text-[11px] mt-1 font-medium">{trend}</Text>}
    </View>
  );
}

function BadgeChip({ badge }: { badge: typeof BADGES[0] }) {
  return (
    <View className="items-center" style={{ width: 76 }}>
      <View className="w-14 h-14 rounded-2xl items-center justify-center mb-1.5"
        style={{ backgroundColor: badge.bg, borderWidth: 1, borderColor: badge.color + '40' }}
      >
        <Ionicons name={badge.icon as any} size={26} color={badge.color} />
      </View>
      <Text className="text-gray-400 text-[10px] text-center leading-3">{badge.label}</Text>
    </View>
  );
}

function SettingsRow({ icon, iconBg, iconColor, label, subtitle, onPress, danger }: {
  icon: string; iconBg: string; iconColor: string;
  label: string; subtitle: string; onPress?: () => void; danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center py-3.5 active:opacity-70"
    >
      <View className="w-9 h-9 rounded-xl items-center justify-center mr-3.5"
        style={{ backgroundColor: iconBg }}
      >
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View className="flex-1">
        <Text className={`text-sm font-semibold ${danger ? 'text-[#E05C5C]' : 'text-white'}`}>{label}</Text>
        <Text className="text-gray-500 text-xs mt-0.5">{subtitle}</Text>
      </View>
      {!danger && <Ionicons name="chevron-forward" size={16} color="#2D4F5C" />}
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Edit Modal
// ─────────────────────────────────────────────
function EditModal({
  visible,
  onClose,
  user,
}: {
  visible: boolean;
  onClose: () => void;
  user: typeof MOCK_USER;
}) {
  // TODO: Wire these to Firebase update
  // const [saving, setSaving] = useState(false);
  // const handleSave = async () => { setSaving(true); await updateDoc(...); setSaving(false); onClose(); };

  const [email, setEmail]             = useState(user.email);
  const [phone, setPhone]             = useState(user.phone);
  const [address, setAddress]         = useState(user.address);
  const [notifSound, setNotifSound]   = useState(user.notificationSound);
  const [alertRadius, setAlertRadius] = useState(user.alertRadius);
  const [showImageOptions, setShowImageOptions] = useState(false);

  // TODO: Replace with Firebase Storage upload
  const handleTakePhoto      = () => { setShowImageOptions(false); /* launch camera */ };
  const handleUploadGallery  = () => { setShowImageOptions(false); /* launch image picker */ };
  const handleDeletePhoto    = () => { setShowImageOptions(false); /* delete from Storage */ };

  const inputStyle = "bg-[#111E27] text-white text-sm px-4 py-3 rounded-xl flex-1";

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View className="px-5 pt-14 pb-4 flex-row justify-between items-center">
            <Text className="text-white text-xl font-bold">Edit Profile</Text>
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="close" size={24} color="#5A7D8A" />
            </Pressable>
          </View>

          {/* Avatar */}
          <View className="items-center mb-6">
            <Pressable onPress={() => setShowImageOptions(true)} className="active:opacity-80">
              <Image
                source={{ uri: user.avatar }}
                className="w-24 h-24 rounded-full"
                // TODO: Replace with Firebase Storage URL
              />
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#4CC2D1] items-center justify-center"
                style={{ borderWidth: 2, borderColor: '#0A1820' }}
              >
                <Ionicons name="camera" size={14} color="#071318" />
              </View>
            </Pressable>
            <Text className="text-white font-bold text-lg mt-3">{user.name}</Text>
            <Text className="text-gray-400 text-sm">{user.role} • Level {user.level}</Text>
          </View>

          {/* Image Picker Action Sheet */}
          {showImageOptions && (
            <View className="mx-5 mb-4 bg-[#1E3A44] rounded-2xl overflow-hidden"
              style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
            >
              <Pressable onPress={handleTakePhoto}
                className="flex-row items-center px-4 py-4 active:bg-[#2D4F5C]"
              >
                <Ionicons name="camera-outline" size={20} color="#4CC2D1" />
                <Text className="text-white ml-3 font-medium">Take Photo</Text>
              </Pressable>
              <View className="h-px bg-[#2D4F5C]" />
              <Pressable onPress={handleUploadGallery}
                className="flex-row items-center px-4 py-4 active:bg-[#2D4F5C]"
              >
                <Ionicons name="image-outline" size={20} color="#4CC2D1" />
                <Text className="text-white ml-3 font-medium">Upload From Gallery</Text>
              </Pressable>
              <View className="h-px bg-[#2D4F5C]" />
              <Pressable onPress={handleDeletePhoto}
                className="flex-row items-center px-4 py-4 active:bg-[#2D4F5C]"
              >
                <Ionicons name="trash-outline" size={20} color="#E05C5C" />
                <Text className="text-[#E05C5C] ml-3 font-medium">Delete Photo</Text>
              </Pressable>
            </View>
          )}

          {/* Personal Information */}
          <View className="px-5 mb-5">
            <Text className="text-white font-bold text-base mb-3">Personal Information</Text>

            <View className="bg-[#111E27] rounded-2xl px-4 py-1"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}
            >
              {/* Email */}
              <View className="flex-row items-center py-3">
                <View className="w-8 h-8 rounded-lg bg-[#1E3347] items-center justify-center mr-3">
                  <Ionicons name="mail-outline" size={16} color="#4CC2D1" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide">Email</Text>
                  {/* TODO: Disable email editing (Firebase doesn't allow easy email change without re-auth) */}
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    className="text-white text-sm mt-0.5 p-0"
                    style={{ margin: 0, padding: 0 }}
                    placeholderTextColor="#5A7D8A"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View className="h-px bg-[#1E3347]" />

              {/* Phone */}
              <View className="flex-row items-center py-3">
                <View className="w-8 h-8 rounded-lg bg-[#1E3347] items-center justify-center mr-3">
                  <Ionicons name="call-outline" size={16} color="#4CC2D1" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide">Phone Number</Text>
                  {/* TODO: Wire to Firestore users/{uid}.phoneNumber */}
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    className="text-white text-sm mt-0.5 p-0"
                    style={{ margin: 0, padding: 0 }}
                    placeholderTextColor="#5A7D8A"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View className="h-px bg-[#1E3347]" />

              {/* Address */}
              <View className="flex-row items-center py-3">
                <View className="w-8 h-8 rounded-lg bg-[#1E3347] items-center justify-center mr-3">
                  <Ionicons name="location-outline" size={16} color="#4CC2D1" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide">Address</Text>
                  {/* TODO: Wire to Firestore users/{uid}.address */}
                  <TextInput
                    value={address}
                    onChangeText={setAddress}
                    className="text-white text-sm mt-0.5 p-0"
                    style={{ margin: 0, padding: 0 }}
                    placeholderTextColor="#5A7D8A"
                    multiline
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Alert Preferences */}
          <View className="px-5 mb-8">
            <Text className="text-white font-bold text-base mb-3">Alert Preferences</Text>
            <View className="bg-[#111E27] rounded-2xl px-4"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}
            >
              {/* Notification Sound */}
              <View className="flex-row items-center justify-between py-4">
                <Text className="text-white text-sm font-medium">Notification Sound</Text>
                {/* TODO: Save notifSound to Firestore users/{uid}.notificationSound */}
                <Switch
                  value={notifSound}
                  onValueChange={setNotifSound}
                  trackColor={{ false: '#1E3347', true: '#4CC2D1' }}
                  thumbColor="white"
                />
              </View>
              <View className="h-px bg-[#1E3347]" />
              {/* Alert Radius */}
              <View className="flex-row items-center justify-between py-4">
                <Text className="text-white text-sm font-medium">Alert Radius</Text>
                {/* TODO: Save alertRadius to Firestore users/{uid}.alertRadius */}
                <Text className="text-[#4CC2D1] text-sm font-semibold">{alertRadius}</Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="px-5 flex-row gap-3">
            {/* TODO: onPress → handleSave() which calls Firebase updateDoc */}
            <Pressable className="flex-1 bg-[#4CC2D1] py-4 rounded-2xl items-center active:opacity-80">
              <Text className="text-[#071318] font-bold text-base">Save</Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              className="flex-1 py-4 rounded-2xl items-center active:opacity-70"
              style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
            >
              <Text className="text-gray-300 font-semibold text-base">Cancel</Text>
            </Pressable>
          </View>

        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Main Profile Screen
// ─────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { onScroll } = useScrollContext();
  const [editVisible, setEditVisible] = useState(false);

  // TODO: Replace MOCK_USER with real Firebase data
  // const [user] = useAuthState(auth);
  // const [userData, setUserData] = useState(null);
  // useEffect(() => { fetchUserData(user.uid).then(setUserData) }, [user]);
  const userData = MOCK_USER;

  // TODO: handleLogout → signOut(auth) then router.replace('/(auth)/loginScreen')
  const handleLogout = () => {};

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: 120,
        }}
      >

        {/* ── 1. Top Nav ── */}
        <View className="flex-row justify-between items-center px-5 mb-5">
          <View className="flex-row items-center gap-2">
            <Image
              source={require('../../assets/images/iconAlerZone-Bg-none.png')}
              style={{ width: 28, height: 28 }}
              resizeMode="contain"
            />
            <Text className="text-white text-xl font-bold tracking-tight">AlertZone</Text>
          </View>
          <Pressable className="active:opacity-70">
            <View className="w-10 h-10 rounded-full bg-[#1E3A44] items-center justify-center"
              style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
            >
              <Ionicons name="notifications-outline" size={20} color="#5A7D8A" />
            </View>
            <View className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E05C5C] items-center justify-center">
              <Text className="text-white text-[10px] font-bold">10</Text>
            </View>
          </Pressable>
        </View>

        {/* ── 2. Avatar + Name ── */}
        <View className="items-center mb-6 px-5">
          <Pressable onPress={() => setEditVisible(true)} className="active:opacity-80">
            {/* TODO: Replace uri with Firebase Storage avatar URL from userData.avatarUrl */}
            <Image
              source={{ uri: userData.avatar }}
              className="w-24 h-24 rounded-full"
              style={{ borderWidth: 3, borderColor: '#4CC2D1' }}
            />
            <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#4CC2D1] items-center justify-center"
              style={{ borderWidth: 2, borderColor: '#0A1820' }}
            >
              <Ionicons name="camera" size={14} color="#071318" />
            </View>
          </Pressable>

          {/* TODO: Replace with userData.fullName from Firestore */}
          <Text className="text-white text-2xl font-bold mt-3">{userData.name}</Text>
          {/* TODO: userData.role and userData.level from Firestore */}
          <Text className="text-gray-400 text-sm mt-1">{userData.role} • Level {userData.level}</Text>
        </View>

        {/* ── 3. Stats ── */}
        <View className="px-5 flex-row gap-3 mb-6">
          {/* TODO: Replace values with userData.contributionPoints and userData.reportsValidated */}
          <StatCard
            label="Contribution Points"
            value={userData.contributionPoints.toLocaleString()}
            trend={userData.pointsTrend}
            icon="star-outline"
          />
          <StatCard
            label="Reports Validated"
            value={userData.reportsValidated}
            trend={userData.reportsLabel}
            icon="checkmark-circle-outline"
          />
        </View>

        {/* ── 4. Earned Badges ── */}
        <View className="px-5 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-white text-lg font-bold">Earned Badges</Text>
            <Pressable className="active:opacity-70">
              <Text className="text-[#4CC2D1] text-sm font-semibold">View All</Text>
            </Pressable>
          </View>
          {/* TODO: Replace BADGES with userData.badges fetched from Firestore */}
          <View className="flex-row gap-3">
            {BADGES.map((badge) => (
              <BadgeChip key={badge.id} badge={badge} />
            ))}
          </View>
        </View>

        {/* ── 5. Account Settings ── */}
        <View className="px-5">
          <Text className="text-white text-lg font-bold mb-3">Account Settings</Text>
          <View className="bg-[#111E27] rounded-2xl px-4"
            style={{ borderWidth: 1, borderColor: '#1E3347' }}
          >
            <SettingsRow
              icon="person-outline"
              iconBg="#1E3347"
              iconColor="#4CC2D1"
              label="Personal Information"
              subtitle="Email, phone, and address"
              onPress={() => setEditVisible(true)}
            />
            <View className="h-px bg-[#1E3347]" />
            <SettingsRow
              icon="notifications-outline"
              iconBg="#1E2D3D"
              iconColor="#4CC2D1"
              label="Alert Preferences"
              subtitle="Notification sound and radius"
              onPress={() => setEditVisible(true)}
            />
            <View className="h-px bg-[#1E3347]" />
            {/* TODO: handleLogout → signOut(auth) */}
            <SettingsRow
              icon="log-out-outline"
              iconBg="#3D1515"
              iconColor="#E05C5C"
              label="Logout"
              subtitle="Sign out of your account"
              onPress={handleLogout}
              danger
            />
          </View>
        </View>

      </ScrollView>

      {/* Edit Profile Modal */}
      <EditModal
        visible={editVisible}
        onClose={() => setEditVisible(false)}
        user={userData}
      />
    </LinearGradient>
  );
}