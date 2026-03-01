import { GoogleGenerativeAI } from "@google/generative-ai";
import { sql } from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

export async function chatWithGemini(req, res) {
  try {
    const { message, userId } = req.body;

    // Log để kiểm tra dữ liệu đầu vào
    console.log("Chat Request:", { message, userId });

    if (!message || !userId) {
      return res.status(400).json({ message: "Message and userId are required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("Lỗi: Chưa cấu hình GEMINI_API_KEY trong file .env");
      return res.status(500).json({ message: "Server Error: Missing API Key" });
    }

    // 1. Lấy dữ liệu tài chính của user để làm context
    // Lấy tổng quan
    const summaryResult = await sql`
      SELECT 
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expenses,
        COALESCE(SUM(amount), 0) as balance
      FROM transactions WHERE user_id = ${userId}
    `;
    
    if (summaryResult.length === 0) {
       // Trường hợp user chưa có giao dịch nào
       summaryResult.push({ income: 0, expenses: 0, balance: 0 });
    }
    const summary = summaryResult[0];

    // Lấy 20 giao dịch gần nhất
    const transactions = await sql`
      SELECT title, amount, category, created_at, currency
      FROM transactions 
      WHERE user_id = ${userId} 
      ORDER BY created_at DESC 
      LIMIT 20
    `;

    // 2. Xây dựng Prompt (Ngữ cảnh) cho AI
    const transactionText = transactions.map(t => 
      `- ${t.title}: ${t.amount} ${t.currency || 'VND'} (${t.category}) ngày ${new Date(t.created_at).toLocaleDateString()}`
    ).join("\n");

    const prompt = `
      Bạn là một trợ lý tài chính cá nhân thông minh, thân thiện và hài hước.
      Dưới đây là dữ liệu tài chính hiện tại của người dùng:
      
      - Tổng thu nhập: ${summary.income}
      - Tổng chi tiêu: ${summary.expenses} (số âm là chi tiêu)
      - Số dư hiện tại: ${summary.balance}
      
      Các giao dịch gần đây:
      ${transactionText}
      
      Người dùng hỏi: "${message}"
      
      Hãy trả lời câu hỏi dựa trên dữ liệu trên. Nếu câu hỏi không liên quan đến tài chính, hãy trả lời bình thường nhưng ngắn gọn.
      Đưa ra lời khuyên tiết kiệm nếu thấy chi tiêu quá nhiều.
      Trả lời bằng Tiếng Việt.
    `;

    // 3. Gọi Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({ text });

  } catch (error) {
    // Log lỗi chi tiết ra terminal server
    console.error("Gemini Chat Error:", error);

    if (error.message.includes("404") || error.message.includes("not found")) {
      console.error("⚠️ LỖI MODEL: Có thể API Key của bạn không hỗ trợ model này.");
      console.error("👉 Hãy đảm bảo bạn lấy Key từ https://aistudio.google.com/ (nếu dùng Google Cloud Vertex AI thì cần thư viện khác).");
    }

    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
