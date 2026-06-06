import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

export type ThemeType = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  card: string;
  border: string;
  primary: string;
  primaryPressed: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  cardUnearned: string;
  modalBackdrop: string;
  successBg: string;
  successBorder: string;
  successText: string;
  dangerBg: string;
  dangerBorder: string;
  dangerText: string;
  warningBg: string;
  warningBorder: string;
  warningText: string;
}

export const lightColors: ThemeColors = {
  background: '#F5F5F5',
  card: '#FFFFFF',
  border: '#E8E8E8',
  primary: '#0D8A72',
  primaryPressed: '#0B6E5B',
  text: '#1A1A1A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  cardUnearned: '#F9FAFB',
  modalBackdrop: 'rgba(0, 0, 0, 0.5)',
  successBg: '#F0FDF4',
  successBorder: '#BBF7D0',
  successText: '#059669',
  dangerBg: '#FEE2E2',
  dangerBorder: '#DC262630',
  dangerText: '#DC2626',
  warningBg: '#FEF3C7',
  warningBorder: '#D9770630',
  warningText: '#D97706',
};

export const darkColors: ThemeColors = {
  background: '#0D1F2D',
  card: '#111E27',
  border: '#1E3347',
  primary: '#4CC2D1',
  primaryPressed: '#3BB0BE',
  text: '#FFFFFF',
  textSecondary: '#5A7D8A',
  textMuted: '#3A5060',
  cardUnearned: '#1A1A1A',
  modalBackdrop: 'rgba(0, 0, 0, 0.85)',
  successBg: '#1A2D1A',
  successBorder: '#1E4D1E',
  successText: '#30A89C',
  dangerBg: '#2D1F24',
  dangerBorder: '#DC262650',
  dangerText: '#EF4444',
  warningBg: '#2D251F',
  warningBorder: '#D9770650',
  warningText: '#F59E0B',
};

interface ThemeContextType {
  theme: ThemeType;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: ThemeType) => void;
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>('light');
  const [loading, setLoading] = useState(true);

  // Load theme from AsyncStorage on startup (default to 'light')
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setThemeState(savedTheme);
        } else {
          // Default to light for 1st time install
          setThemeState('light');
        }
      } catch (e) {
        console.error('Failed to load theme:', e);
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('app_theme', newTheme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, setTheme, loading }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
