import cohere from '../config/cohereConfig.js';
import { getInforToCohere, getIdProducts, getProductsByIdForCohere } from '../models/productModel.js';
import { getCommand } from '../models/adminModels.js';
import { getInforToSuggestQuestions } from '../models/cohereModels.js';

// Bộ nhớ lưu hội thoại trước đó
let chatHistory = [];

export const sendToCohere = async (req, res) => {
    try {
        let mentioned_product_id_end = [];
        const { question } = req.body;

        // Cập nhật lịch sử hội thoại
        if (question) {
            chatHistory.push(`Người dùng: ${question}`);
        }

        // Giữ lại 5 câu gần nhất từ lịch sử hội thoại
        const conversationContext = chatHistory.slice(-5).join("\n");

        const command = await getCommand();
        console.log("Command:", command[0].contents);

        // Lấy tất cả thông tin sản phẩm từ MySQL
        const products = await getInforToCohere();

        // Tạo thông tin sản phẩm dưới dạng chuỗi liền mạch
        const productInfo = products.map(product =>
            Object.entries(product).map(([key, value]) => `${key}: ${value || 'Không có thông tin'}`).join(', ')
        ).join('\n');

        const prompt = `${command[0].contents}
            Bạn là chatbot bán quần áo và là 1 nhân viên tư vấn chuyên nghiệp. 
            Do là 1 nhân viên tư vấn chuyên nghiệp nên bạn không chỉ mỗi trả lời câu hỏi của khách hàng mà còn tư vấn các sản phẩm phù hợp với nhu cầu của khách hàng.
            Hãy đọc hiểu câu hỏi trước khi trả lời bao gồm cả ngữ cảnh hay những thứ liên quan đến câu hỏi.
            Trả lời niềm nở, thân thiện và chủ động gợi ý hay quảng cáo về sản phẩm.
            Trả lời ngắn gọn, dưới 200 từ.  
            Chỉ nói về sản phẩm của shop. Nếu không có sản phẩm nào phù hợp với câu hỏi, hãy trả lời rằng không có sản phẩm nào phù hợp.
            Không được nói về những thứ bạn không có dữ liệu được cung cấp từ shop như: chương trình khuyến mãi, thời gian giao hàng, chính sách bảo hành, đổi trả,...
            Thay vào đó hãy gọi khách hàng liên hệ với nhân viên chăm sóc khách hàng của shop.
            
            Dữ liệu sản phẩm:  
            ${productInfo}

            Lịch sử hội thoại:  
            ${conversationContext}

            QUY TẮC ĐÁNH DẤU SẢN PHẨM:
            - Khi nhắc đến bất kỳ sản phẩm nào trong dữ liệu, bạn BẮT BUỘC phải đánh dấu sản phẩm đó bằng cặp tag <PRODUCT|ID: ID_SẢN_PHẨM>TÊN_SẢN_PHẨM</PRODUCT|ID: ID_SẢN_PHẨM>
            - CHỈ đánh dấu TÊN SẢN PHẨM bên trong tag, KHÔNG bao gồm màu sắc, kích thước, giá cả hay bất kỳ thông tin mô tả nào khác
            - Các thông tin về màu sắc, kích thước, giá cả phải được viết BÊN NGOÀI tag
            - Mỗi sản phẩm chỉ được đánh dấu tag MỘT LẦN trong toàn bộ câu trả lời
            - Nếu không tìm thấy sản phẩm phù hợp trong dữ liệu, KHÔNG được đánh dấu tag nào cả

            VÍ DỤ ĐÚNG:
            "Tôi giới thiệu <PRODUCT|ID: 75>Áo Thun Teelab Local Brand Unisex Premium Cotton 380gsm TS268</PRODUCT|ID: 75> với nhiều màu sắc như đen, be, nâu và xanh khói, giá chỉ 420.000đ"

            VÍ DỤ SAI (TUYỆT ĐỐI KHÔNG LÀM):
            "Tôi giới thiệu <PRODUCT|ID: 75>Áo Thun Teelab Local Brand Unisex Premium Cotton 380gsm TS268 với màu đen, be, nâu và xanh khói</PRODUCT|ID: 75>"

            LƯUÝ QUAN TRỌNG:
            - KHÔNG được đưa thông tin màu sắc (đen, be, nâu, xanh, v.v.) vào trong tag <PRODUCT>
            - KHÔNG được đưa thông tin kích thước (S, M, L, XL, v.v.) vào trong tag <PRODUCT>  
            - KHÔNG được đưa thông tin giá cả vào trong tag <PRODUCT>
            - CHỈ có tên chính thức của sản phẩm được phép nằm trong tag

            Câu hỏi: ${question}  
            Trả lời:
            `;

        // Gửi yêu cầu đến Cohere
        const response = await cohere.chat({
            model: 'command-r-plus',
            message: prompt,
            max_tokens: 300,
            temperature: 0.7,
        });

        // Lưu phản hồi của chatbot vào lịch sử
        let answer = response.text.trim();
        chatHistory.push(`Bot: ${answer}`);
        console.log("Phản hồi từ Cohere:", answer);

        // Cập nhật regex để xử lý tag chính xác hơn
        const regex = /<PRODUCT\|ID:\s*(\d+)>/g;
        let match;

        while ((match = regex.exec(answer)) !== null) {
            const productId = match[1];
            if (!mentioned_product_id_end.includes(productId)) {
                mentioned_product_id_end.push(productId);
            }
        }

        // Xóa tag khỏi câu trả lời - cập nhật regex cho chính xác
        answer = answer.replace(/<PRODUCT\|ID:\s*\d+>|<\/PRODUCT\|ID:\s*\d+>/g, '');

        // Nếu có sản phẩm được đề cập, lấy thông tin chi tiết theo ID
        let mentionedProductsInfo = [];
        if (mentioned_product_id_end.length > 0) {
            mentionedProductsInfo = await getProductsByIdForCohere(mentioned_product_id_end);
        }

        console.log("ID sản phẩm được đề cập:", mentioned_product_id_end);
        console.log("Số sản phẩm được đề cập:", mentionedProductsInfo.length);

        // Trả kết quả về cho frontend kèm theo thông tin sản phẩm
        res.json({
            success: true,
            cohereResponse: answer,
            relatedProducts: mentionedProductsInfo // Trả về thông tin sản phẩm liên quan
        });

    } catch (error) {
        console.error('Lỗi khi gửi dữ liệu đến Cohere:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi gửi dữ liệu đến Cohere',
            error: error.message
        });
    }
};

