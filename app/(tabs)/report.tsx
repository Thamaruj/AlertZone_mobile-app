import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ScrollProvider, useScrollContext } from '../../config/tabBarScrollContext';

// ─────────────────────────────────────────────
// TODO: Firebase & Location setup
// import { auth, db } from '../../services/firebase';
// import { collection, addDoc } from 'firebase/firestore';
// import * as Location from 'expo-location';
// import * as ImagePicker from 'expo-image-picker';
// import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
//
// const handleSubmit = async () => {
//   setLoading(true);
//   try {
//     // 1. Upload evidence to Firebase Storage
//     // const imageUrl = await uploadImageToStorage(photo);
//
//     // 2. Save report to Firestore
//     const docRef = await addDoc(collection(db, 'reports'), {
//       uid: auth.currentUser.uid,
//       title: selectedCategory?.label,
//       category: selectedCategory?.label,
//       categoryIcon: selectedCategory?.icon,
//       description,
//       location: locationText,
//       coordinates: { lat, lng }, // from expo-location
//       status: 'PENDING',
//       createdAt: new Date().toISOString(),
//       imageUrl: imageUrl ?? null,
//       upvotes: 0,
//     });
//     setRefId(docRef.id);
//     setSubmitted(true);
//   } catch (e) { console.error(e); }
//   finally { setLoading(false); }
// };
// ─────────────────────────────────────────────

const CATEGORIES = [
  {
    id: '1', label: 'Road & Traffic',
    icon: 'car-outline', color: '#4CC2D1', bg: '#0D2A35',
    examples: 'Potholes, signals, noise',
  },
  {
    id: '2', label: 'Water & Drainage',
    icon: 'water-outline', color: '#60A5FA', bg: '#0D1A3D',
    examples: 'Leaks, floods, pipes',
  },
  {
    id: '3', label: 'Waste & Env.',
    icon: 'trash-outline', color: '#34D399', bg: '#0D3D25',
    examples: 'Litter, illegal dumping',
  },
  {
    id: '4', label: 'Social Safety',
    icon: 'shield-outline', color: '#A78BFA', bg: '#2D1F4A',
    examples: 'Lighting, vandalism',
  },
  {
    id: '5', label: 'Bridge & Structural',
    icon: 'git-network-outline', color: '#F59E0B', bg: '#3D2E0A',
    examples: 'Damaged bridges, wells, or public buildings',
    wide: true,
  },
];

// ─────────────────────────────────────────────
// Category Picker Modal
// ─────────────────────────────────────────────
function CategoryModal({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (cat: typeof CATEGORIES[0]) => void;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="px-5 pt-14 pb-2 flex-row items-center gap-3">
            <Pressable onPress={onClose} className="active:opacity-70">
              <Ionicons name="arrow-back" size={24} color="#4CC2D1" />
            </Pressable>
            <Text className="text-white text-xl font-bold">Report Issue</Text>
          </View>

          <View className="px-5 mt-4 mb-6">
            <Text className="text-white text-xl font-bold mb-1">Select a category</Text>
            <Text className="text-gray-400 text-sm leading-5">
              What type of public concern would you like to report today?
            </Text>
          </View>

          {/* Category Grid */}
          <View className="px-5 flex-row flex-wrap gap-3">
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => { onSelect(cat); onClose(); }}
                className="active:opacity-80"
                style={{ width: cat.wide ? '100%' : '47%' }}
              >
                <View
                  className="rounded-2xl p-4"
                  style={{ backgroundColor: '#111E27', borderWidth: 1, borderColor: '#1E3347' }}
                >
                  <View className="w-10 h-10 rounded-xl items-center justify-center mb-3"
                    style={{ backgroundColor: cat.bg }}
                  >
                    <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                  </View>
                  <Text className="text-white font-bold text-sm mb-1">{cat.label}</Text>
                  <Text className="text-gray-500 text-xs leading-4">{cat.examples}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Emergency Notice */}
          <View className="mx-5 mt-4 p-4 rounded-2xl flex-row gap-3"
            style={{ backgroundColor: '#1A2D1A', borderWidth: 1, borderColor: '#1E4D1E' }}
          >
            <Ionicons name="information-circle-outline" size={20} color="#34D399" />
            <Text className="text-gray-400 text-xs flex-1 leading-5">
              <Text className="text-[#34D399] font-semibold">Emergency?</Text> Please call local emergency
              services immediately. This portal is for non-urgent infrastructure reporting.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

