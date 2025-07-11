import botService from "../services/botService";

export async function QuestionSuggestions({ message }) {
    if (!message) return [];

    try {
        const response = await botService.getQuestionSuggestions({
            message
        });

        if (response && response.data && response.data.success) {
            const suggestions = Array.isArray(response.data.suggestions)
                ? response.data.suggestions
                : [];
            sessionStorage.setItem('questionSuggestions', JSON.stringify(suggestions));
            window.dispatchEvent(new CustomEvent('questionSuggestions', {
                detail: suggestions
            }));
            return suggestions;
        }
    } catch (error) {
        console.error("Error fetching question suggestions:", error);
        return getDefaultSuggestions();
    }
    return [];
}

function getDefaultSuggestions() {
    return [
        "Sản phẩm nào đang được ưa chuộng nhất?",
        "Tôi nên chọn size như thế nào?",
        "Có chương trình khuyến mãi nào không?"
    ];
}

export function clearSuggestionCache() {}
