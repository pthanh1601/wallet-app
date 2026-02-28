import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from "react-native";
import { useUser, useClerk } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { COLORS } from "../../constants/colors";
import SafeScreen from "../../components/SafeScreen";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

// Component hiển thị từng dòng cài đặt
const SettingItem = ({ icon, title, subtitle, onPress, type = "link", value, onValueChange, color = COLORS.text }) => (
  <TouchableOpacity 
    style={styles.itemContainer} 
    onPress={type === "link" ? onPress : undefined}
    activeOpacity={type === "link" ? 0.7 : 1}
  >
    <View style={styles.itemLeft}>
      <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View>
        <Text style={[styles.itemTitle, { color }]}>{title}</Text>
        {subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    
    {type === "link" && <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />}
    {type === "toggle" && (
      <Switch 
        value={value} 
        onValueChange={onValueChange}
        trackColor={{ false: "#767577", true: COLORS.primary }}
        thumbColor={"#f4f3f4"}
      />
    )}
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  
  // State giả lập cho các nút toggle
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleLogout = () => {
    Alert.alert("Đăng xuất", "Bạn có chắc chắn muốn đăng xuất khỏi tài khoản?", [
      { text: "Hủy", style: "cancel" },
      { text: "Đăng xuất", style: "destructive", onPress: () => signOut() },
    ]);
  };

  return (
    <SafeScreen>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* HEADER PROFILE */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image source={user?.imageUrl} style={styles.avatar} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : "Người dùng"}
            </Text>
            <Text style={styles.email}>{user?.primaryEmailAddress?.emailAddress}</Text>
          </View>
        </View>

        {/* SECTION: TÀI KHOẢN */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Tài khoản</Text>
          <View style={styles.sectionContent}>
            <SettingItem 
              icon="person-outline" 
              title="Thông tin cá nhân" 
              color={COLORS.primary} 
              onPress={() => router.push("/edit-profile")} 
            />
            <View style={styles.separator} />
            <SettingItem 
              icon="scan-outline" 
              title="Đăng nhập FaceID" 
              type="toggle" 
              value={isBiometricEnabled} 
              onValueChange={setIsBiometricEnabled} 
              color={COLORS.primary}
            />
          </View>
        </View>

        {/* SECTION: CÀI ĐẶT CHUNG */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Cài đặt chung</Text>
          <View style={styles.sectionContent}>
            <SettingItem icon="notifications-outline" title="Thông báo" color="#F59E0B" onPress={() => {}} />
            <View style={styles.separator} />
            <SettingItem 
              icon="moon-outline" 
              title="Chế độ tối" 
              type="toggle" 
              value={isDarkMode} 
              onValueChange={setIsDarkMode} 
              color="#6366F1"
            />
            <View style={styles.separator} />
            <SettingItem icon="language-outline" title="Ngôn ngữ" subtitle="Tiếng Việt" color="#10B981" onPress={() => {}} />
          </View>
        </View>

        {/* SECTION: KHÁC */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Hỗ trợ</Text>
          <View style={styles.sectionContent}>
            <SettingItem icon="help-circle-outline" title="Trung tâm trợ giúp" color="#3B82F6" onPress={() => {}} />
            <View style={styles.separator} />
            <SettingItem icon="shield-checkmark-outline" title="Chính sách bảo mật" color="#8B5CF6" onPress={() => {}} />
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Phiên bản 1.0.0</Text>
        <View style={{ height: 40 }} /> 
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F7" }, // Màu nền xám nhẹ giống iOS Settings
  header: { flexDirection: "row", alignItems: "center", padding: 20, backgroundColor: "#FFF", marginBottom: 20 },
  avatarContainer: { position: "relative" },
  avatar: { width: 70, height: 70, borderRadius: 35, borderWidth: 2, borderColor: "#F0F0F0" },
  editIcon: { position: "absolute", bottom: 0, right: 0, backgroundColor: COLORS.primary, padding: 6, borderRadius: 15, borderWidth: 2, borderColor: "#FFF" },
  userInfo: { marginLeft: 15, flex: 1 },
  name: { fontSize: 20, fontWeight: "bold", color: COLORS.text },
  email: { fontSize: 14, color: COLORS.textLight, marginTop: 2 },
  
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionHeader: { fontSize: 14, fontWeight: "600", color: COLORS.textLight, marginBottom: 8, marginLeft: 4, textTransform: "uppercase" },
  sectionContent: { backgroundColor: "#FFF", borderRadius: 16, overflow: "hidden", paddingVertical: 4 },
  
  itemContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, paddingHorizontal: 16 },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconContainer: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  itemTitle: { fontSize: 16, fontWeight: "500" },
  itemSubtitle: { fontSize: 13, color: COLORS.textLight },
  separator: { height: 1, backgroundColor: "#F0F0F0", marginLeft: 64 },

  logoutButton: { 
    marginHorizontal: 16, 
    backgroundColor: "#FFF", 
    paddingVertical: 15, 
    borderRadius: 16, 
    alignItems: "center", 
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FEE2E2"
  },
  logoutText: { color: "#EF4444", fontWeight: "bold", fontSize: 16 },
  versionText: { textAlign: "center", color: COLORS.textLight, fontSize: 12, marginBottom: 20 },
});