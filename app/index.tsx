import { router } from "expo-router";
import { View, Text, Pressable, Image } from "react-native";



export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-[#122D36]">
      <Image
      source={require('../assets/images/iconAlerZone-Bg-none.png')}
      className="w-48 h-48 mb-4 "
      resizeMode="contain"
      >

      </Image>
        <Text className="text-5xl font-bold">
          <Text className="text-white">Alert</Text>
          <Text className="text-[#30A89C]">Zone</Text>
        </Text>
      <Text className="text-blue-100 text-lg mt-2 text-center px-10 font-light">
        Stay Aware. Stay Safe.
      </Text>

      {/* This button will now take the user to the login page to start the Firebase check */}
      <Pressable 
        className="absolute top-16 left-5 mt-10 px-10 py-2 rounded-lg shadow-lg active:opacity-70 border border-gray-200"
        onPress={() => router.push("/(tabs)/home")}
      >
        <Text className="text-gray-300  text-lg">
          Visit Home
        </Text>
      </Pressable>

      <Pressable
       className="absolute top-8 left-5 mt-5 py-2 px-4 rounded-lg active:opacity-70 border border-gray-200"
       onPress={()=>router.push("/(auth)/login")}>
        <Text className="text-gray-300  text-lg">
          Check Database Connection
        </Text>
      </Pressable>

      <Pressable 
        className="absolute bottom-14 left-0 right-0 mx-14 bg-[#30A89C] p-4 rounded-xl active:opacity-70"
        onPress={() => router.push("/onboarding")}
      >
        <Text className="text-white text-xl text-center font-bold">
          Get Started
        </Text>
      </Pressable>
    </View>
  );
}