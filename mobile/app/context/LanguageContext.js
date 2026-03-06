import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Từ điển ngôn ngữ
export const translations = {
  en: {
    // Tabs
    tab_home: "Home",
    tab_calendar: "Calendar",
    tab_report: "Report",
    tab_chat: "Chat AI",
    tab_profile: "Profile",
    
    // Home
    welcome: "Welcome",
    search_placeholder: "Search transactions...",
    recent_transactions: "Recent Transactions",
    add: "Add",
    
    // Report
    financial_report: "Financial Report",
    overview: "Overview of your finances",
    income: "Income",
    expense: "Expense",
    net_balance: "Net Balance",
    spending_breakdown: "Spending Breakdown",
    expense_analysis: "Expense Analysis",
    total: "Total",
    no_expenses: "No expenses recorded yet.",
    
    // Calendar
    transactions_for: "Transactions for",
    no_transactions_day: "No transactions on this day",
    
    // Profile
    account: "Account",
    personal_info: "Personal Info",
    face_id: "FaceID Login",
    general: "General",
    notifications: "Notifications",
    dark_mode: "Dark Mode",
    language: "Language",
    select_language: "Select Language",
    support: "Support",
    help_center: "Help Center",
    privacy_policy: "Privacy Policy",
    logout: "Log Out",
    logout_confirm_title: "Logout",
    logout_confirm_msg: "Are you sure you want to logout?",
    cancel: "Cancel",
    version: "Version",
    
    // Chat AI
    chat_subtitle: "Smart financial assistant",
    chat_suggestion_title: "Suggested questions:",
    chat_placeholder: "Ask me about your finances...",
    chat_ai_greeting: "Hello {name}! I am your AI financial assistant. How can I help you today?",
    chat_loading: "AI is typing...",

    // Create/Edit
    new_transaction: "New Transaction",
    edit_transaction: "Edit Transaction",
    save: "Save",
    update: "Update",
    saving: "Saving...",
    transaction_title: "Transaction Title",
    category: "Category",
    error: "Error",
    success: "Success",
    enter_title: "Please enter a transaction title",
    enter_amount: "Please enter a valid amount",
    select_category: "Please select a category",
    
    // Categories
    cat_food: "Food & Drinks",
    cat_shopping: "Shopping",
    cat_transport: "Transportation",
    cat_entertainment: "Entertainment",
    cat_bills: "Bills",
    cat_income: "Income",
    cat_other: "Other",
  },
  vi: {
    // Tabs
    tab_home: "Trang chủ",
    tab_calendar: "Lịch",
    tab_report: "Báo cáo",
    tab_chat: "Chat AI",
    tab_profile: "Cá nhân",
    
    // Home
    welcome: "Xin chào",
    search_placeholder: "Tìm kiếm giao dịch...",
    recent_transactions: "Giao dịch gần đây",
    add: "Thêm",
    
    // Report
    financial_report: "Báo cáo tài chính",
    overview: "Tổng quan tài chính của bạn",
    income: "Thu nhập",
    expense: "Chi tiêu",
    net_balance: "Số dư thực tế",
    spending_breakdown: "Chi tiết chi tiêu",
    expense_analysis: "Phân tích chi tiêu",
    total: "Tổng",
    no_expenses: "Chưa có chi tiêu nào được ghi nhận.",
    
    // Calendar
    transactions_for: "Giao dịch ngày",
    no_transactions_day: "Không có giao dịch nào trong ngày này",
    
    // Profile
    account: "Tài khoản",
    personal_info: "Thông tin cá nhân",
    face_id: "Đăng nhập FaceID",
    general: "Cài đặt chung",
    notifications: "Thông báo",
    dark_mode: "Chế độ tối",
    language: "Ngôn ngữ",
    select_language: "Chọn ngôn ngữ",
    support: "Hỗ trợ",
    help_center: "Trung tâm trợ giúp",
    privacy_policy: "Chính sách bảo mật",
    logout: "Đăng xuất",
    logout_confirm_title: "Đăng xuất",
    logout_confirm_msg: "Bạn có chắc chắn muốn đăng xuất?",
    cancel: "Hủy",
    version: "Phiên bản",
    
    // Chat AI
    chat_subtitle: "Trợ lý tài chính thông minh",
    chat_suggestion_title: "Gợi ý câu hỏi:",
    chat_placeholder: "Hỏi tôi về tài chính của bạn...",
    chat_ai_greeting: "Xin chào {name}! Tôi là trợ lý tài chính AI. Tôi có thể giúp gì cho bạn hôm nay?",
    chat_loading: "AI đang trả lời...",

    // Create/Edit
    new_transaction: "Giao dịch mới",
    edit_transaction: "Sửa giao dịch",
    save: "Lưu",
    update: "Cập nhật",
    saving: "Đang lưu...",
    transaction_title: "Tên giao dịch",
    category: "Danh mục",
    error: "Lỗi",
    success: "Thành công",
    enter_title: "Vui lòng nhập tên giao dịch",
    enter_amount: "Vui lòng nhập số tiền hợp lệ",
    select_category: "Vui lòng chọn danh mục",
    
    // Categories
    cat_food: "Ăn uống",
    cat_shopping: "Mua sắm",
    cat_transport: "Di chuyển",
    cat_entertainment: "Giải trí",
    cat_bills: "Hóa đơn",
    cat_income: "Thu nhập",
    cat_other: "Khác",
  },
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState("vi"); // Mặc định là Tiếng Việt

  useEffect(() => {
    // Load ngôn ngữ đã lưu khi mở app
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem("user-language");
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
      } catch (error) {
        console.log("Error loading language", error);
      }
    };
    loadLanguage();
  }, []);

  const changeLanguage = async (lang) => {
    try {
      setLanguage(lang);
      await AsyncStorage.setItem("user-language", lang);
    } catch (error) {
      console.log("Error saving language", error);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, i18n: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