// ─────────────────────────────────────────────
// Success Screen
// ─────────────────────────────────────────────
function SuccessScreen({ refId, category, location, onDashboard, onMyReports }: {
  refId: string;
  category: string;
  location: string;
  onDashboard: () => void;
  onMyReports: () => void;
}) {
  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <View className="flex-1 items-center justify-center px-8">
        {/* Shield icon */}
        <View className="mb-8">
          <View className="w-36 h-36 rounded-full items-center justify-center"
            style={{
              backgroundColor: '#0D2A35',
              borderWidth: 3,
              borderColor: '#4CC2D1',
              shadowColor: '#4CC2D1',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.5,
              shadowRadius: 30,
              elevation: 20,
            }}
          >
            <Ionicons name="shield-checkmark" size={72} color="#4CC2D1" />
          </View>
        </View>

        <Text className="text-white text-2xl font-bold text-center mb-3">
          Your Report Submitted{'\n'}Successfully!
        </Text>
        <Text className="text-gray-400 text-sm text-center leading-6 mb-2">
          Your report has been received and is being{'\n'}processed by our safety team.
        </Text>
        <Text className="text-[#4CC2D1] font-bold mb-8">Your ID is: {refId}</Text>

        {/* Reference Card */}
        <View className="w-full bg-[#111E27] rounded-2xl p-4 mb-8"
          style={{ borderWidth: 1, borderColor: '#1E3347' }}
        >
          <Text className="text-gray-500 text-[10px] uppercase font-bold tracking-wide mb-2">Reference</Text>
          <Text className="text-white text-sm">
            <Text className="text-gray-400">Type: </Text>{category}
          </Text>
          <Text className="text-white text-sm mt-1">
            <Text className="text-gray-400">Location: </Text>{location}
          </Text>
        </View>

        <Pressable
          onPress={onDashboard}
          className="w-full bg-[#4CC2D1] py-4 rounded-2xl items-center mb-3 active:opacity-80"
        >
          <Text className="text-[#071318] font-bold text-base">Back to Dashboard</Text>
        </Pressable>
        <Pressable
          onPress={onMyReports}
          className="w-full py-4 rounded-2xl items-center active:opacity-70"
          style={{ borderWidth: 1, borderColor: '#2D4F5C' }}
        >
          <Text className="text-gray-300 font-semibold text-base">View My Reports</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

// ─────────────────────────────────────────────
// Main Report Screen
// ─────────────────────────────────────────────
export default function ReportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[0] | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('AZ-9921');

  // TODO: Replace with real expo-location data
  const locationText = 'No. 06, Nawala Road, Rajagiriya, Sri Lanka';
  const isGpsActive = true; // TODO: set from Location.requestForegroundPermissionsAsync()

  // TODO: Replace with expo-image-picker results
  const [photo, setPhoto] = useState<string | null>(null);
  const [video, setVideo] = useState<string | null>(null);

  // TODO: Wire to handleSubmit with Firebase (see top comment)
  const handleSubmit = async () => {
    if (!selectedCategory || !description) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500)); // remove when wired to Firebase
    setRefId('AZ-' + Math.floor(Math.random() * 9000 + 1000));
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SuccessScreen
        refId={refId}
        category={selectedCategory?.label ?? 'General Hazard'}
        location={locationText}
        onDashboard={() => { setSubmitted(false); router.replace('/(tabs)/home'); }}
        onMyReports={() => { setSubmitted(false); router.replace('/(tabs)/history'); }}
      />
    );
  }

  const canSubmit = !!selectedCategory && description.trim().length > 10;

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'android' ? 30 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* ── Header ── */}
          <View className="px-5 mb-5">
            <Text className="text-white text-2xl font-bold">New Report</Text>
            <Text className="text-gray-400 text-sm mt-1">Help make your community safer</Text>
          </View>

          {/* ── 1. Location ── */}
          <View className="px-5 mb-5">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-white font-bold text-base">Automatic Location</Text>
              <View className="flex-row items-center gap-1.5">
                <View className="w-2 h-2 rounded-full" style={{ backgroundColor: isGpsActive ? '#30A89C' : '#E05C5C' }} />
                <Text className="text-xs font-semibold" style={{ color: isGpsActive ? '#30A89C' : '#E05C5C' }}>
                  {isGpsActive ? 'GPS Active' : 'GPS Off'}
                </Text>
              </View>
            </View>

            {/* TODO: Replace View below with <MapView> showing current location pin */}
            <View className="rounded-2xl overflow-hidden mb-3"
              style={{ height: 160, borderWidth: 1, borderColor: '#1E3347' }}
            >
              {/* MAP PLACEHOLDER — replace with MapView component */}
              <View className="flex-1 bg-[#111E27] items-center justify-center">
                <Ionicons name="map-outline" size={40} color="#2D4F5C" />
                <Text className="text-gray-600 text-sm mt-2">Map View</Text>
                <Text className="text-gray-700 text-xs">(configure Google Maps — see guide)</Text>
              </View>
            </View>

            <View className="flex-row items-center gap-2 bg-[#111E27] rounded-xl px-4 py-3"
              style={{ borderWidth: 1, borderColor: '#1E3347' }}
            >
              <Ionicons name="location" size={16} color="#4CC2D1" />
              {/* TODO: Replace with real location from expo-location */}
              <Text className="text-gray-300 text-sm flex-1" numberOfLines={1}>{locationText}</Text>
            </View>
          </View>

          {/* ── 2. Evidence ── */}
          <View className="px-5 mb-5">
            <Text className="text-white font-bold text-base mb-3">Evidence</Text>
            <View className="flex-row gap-3">
              {/* Photo */}
              <Pressable
                className="flex-1 active:opacity-70"
                // TODO: onPress → ImagePicker.launchCameraAsync() or launchImageLibraryAsync()
              >
                <View className="rounded-2xl items-center justify-center py-5"
                  style={{
                    borderWidth: 1.5, borderColor: '#1E3347', borderStyle: 'dashed',
                    backgroundColor: '#111E27',
                  }}
                >
                  {photo ? (
                    <Image source={{ uri: photo }} style={{ width: 60, height: 60, borderRadius: 10 }} />
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={26} color="#3A6070" />
                      <Text className="text-gray-500 text-xs mt-2">Add Photo</Text>
                    </>
                  )}
                </View>
              </Pressable>

              {/* Video */}
              <Pressable
                className="flex-1 active:opacity-70"
                // TODO: onPress → ImagePicker.launchCameraAsync({ mediaTypes: 'Videos' })
              >
                <View className="rounded-2xl items-center justify-center py-5"
                  style={{
                    borderWidth: 1.5, borderColor: '#1E3347', borderStyle: 'dashed',
                    backgroundColor: '#111E27',
                  }}
                >
                  {video ? (
                    <Ionicons name="videocam" size={26} color="#4CC2D1" />
                  ) : (
                    <>
                      <Ionicons name="videocam-outline" size={26} color="#3A6070" />
                      <Text className="text-gray-500 text-xs mt-2">Add Video</Text>
                    </>
                  )}
                </View>
              </Pressable>
            </View>
          </View>

          {/* ── 3. Category ── */}
          <View className="px-5 mb-5">
            <Text className="text-white font-bold text-base mb-3">Category</Text>
            <Pressable onPress={() => setCategoryModalVisible(true)} className="active:opacity-80">
              <View className="flex-row items-center justify-between bg-[#111E27] rounded-2xl px-4 py-4"
                style={{ borderWidth: 1, borderColor: selectedCategory ? '#4CC2D1' : '#1E3347' }}
              >
                {selectedCategory ? (
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-lg items-center justify-center"
                      style={{ backgroundColor: selectedCategory.bg }}
                    >
                      <Ionicons name={selectedCategory.icon as any} size={18} color={selectedCategory.color} />
                    </View>
                    <Text className="text-white font-semibold">{selectedCategory.label}</Text>
                  </View>
                ) : (
                  <Text className="text-gray-500">Select Category</Text>
                )}
                <Ionicons name="chevron-forward" size={18} color="#3A6070" />
              </View>
            </Pressable>
          </View>

          {/* ── 4. Description ── */}
          <View className="px-5 mb-6">
            <Text className="text-white font-bold text-base mb-3">Description</Text>
            <View className="bg-[#111E27] rounded-2xl px-4 py-3"
              style={{ borderWidth: 1, borderColor: '#1E3347', minHeight: 120 }}
            >
              <TextInput
                placeholder="Describe the issue in detail..."
                placeholderTextColor="#2A4A5A"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                style={{ color: 'white', fontSize: 14, lineHeight: 22, minHeight: 100 }}
              />
            </View>
            <Text className="text-gray-600 text-xs mt-2 text-right">{description.length}/500</Text>
          </View>

          {/* ── Submit Button ── */}
          <View className="px-5">
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              className="py-4 rounded-2xl items-center"
              style={{ backgroundColor: canSubmit ? '#4CC2D1' : '#1E3347' }}
            >
              {loading ? (
                <ActivityIndicator color="#071318" />
              ) : (
                <Text
                  className="font-bold text-base"
                  style={{ color: canSubmit ? '#071318' : '#3A6070' }}
                >
                  Submit Report
                </Text>
              )}
            </Pressable>
            {!canSubmit && (
              <Text className="text-gray-600 text-xs text-center mt-2">
                Select a category and add a description to continue
              </Text>
            )}
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Modal */}
      <CategoryModal
        visible={categoryModalVisible}
        onSelect={setSelectedCategory}
        onClose={() => setCategoryModalVisible(false)}
      />
    </LinearGradient>
  );
}