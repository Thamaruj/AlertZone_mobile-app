import React, { useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

const ONBOARDING_DATA = [
  {
    title: "Welcome to AlertZone",
    description: "Empowering Citizens for a Safer Community",
    image: require('../assets/images/Onboarding_1.png'), // Replace with your actual paths
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
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const isLastScreen = currentIndex === ONBOARDING_DATA.length - 1;

  const handleNext = () => {
    if (isLastScreen) {
      router.push("/(auth)/login");
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <View className="flex-1 bg-[#122D36] items-center justify-center px-10">
      {/* Skip Button */}
      <Pressable 
        className="absolute top-14 right-4 border border-[#30A89C] px-4 py-1 rounded-full" 
        onPress={() => router.push("/(auth)/login")}
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
          {isLastScreen ? "Let's Start" : "NEXT"}
        </Text>
      </Pressable>
    </View>
  );
}