import { Stack } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message"; // <-- import Toast
import { toastConfig } from "../config/toastConfig"; // make sure this matches the exported name
import "../global.css";

export default function RootLayout() {
   const insets = useSafeAreaInsets();
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
          <Toast
            config={toastConfig}
            topOffset={
              Platform.OS === "ios" ? insets.top + 0 : 50
            }
          />
    </>
  );
}