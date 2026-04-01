import { Stack } from "expo-router";
import "../global.css";
import Toast from "react-native-toast-message"; // <-- import Toast
import { toastConfig } from "../config/toastConfig"; // make sure this matches the exported name
import { AuthProvider } from "@/config/authConfig";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform } from "react-native";

export default function RootLayout() {
    const insets = useSafeAreaInsets();
  return (
    <>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
          <Toast
            config={toastConfig}
            topOffset={
              Platform.OS === "ios" ? insets.top + 0 : 50
            }
          />
      </AuthProvider>
    </>
  );
}