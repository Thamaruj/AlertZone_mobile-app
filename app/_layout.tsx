import { Stack } from "expo-router";
import "../global.css";
import Toast from "react-native-toast-message"; // <-- import Toast
import { toastConfig } from "../config/toastConfig"; // make sure this matches the exported name

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <Toast config={toastConfig} />
    </>
  );
}