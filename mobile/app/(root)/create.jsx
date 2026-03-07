import {
  View,
  Text,
  Alert,
  TouchableOpacity,
  TextInput,
  ActivityIndicatorBase,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useUser } from "@clerk/clerk-expo";
import { useState, useEffect } from "react";
import { API_URL } from "../../constants/api";
import { styles } from "../../assets/styles/create.styles";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../context/LanguageContext";

const CATEGORIES = [
  { id: "food", name: "Food & Drinks", icon: "fast-food", i18nKey: "cat_food" },
  { id: "shopping", name: "Shopping", icon: "cart", i18nKey: "cat_shopping" },
  { id: "transportation", name: "Transportation", icon: "car", i18nKey: "cat_transport" },
  { id: "entertainment", name: "Entertainment", icon: "film", i18nKey: "cat_entertainment" },
  { id: "bills", name: "Bills", icon: "receipt", i18nKey: "cat_bills" },
  { id: "income", name: "Income", icon: "cash", i18nKey: "cat_income" },
  { id: "other", name: "Other", icon: "ellipsis-horizontal", i18nKey: "cat_other" },
];

const CreateScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const params = useLocalSearchParams();
  const { i18n } = useLanguage();
  const isEditing = !!params.id;

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setTitle(params.title);
      const val = parseFloat(params.amount);
      setAmount(Math.abs(val).toString());
      setIsExpense(val < 0);
      setSelectedCategory(params.category);
    }
  }, [params.id]); // Chỉ chạy lại khi ID thay đổi, tránh reset form khi đang gõ

  const handleCreate = async () => {
    // validations
    if (!title.trim()) return Alert.alert(i18n.error, i18n.enter_title);
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert(i18n.error, i18n.enter_amount);
      return;
    }

    if (!selectedCategory) return Alert.alert(i18n.error, i18n.select_category);

    setIsLoading(true);
    try {
      // Format the amount (negative for expenses, positive for income)
      const formattedAmount = isExpense
        ? -Math.abs(parseFloat(amount))
        : Math.abs(parseFloat(amount));

      const url = isEditing ? `${API_URL}/transactions/${params.id}` : `${API_URL}/transactions`;
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: user.id,
          title,
          amount: formattedAmount,
          category: selectedCategory,
        }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create transaction");
        } else {
          const text = await response.text();
          throw new Error(`Server Error: ${text}`);
        }
      }

      Alert.alert(
        i18n.success,
        isEditing ? i18n.transaction_updated_successfully : i18n.transaction_created_successfully
      );
      router.back();
    } catch (error) {
      Alert.alert(i18n.error, error.message || i18n.transaction_failed);
      console.error("Error creating transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditing ? i18n.edit_transaction : i18n.new_transaction}
        </Text>
        <TouchableOpacity
          style={[styles.saveButtonContainer, isLoading && styles.saveButtonDisabled]}
          onPress={handleCreate}
          disabled={isLoading}
        >
          <Text style={styles.saveButton}>{isLoading ? i18n.saving : isEditing ? i18n.update : i18n.save}</Text>
          {!isLoading && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.typeSelector}>
          {/* EXPENSE SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(true)}
          >
            <Ionicons
              name="arrow-down-circle"
              size={22}
              color={isExpense ? COLORS.white : COLORS.expense}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, isExpense && styles.typeButtonTextActive]}>
              {i18n.expense}
            </Text>
          </TouchableOpacity>

          {/* INCOME SELECTOR */}
          <TouchableOpacity
            style={[styles.typeButton, !isExpense && styles.typeButtonActive]}
            onPress={() => setIsExpense(false)}
          >
            <Ionicons
              name="arrow-up-circle"
              size={22}
              color={!isExpense ? COLORS.white : COLORS.income}
              style={styles.typeIcon}
            />
            <Text style={[styles.typeButtonText, !isExpense && styles.typeButtonTextActive]}>
              {i18n.income}
            </Text>
          </TouchableOpacity>
        </View>

        {/* AMOUNT CONTAINER */}
        <View style={styles.amountContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0.00"
            placeholderTextColor={COLORS.textLight}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
          />
        </View>

        {/* INPUT CONTAINER */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="create-outline"
            size={22}
            color={COLORS.textLight}
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder={i18n.transaction_title}
            placeholderTextColor={COLORS.textLight}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* TITLE */}
        <Text style={styles.sectionTitle}>
          <Ionicons name="pricetag-outline" size={16} color={COLORS.text} /> {i18n.category}
        </Text>

        <View style={styles.categoryGrid}>
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.name && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.name)}
            >
              <Ionicons
                name={category.icon}
                size={20}
                color={selectedCategory === category.name ? COLORS.white : COLORS.text}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category.name && styles.categoryButtonTextActive,
                ]}
              >
                {i18n[category.i18nKey]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
    </View>
  );
};
export default CreateScreen;