export const sendMessage = async (req, res) => {
    try {
        let mentioned_product_id_end = [];
        const { message, userId, productId } = req.body;

        console.log(`SendMessage API - UserId: ${userId}, ProductId: ${productId}, Message: ${message}`);

        // Cập nhật lịch sử hội thoại với context người dùng
        if (message) {
            chatHistory.push(`Người dùng ${userId ? `(ID: ${userId})` : ''}: ${message}`);
        }

        // Giữ lại 10 câu gần nhất từ lịch sử hội thoại
        const conversationContext = chatHistory.slice(-10).join("\n");

        const command = await getCommand();
        console.log("Command:", command[0].contents);

        // Lấy thông tin sản phẩm từ MySQL
        const products = await getInforToCohere();

        // Nếu có userId và productId, có thể lấy thông tin cá nhân hóa
        let personalizedInfo = '';
        if (userId || productId) {
            try {
                const userProductInfo = await getInforToSuggestQuestions(userId, productId);
                if (userProductInfo && userProductInfo.length > 0) {
                    personalizedInfo = `\nThông tin cá nhân hóa cho khách hàng:
                    - Giới tính: ${userProductInfo[0]?.gender || 'Không xác định'}
                    - Sản phẩm đã xem/mua: ${userProductInfo.map(p => p.product_name).join(', ')}`;
                }
            } catch (error) {
                console.log("Không thể lấy thông tin cá nhân hóa:", error.message);
            }
        }

        // Tạo thông tin sản phẩm dưới dạng chuỗi liền mạch
        const productInfo = products.map(product =>
            Object.entries(product).map(([key, value]) => `${key}: ${value || 'Không có thông tin'}`).join(', ')
        ).join('\n');

        const prompt = `${command[0].contents}
            Bạn là chatbot bán quần áo và là 1 nhân viên tư vấn chuyên nghiệp. 
            Do là 1 nhân viên tư vấn chuyên nghiệp nên bạn không chỉ mỗi trả lời câu hỏi của khách hàng mà còn tư vấn các sản phẩm phù hợp với nhu cầu của khách hàng.
            Hãy đọc hiểu câu hỏi trước khi trả lời bao gồm cả ngữ cảnh hay những thứ liên quan đến câu hỏi.
            Trả lời niềm nở, thân thiện và chủ động gợi ý hay quảng cáo về sản phẩm.
            Trả lời ngắn gọn, dưới 200 từ.  
            Chỉ nói về sản phẩm của shop. Nếu không có sản phẩm nào phù hợp với câu hỏi, hãy trả lời rằng không có sản phẩm nào phù hợp.
            Không được nói về những thứ bạn không có dữ liệu được cung cấp từ shop như: chương trình khuyến mãi, thời gian giao hàng, chính sách bảo hành, đổi trả,...
            Thay vào đó hãy gọi khách hàng liên hệ với nhân viên chăm sóc khách hàng của shop.
            
            ${personalizedInfo}
            
            Dữ liệu sản phẩm:  
            ${productInfo}

            Lịch sử hội thoại:  
            ${conversationContext}

            Khi nhắc đến bất kỳ sản phẩm nào trong dữ liệu, bạn BẮT BUỘC phải đánh dấu sản phẩm đó bằng cặp tag <PRODUCT|ID: ID_SẢN_PHẨM> ... </PRODUCT|ID: ID_SẢN_PHẨM> đúng với ID trong dữ liệu. Không được bỏ sót sản phẩm nào đã nhắc đến.
            Chỉ đánh dấu tag này cho tên sản phẩm, không đánh dấu cho các thông tin khác như màu sắc, kích thước, chất liệu, v.v.
            Nếu không tìm thấy sản phẩm phù hợp trong dữ liệu, KHÔNG được đánh dấu tag nào cả.

            Ví dụ đúng:
            Khách hỏi: "Bạn có áo khoác thông gió không?"
            Trả lời: "<PRODUCT|ID: 80>Áo khoác thông gió a.k.a. AIR-tech jacket AT.02</PRODUCT|ID: 80> là sản phẩm nổi bật với công nghệ AIR-tech™ độc quyền..."

            Câu hỏi: ${message}  
            Trả lời:
        `;

        // Gửi yêu cầu đến Cohere
        const response = await cohere.chat({
            model: 'command-r-plus',
            message: prompt,
            max_tokens: 300,
            temperature: 0.7,
        });

        // Lưu phản hồi của chatbot vào lịch sử
        let answer = response.text.trim();
        chatHistory.push(`Bot: ${answer}`);
        console.log("Phản hồi từ Cohere (SendMessage):", answer);

        const regex = /<PRODUCT\|ID: ([\d,]+)>.*?<\/PRODUCT\|ID: [\d,]+>/g;
        let match;

        while ((match = regex.exec(answer)) !== null) {
            const ids = match[1].split(',');
            mentioned_product_id_end.push(...ids);
        }

        // Xóa tag khỏi câu trả lời
        answer = answer.replace(/<PRODUCT\|ID: [\d,]+>|<\/PRODUCT\|ID: [\d,]+>/g, '');

        // Nếu có sản phẩm được đề cập, lấy thông tin chi tiết theo ID
        let mentionedProductsInfo = [];
        if (mentioned_product_id_end.length > 0) {
            try {
                const uniqueIds = [...new Set(mentioned_product_id_end)];
                mentionedProductsInfo = await getProductsByIdForCohere(uniqueIds);
            } catch (error) {
                console.error("Lỗi khi lấy thông tin sản phẩm được đề cập:", error);
            }
        }

        console.log("ID sản phẩm được đề cập:", mentioned_product_id_end);
        console.log("Số sản phẩm được đề cập:", mentionedProductsInfo.length);

        // Trả kết quả về cho frontend
        res.json({
            success: true,
            reply: answer,
            products: mentionedProductsInfo,
            userContext: {
                userId: userId,
                productId: productId,
                hasPersonalizedInfo: personalizedInfo !== ''
            }
        });

    } catch (error) {
        console.error('Lỗi khi xử lý sendMessage:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xử lý tin nhắn',
            error: error.message
        });
    }
};

