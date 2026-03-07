import { SignedIn, SignedOut, useUser } from "@clerk/clerk-expo";
import { Link, useRouter, useFocusEffect } from "expo-router";
import { Alert, FlatList, Image, RefreshControl, Text, TouchableOpacity, View, TextInput } from "react-native";
import { SignOutButton } from "@/components/SignOutButton";
import { useTransactions } from "../../hooks/useTransactions";
import { useEffect, useState, useCallback } from "react";
import PageLoader from "../../components/PageLoader";
import { styles } from "../../assets/styles/home.styles";
import { Ionicons } from "@expo/vector-icons";
import { BalanceCard } from "../../components/BalanceCard";
import { TransactionItem } from "../../components/TransactionItem";
import NoTransactionsFound from "../../components/NoTransactionsFound";
import { COLORS } from "../../constants/colors";
import { useLanguage } from "../context/LanguageContext";

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // 1. State lưu từ khóa tìm kiếm

  const { i18n } = useLanguage();
  const { transactions, summary, isLoading, loadData, deleteTransaction } = useTransactions(
    user.id
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Dùng useFocusEffect để load lại dữ liệu mỗi khi màn hình được focus (quay lại từ màn hình khác)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // 2. Logic lọc giao dịch theo tên
const filteredTransactions = Array.isArray(transactions) 
  ? transactions.filter((item) => item.title?.toLowerCase().includes(searchQuery.toLowerCase()))
  : [];

  const handleDelete = (id) => {
    Alert.alert(i18n.delete_confirm_title, i18n.delete_confirm_msg, [
      { text: i18n.cancel, style: "cancel" },
      { text: i18n.delete, style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  };

  if (isLoading && !refreshing) return <PageLoader />;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* HEADER */}
        <View style={styles.header}>
          {/* LEFT */}
          <View style={styles.headerLeft}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.welcomeContainer}>
              <Text style={styles.welcomeText}>{i18n.welcome},</Text>
              <Text style={styles.usernameText}>
                {user?.firstName ? `${user.firstName} ${user.lastName || ""}` : user?.emailAddresses[0]?.emailAddress.split("@")[0]}
              </Text>
            </View>
          </View>
          {/* RIGHT */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.addButton} onPress={() => router.push("/create")}>
              <Ionicons name="add" size={20} color="#FFF" />
              <Text style={styles.addButtonText}>{i18n.add}</Text>
            </TouchableOpacity>
            <SignOutButton />
          </View>
        </View>

        <BalanceCard summary={summary} i18n={i18n} />

        {/* 3. Giao diện thanh tìm kiếm */}
        <View style={{ 
          // marginTop: 20, 
          flexDirection: "row", 
          alignItems: "center", 
          backgroundColor: "#FFF", 
          borderRadius: 12, 
          paddingHorizontal: 12, 
          height: 50,
          borderWidth: 1,
          borderColor: "#F0F0F0",
          marginBottom:20,
        }}>
          <Ionicons name="search" size={20} color={COLORS.textLight} />
          <TextInput 
            style={{ flex: 1, marginLeft: 10, fontSize: 16, color: COLORS.text }}
            placeholder={i18n.search_placeholder}
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color={COLORS.textLight} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.transactionsHeaderContainer}>
          <Text style={styles.sectionTitle}>{i18n.recent_transactions}</Text>
        </View>
      </View>

      {/* FlatList is a performant way to render long lists in React Native. */}
      {/* it renders items lazily — only those on the screen. */}
      <FlatList
        style={styles.transactionsList}
        contentContainerStyle={styles.transactionsListContent}
        data={filteredTransactions} // 4. Truyền danh sách đã lọc vào đây
        renderItem={({ item }) => <TransactionItem item={item} onDelete={handleDelete} i18n={i18n} />}
        ListEmptyComponent={<NoTransactionsFound />}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      />
    </View>
  );
}
