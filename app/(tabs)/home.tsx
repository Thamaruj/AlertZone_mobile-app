import { router } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center bg-blue-900">
      <Text className="text-white text-2xl font-bold">
        Home Screen
      </Text>

      <Pressable
       className="bg-white mt-3 px-6 py-3 rounded-xl"
       onPress={()=>router.push("/")}
      >
        <Text>
            Logout
        </Text>
      </Pressable>
    </View>
  );
}