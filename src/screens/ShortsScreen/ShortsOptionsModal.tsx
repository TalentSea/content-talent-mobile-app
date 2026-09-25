import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  Check,
  Subtitles,
  X,
} from 'lucide-react-native';
import type { ShortItem } from '../../services/api/shortsApi';

type ShortsOptionsModalProps = {
  visible: boolean;
  short: ShortItem | null;
  captionsEnabled: boolean;
  onToggleCaptions: (enabled: boolean) => void;
  selectedTrack: string;
  onSelectTrack: (track: string) => void;
  onClose: () => void;
};

export function ShortsOptionsModal({
  visible,
  short,
  captionsEnabled,
  onToggleCaptions,
  selectedTrack,
  onSelectTrack,
  onClose,
}: ShortsOptionsModalProps) {
  const tracksList = [
    { id: 'en-auto', label: 'English (Auto-generated)' },
    ...(short?.captions || []).map((c, i) => ({
      id: c.srclang || `track-${i + 1}`,
      label: c.language ? `${c.language} (${c.srclang})` : `Track ${i + 1}`,
    })),
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={modalStyles.backdrop}>
        <Pressable style={modalStyles.dismissArea} onPress={onClose} />

        <View style={modalStyles.card}>
          {/* Drag Pill Handle */}
          <View style={modalStyles.dragHandle} />

          {/* Header */}
          <View style={modalStyles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Subtitles size={20} color="#6366F1" />
              <Text style={modalStyles.headerTitle}>Captions / Subtitles</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10} style={modalStyles.closeBtn}>
              <X size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Caption Tracks List (Just like in video player) */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={modalStyles.scrollBody}
          >
            {/* Off Option */}
            <Pressable
              style={[
                modalStyles.menuItem,
                !captionsEnabled && modalStyles.menuItemActive,
              ]}
              onPress={() => {
                onToggleCaptions(false);
                onClose();
              }}
            >
              <Text
                style={[
                  modalStyles.menuItemText,
                  !captionsEnabled && modalStyles.menuItemTextActive,
                ]}
              >
                Off
              </Text>
              {!captionsEnabled && <Check size={18} color="#6366F1" />}
            </Pressable>

            {/* Available Caption Tracks */}
            {tracksList.map(track => {
              const isSelected = captionsEnabled && selectedTrack === track.id;
              return (
                <Pressable
                  key={track.id}
                  style={[
                    modalStyles.menuItem,
                    isSelected && modalStyles.menuItemActive,
                  ]}
                  onPress={() => {
                    onSelectTrack(track.id);
                    onToggleCaptions(true);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      modalStyles.menuItemText,
                      isSelected && modalStyles.menuItemTextActive,
                    ]}
                  >
                    {track.label}
                  </Text>
                  {isSelected && <Check size={18} color="#6366F1" />}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dismissArea: {
    flex: 1,
  },
  card: {
    backgroundColor: '#12121E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    maxHeight: '60%',
    borderTopWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16.5,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    paddingBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#181828',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  menuItemActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: '#6366F1',
  },
  menuItemText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  menuItemTextActive: {
    color: '#818CF8',
    fontWeight: '700',
  },
});