export const getQuestionSuggestions = async (req, res) => {
    try {
        const { userId, productId, message } = req.query;

        console.log(`User ID: ${userId}, Product ID: ${productId}`);
        console.log("Message:", message);

        // Lấy thông tin sản phẩm từ MySQL
        const inforResponse = await getInforToSuggestQuestions(userId, productId);

        if (!inforResponse || inforResponse.length === 0) {
            return res.json({
                success: true,
                suggestions: `Sản phẩm nào đang được ưa chuộng nhất?
Bạn có khuyến mãi gì không?
Làm sao để chọn size phù hợp với tôi?`
            });
        }

        const productNames = inforResponse.map(item => item.product_name).slice(0, 5);
        const currentSeason = getCurrentSeason();

        let prompt = '';

        if (message && message.trim() !== '' && message !== 'undefined' && message !== 'null') {
            // Có message từ user - tạo câu hỏi liên quan
            prompt = `
                Bạn là chatbot bán quần áo chuyên nghiệp của shop thời trang DNGSON. hãy vào vai trò là khách hàng đang tò mò về sản phẩm.
                Dựa vào tin nhắn của khách hàng, hãy đưa ra 3 câu hỏi tiếp theo mà khách hàng có thể quan tâm.
                
                Tin nhắn của khách hàng: "${message}"
                
                Các sản phẩm có sẵn: ${productNames.join(', ')}
                Mùa hiện tại: ${currentSeason}
                
                Yêu cầu:
                - Đưa ra 3 câu hỏi cụ thể, thực tế và hữu ích
                - Câu hỏi phải liên quan trực tiếp đến tin nhắn và sản phẩm
                - Sử dụng ngôn ngữ thân thiện, gần gũi
                - Mỗi câu hỏi trên 1 dòng riêng biệt
                - KHÔNG thêm số thứ tự, chỉ viết câu hỏi thuần túy
                - Tối đa 15 từ mỗi câu
                
                Ví dụ format trả về:
                Áo này có màu nào khác không?
                Size M có vừa với người cao 1m65 không?
                Chất liệu có co giãn tốt không?
            `;
        } else {
            // Không có message - tạo câu hỏi khởi đầu
            prompt = `
                Bạn là chatbot bán quần áo của shop thời trang DNGSON.
                Hãy đưa ra 3 câu hỏi gợi ý hấp dẫn để khách hàng bắt đầu cuộc trò chuyện.
                
                Các sản phẩm nổi bật: ${productNames.join(', ')}
                Mùa hiện tại: ${currentSeason}
                
                Yêu cầu:
                - 3 câu hỏi thú vị, thu hút khách hàng
                - Phù hợp với mùa ${currentSeason}
                - Liên quan đến xu hướng thời trang hiện tại
                - Ngôn ngữ trẻ trung, thân thiện
                - Mỗi câu hỏi trên 1 dòng riêng biệt  
                - KHÔNG thêm số thứ tự, chỉ viết câu hỏi thuần túy
                - Tối đa 15 từ mỗi câu
                
                Ví dụ câu hỏi hay:
                ${currentSeason === 'winter' ? 'Áo khoác nào giữ ấm mà vẫn trendy?' :
                    currentSeason === 'summer' ? 'Outfit mùa hè nào đang hot nhất?' :
                        currentSeason === 'spring' ? 'Set đồ xuân nào dễ phối nhất?' :
                            'Trang phục thu nào vừa ấm vừa phong cách?'}
                Sản phẩm nào đang được giới trẻ yêu thích?
                Size chart của shop có chuẩn không?
            `;
        }

        // Gửi yêu cầu đến Cohere
        const response = await cohere.chat({
            model: 'command-r-plus',
            message: prompt,
            max_tokens: 120,
            temperature: 0.8,
        });

        let suggestions = response.text.trim();

        // Làm sạch suggestions
        suggestions = cleanSuggestions(suggestions);

        console.log("Generated suggestions:", suggestions);

        res.json({
            success: true,
            suggestions: suggestions,
        });

    } catch (error) {
        console.error('Lỗi khi tạo gợi ý câu hỏi:', error);

        // Fallback suggestions theo mùa
        const season = getCurrentSeason();
        const fallbackSuggestions = getFallbackSuggestions(season);

        res.json({
            success: true,
            suggestions: fallbackSuggestions,
        });
    }
};

