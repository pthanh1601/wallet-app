import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../../constants/colors";
// Import style dùng chung từ màn hình Create
import { styles } from "../../assets/styles/create.styles";

export default function EditProfileScreen() {
  const { user } = useUser();
  const router = useRouter();

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.unsafeMetadata?.phone || "");
  const [selectedImage, setSelectedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "We need access to your photos to set your profile picture.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        setSelectedImage(result.assets[0]);
      }
    } catch (error) {
      Alert.alert("Error", "Could not open photo library.");
    }
  };

  const handleSave = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert("Error", "Please enter your first and last name.");
      return;
    }

    setIsLoading(true);
    try {
      await user.update({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        unsafeMetadata: {
          ...user.unsafeMetadata,
          phone: phone.trim(),
        },
      });

      if (selectedImage?.base64) {
        await user.setProfileImage({
          file: `data:${selectedImage.mimeType || "image/jpeg"};base64,${selectedImage.base64}`,
        });
      }

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert("Error", "Could not update profile.");
    } finally {
      setIsLoading(false);
    }
  };

  const avatarSource = selectedImage
    ? { uri: selectedImage.uri }
    : user?.imageUrl
    ? { uri: user.imageUrl }
    : require("../../assets/images/logo.png");

  return (
    <View style={styles.container}>
      {/* HEADER - Sử dụng đúng cấu trúc của CreateScreen */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity
          style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <Text style={styles.saveButton}>{isLoading ? "Saving..." : "Save"}</Text>
          {!isLoading && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          {/* AVATAR SECTION - Tận dụng container của card để bọc */}
          <View style={{ alignItems: "center", marginBottom: 30 }}>
            <View style={{ position: "relative" }}>
              <Image 
                source={avatarSource} 
                style={{ width: 100, height: 100, borderRadius: 50, borderWidth: 2, borderColor: COLORS.primary }} 
              />
              <TouchableOpacity 
                onPress={handlePickImage}
                style={{ 
                  position: "absolute", bottom: 0, right: 0, 
                  backgroundColor: COLORS.primary, borderRadius: 15, padding: 6 
                }}
              >
                <Ionicons name="camera" size={18} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          </View>

          {/* INPUTS - Sử dụng các class input của CreateScreen */}
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor={COLORS.textLight}
              value={firstName}
              onChangeText={setFirstName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor={COLORS.textLight}
              value={lastName}
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons name="call-outline" size={22} color={COLORS.textLight} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.textLight}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </ScrollView>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
}