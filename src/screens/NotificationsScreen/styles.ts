import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 40 },
  emptyState: { flex: 1, paddingHorizontal: 36, alignItems: 'center', justifyContent: 'center' },
  iconWrap: { width: 72, height: 72, marginBottom: 18, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,36,94,0.12)' },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyDescription: { marginTop: 8, color: colors.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
});
