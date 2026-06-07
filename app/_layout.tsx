import { AuthProvider } from "@/config/authConfig";
import { ThemeProvider, useTheme } from "../config/themeContext";
import { Stack, usePathname } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message"; // <-- import Toast
import { toastConfig } from "../config/toastConfig"; // make sure this matches the exported name
import "../global.css";
import { useNotifications } from "../hooks/useNotifications";
import NetworkStatusGate from "../components/NetworkStatusGate";
import { LinearGradient } from "expo-linear-gradient";

function AppContent() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const pathname = usePathname();
  useNotifications(); // Initialize notification listeners inside the AuthProvider context

  // Subtle gradient is hidden on maps and non-content screens
  const isExcluded =
    pathname === "/" ||
    pathname === "/onboarding" ||
    pathname?.includes("/(auth)") ||
    pathname === "/map" ||
    pathname === "/(tabs)/map";

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      {!isExcluded && (
        <LinearGradient
          colors={[colors.background, `${colors.background}f2`, `${colors.background}00`]}
          locations={[0, 0.45, 1]}
          pointerEvents="none"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: insets.top + 20,
            zIndex: 90,
          }}
        />
      )}
      <NetworkStatusGate />
      <Toast
        config={toastConfig}
        topOffset={
          Platform.OS === "ios" ? insets.top + 0 : 50
        }
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}