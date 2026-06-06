// components/SelectionModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../config/themeContext';

interface SelectionModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  options: string[];
  onSelect: (option: string) => void;
  selectedValue?: string;
  placeholder?: string;
}

export default function SelectionModal({
  visible,
  onClose,
  title,
  options,
  onSelect,
  selectedValue,
  placeholder = 'Search...',
}: SelectionModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const { colors } = useTheme();

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View className="px-5 pt-14 pb-4 flex-row items-center gap-3" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Pressable onPress={onClose} className="active:opacity-70 p-2">
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </Pressable>
            <Text className="text-xl font-bold flex-1" style={{ color: colors.text }}>{title}</Text>
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} className="p-2">
                <Text style={{ color: colors.primary, fontSize: 14 }}>Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Search Input */}
          <View className="px-5 mt-4">
            <View className="rounded-2xl px-4 py-3 flex-row items-center border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <Ionicons name="search-outline" size={20} color={colors.textSecondary} />
              <TextInput
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                className="text-base ml-3 flex-1 p-0"
                style={{ margin: 0, padding: 0, color: colors.text }}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
            </View>
          </View>

          {/* Options List */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item) => item}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 15, paddingBottom: 40 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Ionicons name="alert-circle-outline" size={48} color={colors.textSecondary} />
                <Text style={{ color: colors.textSecondary }} className="mt-2 text-base text-center">No options found matching &quot;{searchQuery}&quot;</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isSelected = selectedValue === item;
              return (
                <Pressable
                  onPress={() => {
                    onSelect(item);
                    onClose();
                    setSearchQuery('');
                  }}
                  className="flex-row items-center justify-between p-4 mb-3 rounded-2xl border active:opacity-80"
                  style={{
                    backgroundColor: colors.card,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: 1,
                  }}
                >
                  <Text className="text-base font-medium" style={{ color: isSelected ? colors.primary : colors.text }}>
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.successText} />
                  )}
                </Pressable>
              );
            }}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
