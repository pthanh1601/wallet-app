import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../assets/styles/home.styles";
import { COLORS } from "../constants/colors";
import { formatDate } from "../lib/utils";
import { useLanguage } from "../app/context/LanguageContext";

// Map categories to their respective icons
const CATEGORY_ICONS = {
  "Food & Drinks": "fast-food",
  Shopping: "cart",
  Transportation: "car",
  Entertainment: "film",
  Bills: "receipt",
  Income: "cash",
  Other: "ellipsis-horizontal",
};

// Map category names to i18n keys
const CATEGORY_KEYS = {
  "Food & Drinks": "cat_food",
  "Shopping": "cat_shopping",
  "Transportation": "cat_transport",
  "Entertainment": "cat_entertainment",
  "Bills": "cat_bills",
  "Income": "cat_income",
  "Other": "cat_other",
};

export const TransactionItem = ({ item, onDelete }) => {
  const router = useRouter();
  const { i18n } = useLanguage();
  const isIncome = parseFloat(item.amount) > 0;
  const iconName = CATEGORY_ICONS[item.category] || "pricetag-outline";
  const categoryName = CATEGORY_KEYS[item.category] ? i18n[CATEGORY_KEYS[item.category]] : item.category;

  return (
    <View style={styles.transactionCard} key={item.id}>
      <TouchableOpacity
        style={styles.transactionContent}
        onPress={() =>
          router.push({
            pathname: "/create",
            params: {
              id: item.id,
              title: item.title,
              amount: item.amount,
              category: item.category,
            },
          })
        }
      >
        <View style={styles.categoryIconContainer}>
          <Ionicons name={iconName} size={22} color={isIncome ? COLORS.income : COLORS.expense} />
        </View>
        <View style={styles.transactionLeft}>
          <Text style={styles.transactionTitle}>{item.title}</Text>
          <Text style={styles.transactionCategory}>{categoryName}</Text>
        </View>
        <View style={styles.transactionRight}>
          <Text
            style={[styles.transactionAmount, { color: isIncome ? COLORS.income : COLORS.expense }]}
          >
            {isIncome ? "+" : "-"}${Math.abs(parseFloat(item.amount)).toFixed(2)}
          </Text>
          <Text style={styles.transactionDate}>{formatDate(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(item.id)}>
        <Ionicons name="trash-outline" size={20} color={COLORS.expense} />
      </TouchableOpacity>
    </View>
  );
};
