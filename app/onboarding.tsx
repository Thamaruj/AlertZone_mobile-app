import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { cssInterop } from 'nativewind';
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

// Bridge Gradient for NativeWind v4
cssInterop(LinearGradient, { className: "style" });

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
      <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} className="flex-1">
        <View className="flex-1 items-center justify-center px-8 relative">
          
          {/* Logo container with radial glow effect */}
          <View className="items-center justify-center mb-8 relative">
            <View className="absolute w-44 h-44 rounded-full bg-[#30A89C]/10" />
            <View className="absolute w-32 h-32 rounded-full bg-[#4CC2D1]/10" />
            <Image 
              source={require('../assets/images/iconAlerZone-Bg-none.png')} 
              className="w-28 h-28"
              resizeMode="contain"
            />
          </View>

          {/* Welcome Text */}
          <View className="flex-row items-center justify-center mb-2">
            <Text className="text-white text-4xl font-extrabold tracking-wider">Alert</Text>
            <Text className="text-[#30A89C] text-4xl font-extrabold tracking-wider">Zone</Text>
          </View>
          
          <Text className="text-[#7BA8B5] text-xs font-semibold tracking-widest text-center uppercase mb-8">
            Stay Aware. Stay Safe.
          </Text>

          {/* Welcome Message Card */}
          <View className="bg-[#112D3E]/60 border border-[#214D66]/40 p-6 rounded-3xl mb-12 shadow-lg w-full">
            <Text className="text-white text-lg font-bold text-center mb-3">
              We Need Citizens Like You
            </Text>
            <Text className="text-[#A2C3CE] text-sm text-center leading-5 mb-2">
              AlertZone is a community-driven safety and alert platform. We bridge the gap between citizens and authorities to report, track, and resolve real-world hazards and emergencies.
            </Text>
            <Text className="text-[#A2C3CE] text-sm text-center leading-5">
              By participating, you help keep your neighborhood informed and safe. Let's make a difference together.
            </Text>
          </View>

          {/* Action Button */}
          <Pressable 
            className="bg-[#30A89C] w-full py-4 rounded-2xl absolute bottom-14 shadow-lg active:opacity-90"
            onPress={() => setShowWelcome(false)}
          >
            <Text className="text-white text-lg font-extrabold text-center tracking-wide">
              Let's Get Started
            </Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0D1F2D', '#0A1820', '#071318']} className="flex-1">
      <View className="flex-1 items-center justify-center px-10">
        
        {/* Skip Button */}
        <Pressable 
          className="absolute top-14 right-4 border border-[#30A89C] px-4 py-1 rounded-full" 
          onPress={handleSkip}
        >
          <Text className="text-[#30A89C] text-lg ">Skip</Text>
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
              className={`h-1.5 rounded-full mx-3 ${index === currentIndex ? 'w-20 bg-white' : 'w-12 bg-gray-500 '}`} 
            />
          ))}
        </View>

        {/* Text Content */}
        <Text className="text-white text-3xl font-bold text-center mb-4">
          {ONBOARDING_DATA[currentIndex].title}
        </Text>
        <Text className="text-gray-300 text-lg text-center mb-10">
          {ONBOARDING_DATA[currentIndex].description}
        </Text>

        {/* Action Button */}
        <Pressable 
          className="bg-[#30A89C] w-full py-4 rounded-2xl absolute bottom-14"
          onPress={handleNext}
        >
          <Text className="text-white text-xl font-bold text-center">
            {isLastScreen ? "Let's Start" : "Next"}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}