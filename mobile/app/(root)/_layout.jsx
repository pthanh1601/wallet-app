import { useUser, useClerk } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, AppState, Alert } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import * as SplashScreen from "expo-splash-screen";
import AnimatedSplashScreen from "../../components/AnimatedSplashScreen";

// Giữ màn hình chờ (Native Splash) cho đến khi App sẵn sàng
SplashScreen.preventAutoHideAsync();

export default function Layout() {
  const { isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);
  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);
  
  // Dùng useRef thay cho useState để cờ chặn (lock) luôn lấy được giá trị mới nhất trong các hàm callback
  const isAuthenticatingRef = useRef(false); 
  const appState = useRef(AppState.currentState);
  const needLock = useRef(false);

  // 1. Hàm xác thực FaceID
  const authenticate = async () => {
    if (isAuthenticatingRef.current) return; // Ngăn gọi chồng chéo
    isAuthenticatingRef.current = true;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Mở khóa ví của bạn",
        disableDeviceFallback: false,
        cancelLabel: "Hủy",
        fallbackLabel: "Dùng mật mã máy",
      });

      if (result.success) {
        setIsUnlocked(true);
      }
    } catch (error) {
      console.log("Lỗi xác thực sinh trắc học", error);
      Alert.alert("Lỗi bảo mật", "Không thể xác thực danh tính. Vui lòng thử lại.");
    } finally {
      isAuthenticatingRef.current = false;
    }
  };

  // 2. Kiểm tra phần cứng và tự động gọi FaceID lần đầu
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        setHasBiometrics(true);
        authenticate();
      } else {
        setIsUnlocked(true);
      }
    })();
  }, [isLoaded, isSignedIn]);

  // 3. Lắng nghe trạng thái Background/Foreground
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background") {
        setIsUnlocked(false);
        needLock.current = true;
      } else if (nextAppState === "active" && needLock.current) {
        needLock.current = false;
        authenticate();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  // 4. Hiển thị màn hình Splash động cho đến khi Animation xong VÀ Clerk đã load xong
  if (!isLoaded || !isSplashAnimationFinished) {
    return (
      <AnimatedSplashScreen 
        onAnimationFinish={() => setIsSplashAnimationFinished(true)} 
      />
    );
  }

  // Nếu chưa đăng nhập, đẩy về trang Login
  if (!isSignedIn) return <Redirect href={"/sign-in"} />;

  // 5. Nếu có FaceID nhưng chưa mở khóa -> Hiện màn hình khóa
  if (hasBiometrics && !isUnlocked) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background }}>
        <Ionicons name="lock-closed-outline" size={64} color={COLORS.primary} style={{ marginBottom: 20 }} />
        <Text style={{ fontSize: 20, fontWeight: "bold", color: COLORS.text, marginBottom: 10 }}>
          Wallet Locked
        </Text>
        
        <TouchableOpacity
          onPress={authenticate}
          style={{
            marginTop: 20,
            backgroundColor: COLORS.primary,
            paddingVertical: 12,
            paddingHorizontal: 30,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
            Mở khóa bằng FaceID
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => signOut()} style={{ marginTop: 20 }}>
          <Text style={{ color: COLORS.primary, fontSize: 14 }}>Đăng xuất (Dùng tài khoản khác)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 6. Giao diện chính của ứng dụng
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: "#FFF",
          borderTopWidth: 1,
          borderTopColor: "#F0F0F0",
          height: 85, 
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
          marginBottom: 5,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Trang chủ", tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} /> }} />
      <Tabs.Screen name="calendar" options={{ title: "Lịch", tabBarIcon: ({ color, size }) => <Ionicons name="calendar" size={size} color={color} /> }} />
      <Tabs.Screen name="report" options={{ title: "Báo cáo", tabBarIcon: ({ color, size }) => <Ionicons name="pie-chart" size={size} color={color} /> }} />
      <Tabs.Screen name="chatai" options={{ title: "Chat AI", tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} /> }} />
      <Tabs.Screen name="create" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null, // Dòng này sẽ xóa nút khỏi thanh navbar
        }}
      />
    </Tabs>
  );
}