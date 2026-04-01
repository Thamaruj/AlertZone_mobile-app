import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Animated } from 'react-native';

interface ScrollContextType {
  tabBarTranslateY: Animated.Value;
  onScroll: (event: { nativeEvent: { contentOffset: { y: number } } }) => void;
}

const ScrollContext = createContext<ScrollContextType | null>(null);

export function ScrollProvider({ children }: { children: React.ReactNode }) {
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isHidden = useRef(false);

  const onScroll = useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const currentY = event.nativeEvent.contentOffset.y;
      const diff = currentY - lastScrollY.current;

      // Scrolling DOWN and tab is visible → hide it
      if (diff > 5 && !isHidden.current) {
        isHidden.current = true;
        Animated.spring(tabBarTranslateY, {
          toValue: 120, // push it off screen
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }).start();
      }
      // Scrolling UP and tab is hidden → show it
      else if (diff < -5 && isHidden.current) {
        isHidden.current = false;
        Animated.spring(tabBarTranslateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 60,
          friction: 12,
        }).start();
      }

      lastScrollY.current = currentY;
    },
    [tabBarTranslateY]
  );

  return (
    <ScrollContext.Provider value={{ tabBarTranslateY, onScroll }}>
      {children}
    </ScrollContext.Provider>
  );
}

export function useScrollContext() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScrollContext must be used inside ScrollProvider');
  return ctx;
}