

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@clerk/clerk-expo";
import { useHeaderHeight } from '@react-navigation/elements'; 

import { COLORS } from "../../constants/colors";
import { API_URL } from "../../constants/api";
import SafeScreen from "../../components/SafeScreen";
import { useLanguage } from "../context/LanguageContext";

export default function ChatAIScreen() {
  const { user } = useUser();
  const { i18n } = useLanguage();
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const flatListRef = useRef(null);
  const headerHeight = useHeaderHeight(); // Lấy chiều cao header thực tế

  // Dữ liệu mẫu ban đầu
  const [messages, setMessages] = useState([
    {
      id: "1",
      text: i18n.chat_ai_greeting.replace("{name}", user?.firstName || "bạn"),
      sender: "ai",
      timestamp: new Date(),
    },
  ]);

  // Các câu hỏi gợi ý
  const suggestions = [
    "Phân tích chi tiêu tháng này",
    "Làm sao để tiết kiệm hơn?",
    "Tổng thu nhập hiện tại?",
    "Đặt hạn mức chi tiêu",
  ];

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (flatListRef.current) {
      setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const handleSend = async (text = inputText) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text.trim(),
          userId: user.id,
        }),
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        // Nếu server trả về HTML (lỗi 404/500), đọc text để debug thay vì crash
        const text = await response.text();
        console.error("Chat API Error (Non-JSON response):", text);
        throw new Error("Server returned invalid format (HTML instead of JSON)");
      }

      const aiResponse = {
        id: (Date.now() + 1).toString(),
        text: data.text || "Xin lỗi, tôi không thể trả lời ngay lúc này.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorResponse = {
        id: (Date.now() + 1).toString(),
        text: "Có lỗi xảy ra khi kết nối với máy chủ.",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageItem = ({ item }) => {
    const isUser = item.sender === "user";
    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.aiBubble,
        ]}
      >
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color="#FFF" />
          </View>
        )}
        <View
          style={[
            styles.messageContent,
            isUser ? styles.userMessageContent : styles.aiMessageContent,
          ]}
        >
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeScreen>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        // Bù trừ khoảng cách dựa trên Header và một chút padding cho tai thỏ
        keyboardVerticalOffset={Platform.OS === "ios" ? headerHeight + 30 : 0}
      >
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>{i18n.tab_chat}</Text>
            <Text style={styles.headerSubtitle}>{i18n.chat_subtitle}</Text>
          </View>

          {/* MESSAGE LIST */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.listContent}
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.loadingText}>{i18n.chat_loading}</Text>
                </View>
              ) : null
            }
          />

          {/* SUGGESTIONS (Chỉ hiện khi ít tin nhắn) */}
          {messages.length < 3 && !isLoading && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionTitle}>{i18n.chat_suggestion_title}</Text>
              <View style={styles.suggestionList}>
                {suggestions.map((s, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => handleSend(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* INPUT AREA WRAPPER - Thêm bọc này để kiểm soát vị trí trên iOS */}
          <View style={styles.bottomWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder={i18n.chat_placeholder}
                placeholderTextColor={COLORS.textLight}
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={() => handleSend()}
                disabled={!inputText.trim() || isLoading}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  
  header: { paddingHorizontal: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: COLORS.text },
  headerSubtitle: { fontSize: 14, color: COLORS.textLight },

  listContent: { padding: 20, paddingBottom: 10 },
  
  messageBubble: { flexDirection: "row", marginBottom: 16, alignItems: "flex-end" },
  userBubble: { justifyContent: "flex-end" },
  aiBubble: { justifyContent: "flex-start" },

  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    marginRight: 8,
  },

  messageContent: { maxWidth: "80%", padding: 12, borderRadius: 20 },
  userMessageContent: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  aiMessageContent: { backgroundColor: "#FFF", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: "#E5E7EB" },

  messageText: { fontSize: 15, lineHeight: 22 },
  userText: { color: "#FFF" },
  aiText: { color: COLORS.text },

  loadingContainer: { flexDirection: "row", alignItems: "center", marginLeft: 40, marginBottom: 20 },
  loadingText: { marginLeft: 8, color: COLORS.textLight, fontSize: 12 },

  suggestionsContainer: { paddingHorizontal: 20, marginBottom: 10 },
  suggestionTitle: { fontSize: 12, color: COLORS.textLight, marginBottom: 8, fontWeight: "600" },
  suggestionList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: { backgroundColor: "#FFF", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, borderColor: "#E5E7EB" },
  suggestionText: { fontSize: 13, color: COLORS.text },

  // Style bọc ngoài cùng của phần input
  bottomWrapper: {
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    // Đảm bảo không bị lút dưới bàn phím trên iOS
    paddingBottom: Platform.OS === "ios" ? 15 : 0, 
  },
  inputContainer: {
    flexDirection: "row", alignItems: "center",
    padding: 12, paddingHorizontal: 16,
  },
  input: { flex: 1, backgroundColor: "#F9FAFB", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: COLORS.text, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginLeft: 10 },
  sendButtonDisabled: { backgroundColor: "#D1D5DB" },
});