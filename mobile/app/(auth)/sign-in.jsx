import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Text, TextInput, TouchableOpacity, View, Image, Alert } from "react-native";
import { useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { styles } from "../../assets/styles/auth.styles";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [showTwoFactor, setShowTwoFactor] = useState(false);

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        if (signInAttempt.status === "needs_second_factor") {
          setError("Tài khoản này đang bật 2FA. Vui lòng dùng tài khoản khác để test.");
        } else {
          console.error("Sign in incomplete. Status:", signInAttempt.status);
          setError(`Sign in incomplete: ${signInAttempt.status}`);
        }
      }
    } catch (err) {
      if (err.errors?.[0]?.code === "form_password_incorrect") {
        setError("Password is incorrect. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
    }
  };

  /*
  const onTwoFactorPress = async () => {
    if (!isLoaded) return;

    try {
      const phoneFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === "phone_code");
      const strategy = phoneFactor ? "phone_code" : signIn.supportedSecondFactors[0]?.strategy;
      const signInAttempt = await signIn.attemptSecondFactor({
        strategy,
        code,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2));
        setError("Verification failed. Please try again.");
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || "An error occurred");
    }
  };

  const onResendPress = async () => {
    try {
      const phoneFactor = signIn.supportedSecondFactors?.find((f) => f.strategy === "phone_code");
      if (phoneFactor) {
        await signIn.prepareSecondFactor({ strategy: "phone_code" });
        Alert.alert("Thành công", "Mã xác thực mới đã được gửi!");
      }
    } catch (err) {
      setError("Không thể gửi lại mã. Vui lòng thử lại sau.");
    }
  };
  */

  /*
  if (showTwoFactor) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Xác thực 2 bước</Text>
        <Text style={{ textAlign: "center", color: COLORS.textLight, marginBottom: 20 }}>
          Nhập mã xác thực đã được gửi đến thiết bị của bạn.
        </Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TextInput
          style={[styles.input, error && styles.errorInput]}
          value={code}
          placeholder="Nhập mã code"
          placeholderTextColor="#9A8478"
          keyboardType="numeric"
          onChangeText={setCode}
        />

        <TouchableOpacity style={styles.button} onPress={onTwoFactorPress}>
          <Text style={styles.buttonText}>Xác nhận</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 15 }} onPress={onResendPress}>
          <Text style={{ color: COLORS.primary, textAlign: "center", fontWeight: "600" }}>Gửi lại mã</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={{marginTop: 20}} onPress={() => setShowTwoFactor(false)}>
           <Text style={{color: COLORS.primary, textAlign: 'center'}}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    );
  }
  */

  return (
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      extraScrollHeight={30}
    >
      <View style={styles.container}>
        <Image source={require("../../assets/images/revenue-i4.png")} style={styles.illustration} />
        <Text style={styles.title}>Welcome Back</Text>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color={COLORS.expense} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => setError("")}>
              <Ionicons name="close" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          </View>
        ) : null}

        <TextInput
          style={[styles.input, error && styles.errorInput]}
          autoCapitalize="none"
          value={emailAddress}
          placeholder="Enter email"
          placeholderTextColor="#9A8478"
          onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
        />

        <TextInput
          style={[styles.input, error && styles.errorInput]}
          value={password}
          placeholder="Enter password"
          placeholderTextColor="#9A8478"
          secureTextEntry={true}
          onChangeText={(password) => setPassword(password)}
        />

        <TouchableOpacity style={styles.button} onPress={onSignInPress}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>

        <View style={styles.footerContainer}>
          <Text style={styles.footerText}>Don&apos;t have an account?</Text>

          <Link href="/sign-up" asChild>
            <TouchableOpacity>
              <Text style={styles.linkText}>Sign up</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}
