import { sql } from "../config/db.js";

export async function getTransactionsByUserId(req, res) {
  try {
    const { userId } = req.params;

    const transactions = await sql`
        SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
      `;

    res.status(200).json(transactions || []);
  } catch (error) {
    console.log("Error getting the transactions", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function createTransaction(req, res) {
  try {
    let { title, amount, category, user_id } = req.body;

    if (!title || !user_id || !category || amount === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const numericAmount = Number(amount);

    const transaction = await sql`
      INSERT INTO transactions(user_id, title, amount, category)
      VALUES (${user_id}, ${title}, ${numericAmount}, ${category})
      RETURNING *
    `;

    res.status(201).json(transaction[0]);
  } catch (error) {
    console.log("Error tạo giao dịch:", error);
    res.status(500).json({ message: "Lỗi hệ thống" });
  }
}

export async function deleteTransaction(req, res) {
  try {
    const { id } = req.params;

    if (isNaN(parseInt(id))) {
      return res.status(400).json({ message: "Invalid transaction ID" });
    }

    const result = await sql`
      DELETE FROM transactions WHERE id = ${id} RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({ message: "Transaction deleted successfully" });
  } catch (error) {
    console.log("Error deleting the transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

// export async function getSummaryByUserId(req, res) {
//   try {
//     const { userId } = req.params;

//     const balanceResult = await sql`
//       SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE user_id = ${userId}
//     `;

//     const incomeResult = await sql`
//       SELECT COALESCE(SUM(amount), 0) as income FROM transactions
//       WHERE user_id = ${userId} AND amount > 0
//     `;

//     const expensesResult = await sql`
//       SELECT COALESCE(SUM(amount), 0) as expenses FROM transactions
//       WHERE user_id = ${userId} AND amount < 0
//     `;

//     res.status(200).json({
//       balance: balanceResult[0].balance,
//       income: incomeResult[0].income,
//       expenses: expensesResult[0].expenses,
//     });
//   } catch (error) {
//     console.log("Error gettin the summary", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// }

export async function getSummaryByUserId(req, res) {
  try {
    const { userId } = req.params;

    const summary = await sql`
      SELECT 
        COALESCE(SUM(amount), 0) as balance,
        COALESCE(SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN amount < 0 THEN amount ELSE 0 END), 0) as expenses
      FROM transactions 
      WHERE user_id = ${userId}
    `;

    res.status(200).json({
      balance: summary[0].balance,
      income: summary[0].income,
      expenses: Math.abs(summary[0].expenses), // Lấy trị tuyệt đối để UI dễ hiển thị
    });
  } catch (error) {
    console.log("Error lấy summary", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export async function updateTransaction(req, res) {
  try {
    const { id } = req.params;
    const { title, amount, category } = req.body;

    if (!title || !category || amount === undefined) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await sql`
      UPDATE transactions 
      SET title = ${title}, amount = ${amount}, category = ${category}
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json(result[0]);
  } catch (error) {
    console.log("Error updating transaction", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
