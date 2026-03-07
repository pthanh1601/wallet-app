import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useUser } from "@clerk/clerk-expo";
import { format, parseISO } from "date-fns";
import { Ionicons } from "@expo/vector-icons";

import { COLORS } from "../../constants/colors";
import SafeScreen from "../../components/SafeScreen";
import { useTransactions } from "../../hooks/useTransactions";
import { TransactionItem } from "../../components/TransactionItem";
import { useFocusEffect } from "expo-router";
import { useLanguage } from "../context/LanguageContext";

// --- 1. Cấu hình Locale tập trung ---
LocaleConfig.locales['vi'] = {
  monthNames: ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'],
  monthNamesShort: ['Th.1','Th.2','Th.3','Th.4','Th.5','Th.6','Th.7','Th.8','Th.9','Th.10','Th.11','Th.12'],
  dayNames: ['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'],
  dayNamesShort: ['CN','T2','T3','T4','T5','T6','T7'],
  today: "Hôm nay"
};

LocaleConfig.locales['en'] = {
  monthNames: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  monthNamesShort: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  dayNames: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  dayNamesShort: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  today: "Today"
};

// Thiết lập mặc định để tránh lỗi 'undefined' khi khởi tạo
LocaleConfig.defaultLocale = 'en';

const formatCompactNumber = (number) => {
  if (!number) return "0";
  if (number >= 1000000) return (number / 1000000).toFixed(1) + "M";
  if (number >= 1000) return (number / 1000).toFixed(0) + "k";
  return number.toFixed(0);
};

export default function CalendarScreen() {
  const { user } = useUser();
  const { transactions, loadData, deleteTransaction } = useTransactions(user?.id);
  const { i18n, language } = useLanguage();
  
  const today = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);
  const [selectedDate, setSelectedDate] = useState(today);

  // --- 2. Xử lý đổi ngôn ngữ an toàn ---
  useEffect(() => {
    // Chỉ set khi language có giá trị hợp lệ
    if (language && LocaleConfig.locales[language]) {
      LocaleConfig.defaultLocale = language;
    } else {
      LocaleConfig.defaultLocale = 'en';
    }
  }, [language]);

  useFocusEffect(
    useCallback(() => {
      if (user?.id) loadData();
    }, [loadData, user?.id])
  );

  const dailyData = useMemo(() => {
    const data = {};
    const validTransactions = Array.isArray(transactions) ? transactions : [];
    
    validTransactions.forEach((t) => {
      if (!t.created_at) return;
      const dateKey = t.created_at.split("T")[0];
      
      if (!data[dateKey]) {
        data[dateKey] = { income: 0, expense: 0, items: [] };
      }

      const amount = parseFloat(t.amount || 0);
      if (amount > 0) {
        data[dateKey].income += amount;
      } else {
        data[dateKey].expense += Math.abs(amount);
      }
      data[dateKey].items.push(t);
    });
    return data;
  }, [transactions]);

  // --- 3. Render Day với kiểm tra an toàn ---
  const renderDay = useCallback(({ date, state }) => {
    if (!date) return null;
    
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
        
        <View style={styles.dotContainer}>
          {dayData?.income > 0 && (
            <Text style={styles.incomeText} numberOfLines={1}>
              +{formatCompactNumber(dayData.income)}
            </Text>
          )}
          {dayData?.expense > 0 && (
            <Text style={styles.expenseText} numberOfLines={1}>
              -{formatCompactNumber(dayData.expense)}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [dailyData, selectedDate, today]);

  const selectedTransactions = dailyData[selectedDate]?.items || [];

  return (
    <SafeScreen>
      <View style={styles.container}>
        <View style={styles.calendarWrapper}>
          {/* Calendar có Key để buộc re-render khi ngôn ngữ thay đổi */}
          <Calendar
            key={`calendar-${language}`} 
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

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {i18n.transactions_for || "Transactions for"} {selectedDate}
          </Text>
        </View>

        <FlatList
          data={selectedTransactions}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TransactionItem item={item} onDelete={deleteTransaction} />
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>{i18n.no_transactions_day}</Text>
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
    elevation: 3,
  },
  dayContainer: { alignItems: "center", width: 45, height: 50, borderRadius: 10, paddingTop: 4 },
  selectedDayContainer: { backgroundColor: COLORS.primary },
  todayContainer: { borderWidth: 1, borderColor: COLORS.primary },
  dayText: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  selectedDayText: { color: "#FFF" },
  disabledText: { color: "#D1D5DB" },
  dotContainer: { marginTop: 1, alignItems: 'center' },
  incomeText: { fontSize: 7, color: "#22C55E", fontWeight: "700" },
  expenseText: { fontSize: 7, color: "#EF4444", fontWeight: "700" },
  listHeader: { paddingHorizontal: 20, marginBottom: 10 },
  listTitle: { fontSize: 16, fontWeight: "bold", color: COLORS.text },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyState: { alignItems: "center", marginTop: 40 },
  emptyText: { color: COLORS.textLight, fontSize: 14 },
});