import { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Image } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { COLORS } from "../constants/colors";

const AnimatedSplashScreen = ({ onAnimationFinish }) => {
  const fadeAnim = useRef(new Animated.Value(1)).current; // Bắt đầu từ 1 (hiện rõ ngay lập tức để khớp với Native Splash)
  const scaleAnim = useRef(new Animated.Value(1)).current; // Bắt đầu từ 1 (kích thước chuẩn)

  useEffect(() => {
    async function prepare() {
      try {
        // 1. Tắt màn hình chờ Native để lộ ra màn hình này
        await SplashScreen.hideAsync();

        // 2. Chạy hiệu ứng động
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 0, // Mờ dần đi để lộ ra màn hình chính
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.5, // Phóng to logo ra một chút (hiệu ứng Zoom Out)
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => {
          // 3. Khi chạy xong thì báo cho App biết để vào màn hình chính
          if (onAnimationFinish) onAnimationFinish();
        });
      } catch (e) {
        console.warn(e);
        if (onAnimationFinish) onAnimationFinish();
      }
    }

    prepare();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          source={require("../assets/images/icon.png")} // Đảm bảo đường dẫn ảnh đúng
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff", // Màu nền phải trùng với màu trong app.json
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 200, // Kích thước phải khớp hoặc gần giống app.json để mượt
    height: 200,
  },
});

export default AnimatedSplashScreen;