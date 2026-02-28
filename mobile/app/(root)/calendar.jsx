import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useState, useMemo, useCallback } from "react";
import { useUser } from "@clerk/clerk-expo";
import { format } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../constants/colors";
import SafeScreen from "../../components/SafeScreen";
import { useTransactions } from "../../hooks/useTransactions";
import { TransactionItem } from "../../components/TransactionItem";
import { useFocusEffect } from "expo-router";

// Cấu hình lịch (nếu muốn tiếng Việt thì bỏ comment phần dưới)
LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'],
  dayNames: ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: "Hôm nay"
};
LocaleConfig.defaultLocale = 'vi';

// Helper format tiền gọn (ví dụ: 1000 -> 1k) để vừa ô lịch
const formatCompactNumber = (number) => {
  if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
  if (number >= 1000) return (number / 1000).toFixed(0) + "k";
  return number.toFixed(0);
};

export default function CalendarScreen() {
  const { user } = useUser();
  const { transactions, loadData, deleteTransaction } = useTransactions(user.id);
  
  // Mặc định chọn ngày hôm nay
  const today = format(new Date(), "yyyy-MM-dd");
  const [selectedDate, setSelectedDate] = useState(today);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 1. Nhóm giao dịch theo ngày
  const dailyData = useMemo(() => {
    const data = {};
    
    transactions.forEach((t) => {
      // Giả sử created_at là chuỗi ISO hoặc Date object
      const dateKey = t.created_at.split("T")[0]; // Lấy phần YYYY-MM-DD
      
      if (!data[dateKey]) {
        data[dateKey] = { income: 0, expense: 0, items: [] };
      }

      const amount = parseFloat(t.amount);
      if (amount > 0) {
        data[dateKey].income += amount;
      } else {
        data[dateKey].expense += Math.abs(amount);
      }
      
      data[dateKey].items.push(t);
    });
    return data;
  }, [transactions]);

  // 2. Component hiển thị từng ngày trên lịch
  const renderDay = ({ date, state }) => {
    const dateStr = date.dateString;
    const dayData = dailyData[dateStr];
    const isSelected = dateStr === selectedDate;
    const isToday = dateStr === today;

    return (
      <TouchableOpacity
        style={[
          styles.dayContainer,
          isSelected && styles.selectedDayContainer,
          isToday && !isSelected && styles.todayContainer,
        ]}
        onPress={() => setSelectedDate(dateStr)}
      >
        <Text style={[
          styles.dayText, 
          isSelected && styles.selectedDayText,
          state === 'disabled' && styles.disabledText
        ]}>
          {date.day}
        </Text>
        
        {/* Hiển thị chấm thu/chi hoặc số tiền nhỏ */}
        <View style={styles.dotContainer}>
          {dayData?.income > 0 && (
            <Text style={styles.incomeText}>+{formatCompactNumber(dayData.income)}</Text>
          )}
          {dayData?.expense > 0 && (
            <Text style={styles.expenseText}>-{formatCompactNumber(dayData.expense)}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Lấy danh sách giao dịch của ngày đang chọn
  const selectedTransactions = dailyData[selectedDate]?.items || [];

  return (
    <SafeScreen>
      <View style={styles.container}>
        {/* CALENDAR */}
        <View style={styles.calendarWrapper}>
          <Calendar
            current={today}
            dayComponent={renderDay}
            theme={{
              calendarBackground: 'transparent',
              textSectionTitleColor: COLORS.textLight,
              arrowColor: COLORS.primary,
              monthTextColor: COLORS.text,
              textMonthFontWeight: 'bold',
              textMonthFontSize: 18,
            }}
            enableSwipeMonths={true}
          />
        </View>

        {/* TRANSACTION LIST HEADER */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Transactions for {format(new Date(selectedDate), "MMM dd, yyyy")}
          </Text>
        </View>

        {/* LIST */}
        <FlatList
          data={selectedTransactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TransactionItem item={item} onDelete={deleteTransaction} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No transactions on this day</Text>
            </View>
          }
        />
      </View>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F4F7" },
  
  calendarWrapper: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    margin: 16,
    paddingBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },

  // Day Component Styles
  dayContainer: { alignItems: "center", justifyContent: "flex-start", width: 48, height: 48, borderRadius: 12, paddingTop: 6 },
  selectedDayContainer: { backgroundColor: COLORS.primary },
  todayContainer: { borderWidth: 1, borderColor: COLORS.primary },
  
  dayText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  selectedDayText: { color: "#FFF" },
  disabledText: { color: "#D1D5DB" },

  dotContainer: { marginTop: 2, alignItems: 'center' },
  incomeText: { fontSize: 8, color: COLORS.income, fontWeight: "700" },
  expenseText: { fontSize: 8, color: COLORS.expense, fontWeight: "700" },

  // List Styles
  listHeader: { paddingHorizontal: 20, marginBottom: 10 },
  listTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: COLORS.textLight, fontSize: 14 },
});
