import botService from "../services/botService";

// Cache để tránh gọi API trùng lặp
let lastRequestId = null;
let suggestionCache = new Map();

export async function QuestionSuggestions({ props, message }) {
    if (!props) return [];

    const key = JSON.stringify({ ...props, message: message || '' });
    console.log("QuestionSuggestions key:", key);

    // Kiểm tra cache trước
    if (suggestionCache.has(key)) {
        const cached = suggestionCache.get(key);
        if (Date.now() - cached.timestamp < 300000) { // Cache 5 phút
            console.log("Using cached suggestions");
            return cached.data;
        }
    }

    // Tránh gọi API trùng lặp
    if (lastRequestId === key) return [];
    lastRequestId = key;

    try {
        const response = await botService.getQuestionSuggestions({
            ...props,
            message: message || ''
        });

        if (response && response.data && response.data.success) {
            const rawText = response.data.suggestions || "";
            const extractedQuestions = parseQuestions(rawText);

            console.log("Parsed suggestions:", extractedQuestions);

            // Lưu vào cache
            suggestionCache.set(key, {
                data: extractedQuestions,
                timestamp: Date.now()
            });

            // Lưu vào sessionStorage và trigger event
            sessionStorage.setItem('questionSuggestions', JSON.stringify(extractedQuestions));
            window.dispatchEvent(new CustomEvent('questionSuggestions', {
                detail: extractedQuestions
            }));

            return extractedQuestions;
        }

    } catch (error) {
        console.error("Error fetching question suggestions:", error);
        lastRequestId = null;

        // Trả về suggestions mặc định khi có lỗi
        return getDefaultSuggestions(props.productId);
    }

    return [];
}

function parseQuestions(text) {
    if (!text) return [];

    // Xử lý cả định dạng có số và không có số
    const lines = text
        .split(/\n+/)
        .map(line => line.trim())
        .filter(line => line && line.length > 0);

    const questions = [];

    for (let line of lines) {
        // Loại bỏ số thứ tự ở đầu (1., 2., 3., -, *, etc.)
        let cleanLine = line.replace(/^[\d\-\*\+•]\.\s*/, '').trim();
        cleanLine = cleanLine.replace(/^[\d\-\*\+•]\s+/, '').trim();

        // Loại bỏ dấu ngoặc kép nếu có
        cleanLine = cleanLine.replace(/^["'](.*)["']$/, '$1').trim();

        if (cleanLine && cleanLine.length > 5) { // Tối thiểu 5 ký tự
            questions.push(cleanLine);
        }
    }

    return questions.slice(0, 3); // Giới hạn 3 câu hỏi
}

function getDefaultSuggestions(productId) {
    const defaults = [
        "Sản phẩm nào đang được ưa chuộng nhất?",
        "Tôi nên chọn size như thế nào?",
        "Có chương trình khuyến mãi nào không?"
    ];

    if (productId) {
        return [
            "Sản phẩm này có những màu nào?",
            "Chất liệu và form dáng như thế nào?",
            "Có hướng dẫn bảo quản không?"
        ];
    }

    return defaults;
}

// Clear cache khi cần
export function clearSuggestionCache() {
    suggestionCache.clear();
    lastRequestId = null;
}
