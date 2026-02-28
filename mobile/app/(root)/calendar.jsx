import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../constants/colors";
import SafeScreen from "../../components/SafeScreen";

export default function CalendarScreen() {
  return (
    <SafeScreen>
      <View style={styles.container}>
        <Text style={styles.text}>Tính năng Lịch sử giao dịch đang phát triển</Text>
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  text: {
    color: COLORS.text,
    fontSize: 16,
  },
});
