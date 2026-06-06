// components/SelectionModal.tsx
import React, { useState } from 'react';
import { Modal, View, Text, TextInput, Pressable, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <LinearGradient colors={['#F5F5F5', '#FAFAFA', '#F5F5F5']} style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Header */}
          <View className="px-5 pt-14 pb-4 flex-row items-center gap-3 border-b border-[#FFFFFF]">
            <Pressable onPress={onClose} className="active:opacity-70 p-2">
              <Ionicons name="arrow-back" size={24} color="#0D8A72" />
            </Pressable>
            <Text className="text-[#1A1A1A] text-xl font-bold flex-1">{title}</Text>
            {searchQuery ? (
              <Pressable onPress={() => setSearchQuery('')} className="p-2">
                <Text className="text-[#0D8A72] text-sm">Clear</Text>
              </Pressable>
            ) : null}
          </View>

          {/* Search Input */}
          <View className="px-5 mt-4">
            <View className="bg-white border border-[#E8E8E8] rounded-2xl px-4 py-3 flex-row items-center">
              <Ionicons name="search-outline" size={20} color="#6B7280" />
              <TextInput
                placeholder={placeholder}
                placeholderTextColor="#6B7280"
                className="text-[#1A1A1A] text-base ml-3 flex-1 p-0"
                style={{ margin: 0, padding: 0 }}
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
                <Ionicons name="alert-circle-outline" size={48} color="#6B7280" />
                <Text className="text-[#6B7280] mt-2 text-base text-center">No options found matching &quot;{searchQuery}&quot;</Text>
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
                  className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border ${
                    isSelected
                      ? 'bg-white border-[#059669]'
                      : 'bg-white border-[#E8E8E8]'
                  } active:opacity-80`}
                >
                  <Text className={`text-base font-medium ${isSelected ? 'text-[#0D8A72]' : 'text-[#1A1A1A]'}`}>
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#059669" />
                  )}
                </Pressable>
              );
            }}
          />
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
}
