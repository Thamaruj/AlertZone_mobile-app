import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';


const ONBOARDING_DATA = [
  {
    title: "Welcome to AlertZone",
    description: "Empowering Citizens for a Safer Community",
    image: require('../assets/images/Onboarding_1.png'),
  },
  {
    title: "See It. Report It. Track It.",
    description: "Your Reports Connect to You Real-World Challenge.",
    image: require('../assets/images/Onboarding_2.png'),
  },
  {
    title: "Join Our Community",
    description: "Together, We Build a Smarter, Safer Sri Lanka.",
    image: require('../assets/images/Onboarding_3.png'),
  }
];

export default function Onboarding() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const isLastScreen = currentIndex === ONBOARDING_DATA.length - 1;

  const markOnboardingDone = async () => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
  };

  const handleNext = async () => {
    if (isLastScreen) {
      await markOnboardingDone();
      router.push("/(auth)/signupScreen");
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = async () => {
    await markOnboardingDone();
    router.push("/(auth)/loginScreen");
  };

  if (showWelcome) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View className="flex-1 items-center justify-center px-8 relative">
          
          {/* Logo container with subtle glow */}
          <View className="items-center justify-center mb-8 relative">
            <View style={{ position: 'absolute', width: 176, height: 176, borderRadius: 88, backgroundColor: '#0D8A72', opacity: 0.06 }} />
            <View style={{ position: 'absolute', width: 128, height: 128, borderRadius: 64, backgroundColor: '#0D8A72', opacity: 0.08 }} />
            <Image 
              source={require('../assets/images/iconAlerZone-Bg-none.png')} 
              className="w-28 h-28"
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <View className="flex-row items-center justify-center mb-2">
            <Text style={{ color: '#1A1A1A', fontSize: 34, fontWeight: '800', letterSpacing: 1 }}>Alert</Text>
            <Text style={{ color: '#0D8A72', fontSize: 34, fontWeight: '800', letterSpacing: 1 }}>Zone</Text>
          </View>
          
          <Text style={{ color: '#9CA3AF', fontSize: 11, fontWeight: '600', letterSpacing: 2, textAlign: 'center', textTransform: 'uppercase', marginBottom: 32 }}>
            Stay Aware. Stay Safe.
          </Text>

          {/* Welcome Message Card */}
          <View style={{ backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E8E8E8', padding: 24, borderRadius: 20, marginBottom: 48, width: '100%' }}>
            <Text style={{ color: '#1A1A1A', fontSize: 17, fontWeight: '700', textAlign: 'center', marginBottom: 12 }}>
              We Need Citizens Like You
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 8 }}>
              AlertZone is a community-driven safety and alert platform. We bridge the gap between citizens and authorities to report, track, and resolve real-world hazards and emergencies.
            </Text>
            <Text style={{ color: '#6B7280', fontSize: 13, textAlign: 'center', lineHeight: 20 }}>
              By participating, you help keep your neighborhood informed and safe. Let's make a difference together.
            </Text>
          </View>

          {/* Action Button */}
          <Pressable 
            style={{ backgroundColor: '#0D8A72', width: '100%', paddingVertical: 16, borderRadius: 16, position: 'absolute', bottom: 56 }}
            onPress={() => setShowWelcome(false)}
            className="active:opacity-90"
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center', letterSpacing: 0.5 }}>
              Let's Get Started
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View className="flex-1 items-center justify-center px-10">
        
        {/* Skip Button */}
        <Pressable 
          style={{ position: 'absolute', top: 56, right: 16, borderWidth: 1, borderColor: '#0D8A72', paddingHorizontal: 16, paddingVertical: 4, borderRadius: 20 }}
          onPress={handleSkip}
        >
          <Text style={{ color: '#0D8A72', fontSize: 15 }}>Skip</Text>
        </Pressable>

        {/* Illustration */}
        <Image 
          source={ONBOARDING_DATA[currentIndex].image} 
          className="w-85 h-85 mb-10"
          resizeMode="contain"
        />

        {/* Pagination Dots */}
        <View className="flex-row mb-10 space-x-2">
          {ONBOARDING_DATA.map((_, index) => (
            <View 
              key={index} 
              style={{
                height: 6,
                borderRadius: 3,
                marginHorizontal: 12,
                width: index === currentIndex ? 80 : 48,
                backgroundColor: index === currentIndex ? '#0D8A72' : '#E5E7EB',
              }}
            />
          ))}
        </View>

        {/* Text Content */}
        <Text style={{ color: '#1A1A1A', fontSize: 26, fontWeight: '700', textAlign: 'center', marginBottom: 16 }}>
          {ONBOARDING_DATA[currentIndex].title}
        </Text>
        <Text style={{ color: '#6B7280', fontSize: 16, textAlign: 'center', marginBottom: 40 }}>
          {ONBOARDING_DATA[currentIndex].description}
        </Text>

        {/* Action Button */}
        <Pressable 
          style={{ backgroundColor: '#0D8A72', width: '100%', paddingVertical: 16, borderRadius: 16, position: 'absolute', bottom: 56 }}
          onPress={handleNext}
          className="active:opacity-90"
        >
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', textAlign: 'center' }}>
            {isLastScreen ? "Let's Start" : "Next"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}