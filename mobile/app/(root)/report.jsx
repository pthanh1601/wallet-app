import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from "react-native";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState, useMemo } from "react";
import { useFocusEffect } from "expo-router";
import { PieChart } from "react-native-gifted-charts";

import { COLORS } from "../../constants/colors";
import SafeScreen from "../../components/SafeScreen";
import { useTransactions } from "../../hooks/useTransactions";
import { useLanguage } from "../context/LanguageContext";

// Helper để lấy màu và icon cho từng danh mục
const getCategoryConfig = (categoryName) => {
  const configs = {
    "Food & Drinks": { color: "#F59E0B", icon: "fast-food" },
    "Shopping": { color: "#3B82F6", icon: "cart" },
    "Transportation": { color: "#EF4444", icon: "car" },
    "Entertainment": { color: "#8B5CF6", icon: "film" },
    "Bills": { color: "#10B981", icon: "receipt" },
    "Income": { color: "#22C55E", icon: "cash" },
    "Other": { color: "#6B7280", icon: "ellipsis-horizontal" },
  };
  return configs[categoryName] || { color: COLORS.primary, icon: "pricetag" };
};

export default function ReportScreen() {
  const { user } = useUser();
  const { transactions, summary, isLoading, loadData } = useTransactions(user.id);
  const { i18n } = useLanguage();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Load lại dữ liệu khi vào màn hình
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
    setSelectedCategory(null);
  };

  // Tính toán dữ liệu chi tiêu theo danh mục
  // const categoryStats = useMemo(() => {
  //   const expenses = transactions.filter((t) => parseFloat(t.amount) < 0);
  //   const totalExpense = Math.abs(parseFloat(summary.expenses)) || 1; // Tránh chia cho 0
  const categoryStats = useMemo(() => {
    // Kiểm tra an toàn để tránh lỗi "filter of undefined"
    const validTransactions = Array.isArray(transactions) ? transactions : [];
    const expenses = validTransactions.filter((t) => parseFloat(t.amount || 0) < 0);

    // Kiểm tra an toàn cho summary
    const totalExpense = Math.abs(parseFloat(summary?.expenses || 0)) || 1;
    const stats = {};

    expenses.forEach((t) => {
      const amount = Math.abs(parseFloat(t.amount));
      if (stats[t.category]) {
        stats[t.category] += amount;
      } else {
        stats[t.category] = amount;
      }
    });

    // Chuyển object thành array và sắp xếp giảm dần
    return Object.keys(stats)
      .map((key) => ({
        name: key,
        amount: stats[key],
        percentage: (stats[key] / totalExpense) * 100,
        ...getCategoryConfig(key),
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions, summary]);

  // Dữ liệu cho biểu đồ tròn
  const pieData = useMemo(() => {
    return categoryStats.map((item) => ({
      value: item.amount,
      color: item.color,
      focused: selectedCategory?.name === item.name,
      onPress: () => setSelectedCategory(selectedCategory?.name === item.name ? null : item),
    }));
  }, [categoryStats, selectedCategory]);

  if (isLoading && !refreshing) {
    return (
      <SafeScreen>
        <View style={[styles.container, { justifyContent: "center" }]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{i18n.financial_report}</Text>
          <Text style={styles.headerSubtitle}>{i18n.overview}</Text>
        </View>

        {/* SUMMARY CARDS */}
        <View style={styles.summaryContainer}>
          <View style={[styles.summaryCard, { backgroundColor: "#DCFCE7" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "#22C55E" }]}>
              <Ionicons name="arrow-down" size={18} color="#FFF" />
            </View>
            <Text style={styles.summaryLabel}>{i18n.income}</Text>
            <Text style={[styles.summaryAmount, { color: "#15803D" }]}>
              ${parseFloat(summary.income).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: "#FEE2E2" }]}>
            <View style={[styles.iconCircle, { backgroundColor: "#EF4444" }]}>
              <Ionicons name="arrow-up" size={18} color="#FFF" />
            </View>
            <Text style={styles.summaryLabel}>{i18n.expense}</Text>
            <Text style={[styles.summaryAmount, { color: "#B91C1C" }]}>
              ${Math.abs(parseFloat(summary.expenses)).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* NET BALANCE */}
        <View style={styles.balanceBlock}>
          <Text style={styles.balanceLabel}>{i18n.net_balance}</Text>
          <Text style={styles.balanceValue}>${parseFloat(summary.balance).toFixed(2)}</Text>
        </View>

        {/* CHART SECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.expense_analysis}</Text>
          {pieData.length > 0 ? (
            <View style={styles.chartContainer}>
              <PieChart
                data={pieData}
                donut
                showGradient
                sectionAutoFocus
                focusOnPress
                radius={120}
                innerRadius={80}
                innerCircleColor={"#F2F4F7"}
                backgroundColor="transparent"
                centerLabelComponent={() => {
                  return (
                    <View style={{ justifyContent: "center", alignItems: "center" }}>
                      <Text style={{ fontSize: 22, color: COLORS.text, fontWeight: "bold" }}>
                        ${(selectedCategory ? selectedCategory.amount : Math.abs(parseFloat(summary.expenses))).toFixed(0)}
                      </Text>
                      <Text style={{ fontSize: 14, color: COLORS.textLight }}>
                        {selectedCategory ? selectedCategory.name : i18n.total}
                      </Text>
                    </View>
                  );
                }}
              />
            </View>
          ) : null}
        </View>

        {/* SPENDING BREAKDOWN */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{i18n.spending_breakdown}</Text>

          {categoryStats.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{i18n.no_expenses}</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {categoryStats.map((item, index) => (
                <View key={index} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryIcon, { backgroundColor: item.color + "20" }]}>
                        <Ionicons name={item.icon} size={18} color={item.color} />
                      </View>
                      <Text style={styles.categoryName}>{item.name}</Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>-${item.amount.toFixed(2)}</Text>
                      <Text style={styles.categoryPercent}>{item.percentage.toFixed(1)}%</Text>
                    </View>
                  </View>
                  {/* Progress Bar */}
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${item.percentage}%`, backgroundColor: item.color }
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F7", paddingHorizontal: 20 },

  header: { marginTop: 20, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: COLORS.text },
  headerSubtitle: { fontSize: 14, color: COLORS.textLight, marginTop: 5 },

  summaryContainer: { flexDirection: "row", justifyContent: "space-between", gap: 15, marginBottom: 15 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 20, alignItems: "flex-start" },
  iconCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  summaryLabel: { fontSize: 13, fontWeight: "600", color: COLORS.textLight, marginBottom: 4 },
  summaryAmount: { fontSize: 18, fontWeight: "bold" },

  balanceBlock: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: "500" },
  balanceValue: { color: "#FFF", fontSize: 24, fontWeight: "bold" },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.text, marginBottom: 15 },

  listContainer: { backgroundColor: "#FFF", borderRadius: 20, padding: 20 },
  categoryItem: { marginBottom: 20 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  categoryLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  categoryIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  categoryName: { fontSize: 15, fontWeight: "600", color: COLORS.text },

  categoryRight: { alignItems: "flex-end" },
  categoryAmount: { fontSize: 15, fontWeight: "bold", color: COLORS.text },
  categoryPercent: { fontSize: 12, color: COLORS.textLight },

  progressBarBg: { height: 6, backgroundColor: "#F3F4F6", borderRadius: 3, overflow: "hidden" },
  progressBarFill: { height: "100%", borderRadius: 3 },

  emptyState: { alignItems: "center", padding: 20 },
  emptyText: { color: COLORS.textLight, fontSize: 14 },

  chartContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
});