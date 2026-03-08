import sys, json, os, logging
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

# Tắt log để tránh làm hỏng định dạng JSON khi gửi về Node.js
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
logging.getLogger("langchain").setLevel(logging.ERROR)
load_dotenv()

def get_tools_definition():
    return [{
        "name": "manage_transaction",
        "description": "Quản lý giao dịch (Thêm/Sửa/Xóa). CHI TIÊU bắt buộc dùng số ÂM (ví dụ: -5000), THU NHẬP dùng số DƯƠNG.",
        "parameters": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["CREATE", "UPDATE", "DELETE"]},
                "amount": {"type": "number", "description": "Số tiền kèm dấu âm nếu là chi tiêu."},
                "title": {"type": "string"},
                "category": {"type": "string"},
                "target_title": {"type": "string"}
            },
            "required": ["action"]
        }
    }]

def main():
    try:
        data = json.loads(sys.stdin.read())
        msg = data.get("message")
        summary = data.get("summary", {})
        # Metadata: 15 giao dịch gần nhất để AI tra cứu (RAG)
        history = data.get("transactions", [])
        history_str = "\n".join([f"- {t['title']}: {t['amount']}đ ({t['category']})" for t in history])

        # Sử dụng 1.5-flash để ổn định và không bị lỗi 429
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash", 
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0
        )
        llm_with_tools = llm.bind_tools(get_tools_definition())

        # Bơm dữ liệu thực tế vào Prompt
        system_prompt = f"""Bạn là chuyên gia quản lý tài chính cá nhân.
        DỮ LIỆU THỰC TẾ:
        - Số dư: {summary.get('balance', 0)}đ | Thu nhập: {summary.get('income', 0)}đ | Chi tiêu: {summary.get('expenses', 0)}đ
        - Lịch sử giao dịch gần đây:
        {history_str}

        QUY TẮC:
        1. Nếu user muốn Thêm/Sửa/Xóa: Gọi tool 'manage_transaction'.
        2. Nếu user hỏi về Phân tích, Tổng hợp (ví dụ: "Tôi đã tiêu bao nhiêu cho ăn uống?"): Dựa vào dữ liệu trên để TRẢ LỜI TRỰC TIẾP.
        3. Tuyệt đối không nói "Tôi không thể tính toán" khi đã có dữ liệu trên.
        """
        
        response = llm_with_tools.invoke([("system", system_prompt), ("human", msg)])

        if response.tool_calls:
            tc = response.tool_calls[0]
            res = {"type": "action", "function": tc["name"], "parameters": tc["args"]}
        else:
            res = {"type": "response", "content": response.content}

        sys.stdout.write(json.dumps(res, ensure_ascii=False))
    except Exception as e:
        sys.stdout.write(json.dumps({"type": "error", "content": str(e)}))

if __name__ == "__main__":
    main()