// Helper functions
function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 12 || month <= 2) return 'winter';
    if (month >= 3 && month <= 5) return 'spring';
    if (month >= 6 && month <= 8) return 'summer';
    return 'autumn';
}

function cleanSuggestions(text) {
    return text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && line.length > 5)
        .map(line => {
            // Loại bỏ số thứ tự, dấu gạch đầu dòng
            line = line.replace(/^[\d\-\*\+•]\.\s*/, '');
            line = line.replace(/^[\d\-\*\+•]\s+/, '');
            line = line.replace(/^["'](.*)["']$/, '$1').trim();
            return line;
        })
        .filter(line => line && line.length > 5)
        .slice(0, 3)
        .join('\n');
}

function getFallbackSuggestions(season) {
    const suggestions = {
        winter: `Áo khoác nào giữ ấm nhất?
Outfit mùa đông nào đang trend?
Phụ kiện gì cần thiết cho mùa lạnh?`,

        spring: `Set đồ xuân nào dễ phối nhất?
Màu sắc nào hot trong mùa này?
Vải gì thoáng mát cho thời tiết giao mùa?`,

        summer: `Outfit mùa hè nào đang viral?
Chất liệu nào mát mẻ nhất?
Trang phục đi biển có gì hot?`,

        autumn: `Style thu nào đang được yêu thích?
Áo len nào vừa ấm vừa đẹp?
Cách phối đồ layering như thế nào?`
    };

    return suggestions[season] || suggestions.autumn;
}