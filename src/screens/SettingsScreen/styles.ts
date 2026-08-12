import { StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  backButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  headerTitle: { color: colors.text, fontSize: 20, fontWeight: '800' },
  headerSpacer: { width: 40 },
  content: { padding: 16 },
  sectionTitle: { marginTop: 16, marginBottom: 8, color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 0.7, textTransform: 'uppercase' },
  group: { overflow: 'hidden', borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  row: { minHeight: 76, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center' },
  iconWrap: { width: 38, height: 38, marginRight: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,36,94,0.12)' },
  rowCopy: { flex: 1, paddingRight: 12 },
  rowTitle: { color: colors.text, fontSize: 14, fontWeight: '700' },
  rowDescription: { marginTop: 3, color: colors.muted, fontSize: 12 },
  divider: { height: 1, marginLeft: 64, backgroundColor: 'rgba(255,255,255,0.06)' },
});
