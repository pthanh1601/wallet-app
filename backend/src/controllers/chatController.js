import { sql } from "../config/db.js";
import { spawn } from "child_process";
import path from "path";

export async function chatWithGemini(req, res) {
  try {
    const { message, userId } = req.body; // Đảm bảo lấy userId từ req.body
    if (!userId) return res.status(400).json({ text: "Lỗi: Thiếu User ID" });

    // 1. Lấy dữ liệu thực tế (Metadata) gửi sang Python
    const summary = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as balance,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expenses
      FROM transactions WHERE user_id = ${userId}`;
    
    const transactions = await sql`
      SELECT title, amount, category 
      FROM transactions WHERE user_id = ${userId} 
      ORDER BY created_at DESC LIMIT 15`;

    // 2. Gọi Agent
    const pythonProcess = spawn(path.join(process.cwd(), "venv", "bin", "python"), [
      path.join(process.cwd(), "rag_chatbot.py")
    ]);

    let buffer = "";
    pythonProcess.stdin.write(JSON.stringify({ message, summary: summary[0], transactions }));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on("data", (data) => { buffer += data.toString(); });

    pythonProcess.on("close", async () => {
      try {
        const result = JSON.parse(buffer.trim());

        if (result.type === "action" && result.function === "manage_transaction") {
          let { action, amount, title, category } = result.parameters;
          if (action === "CREATE") {
            // ÉP DẤU ÂM: Nếu là ăn uống, mua sắm... thì số tiền phải âm
            let finalAmt = Number(amount);
            const expenseKeys = ["ăn", "uống", "food", "shop", "chi", "mua", "đi", "bill"];
            const isExpense = expenseKeys.some(k => (title + (category || "")).toLowerCase().includes(k));
            
            if (isExpense && finalAmt > 0) finalAmt = -finalAmt;

            await sql`INSERT INTO transactions (user_id, title, amount, category) 
                      VALUES (${userId}, ${title || category}, ${finalAmt}, ${category || 'Khác'})`;
            
            return res.json({ text: `✅ Đã thêm: ${title || category} (${finalAmt.toLocaleString()}đ)` });
          }
        }
        // Trả lời phân tích dựa trên dữ liệu RAG
        res.json({ text: result.content || "Yêu cầu đã được thực hiện." });
      } catch (e) {
        // Tránh trả về HTML lỗi của ngrok làm crash App
        res.json({ text: "Server AI hiện không trả về định dạng chuẩn. Vui lòng thử lại." });
      }
    });
  } catch (error) {
    res.status(500).json({ text: "Lỗi hệ thống máy chủ." });
  }
}