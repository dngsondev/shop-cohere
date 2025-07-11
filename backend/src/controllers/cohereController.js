import cohere from '../config/cohereConfig.js';
import { getInforToCohere, getIdProducts, getProductsByIdForCohere } from '../models/productModel.js';
import { getCommand } from '../models/adminModels.js';
import { getInforToSuggestQuestions } from '../models/cohereModels.js';

// Bộ nhớ lưu hội thoại trước đó
let chatHistory = [];

// export const sendToCohere = async (req, res) => {
//     try {
//         let mentioned_product_id_end = [];
//         const { question } = req.body;

//         // Cập nhật lịch sử hội thoại
//         if (question) {
//             chatHistory.push(`Người dùng: ${question}`);
//         }

//         // Giữ lại 5 câu gần nhất từ lịch sử hội thoại
//         const conversationContext = chatHistory.slice(-5).join("\n");

//         const command = await getCommand();
//         console.log("Command:", command[0].contents);

//         // Lấy tất cả thông tin sản phẩm từ MySQL
//         const products = await getInforToCohere();

//         // Tạo thông tin sản phẩm dưới dạng chuỗi liền mạch
//         const productInfo = products.map(product =>
//             Object.entries(product).map(([key, value]) => `${key}: ${value || 'Không có thông tin'}`).join(', ')
//         ).join('\n');

//         const prompt = `${command[0].contents}
//             Bạn là chatbot bán quần áo và là 1 nhân viên tư vấn chuyên nghiệp. 
//             Do là 1 nhân viên tư vấn chuyên nghiệp nên bạn không chỉ mỗi trả lời câu hỏi của khách hàng mà còn tư vấn các sản phẩm phù hợp với nhu cầu của khách hàng.
//             Hãy đọc hiểu câu hỏi trước khi trả lời bao gồm cả ngữ cảnh hay những thứ liên quan đến câu hỏi.
//             Trả lời niềm nở, thân thiện và chủ động gợi ý hay quảng cáo về sản phẩm.
//             Trả lời ngắn gọn, dưới 200 từ.  
//             Chỉ nói về sản phẩm của shop. Nếu không có sản phẩm nào phù hợp với câu hỏi, hãy trả lời rằng không có sản phẩm nào phù hợp.
//             Không được nói về những thứ bạn không có dữ liệu được cung cấp từ shop như: chương trình khuyến mãi, thời gian giao hàng, chính sách bảo hành, đổi trả,...
//             Thay vào đó hãy gọi khách hàng liên hệ với nhân viên chăm sóc khách hàng của shop.

//             Dữ liệu sản phẩm:  
//             ${productInfo}

//             Lịch sử hội thoại:  
//             ${conversationContext}

//             QUY TẮC ĐÁNH DẤU SẢN PHẨM:
//             - Khi nhắc đến bất kỳ sản phẩm nào trong dữ liệu, bạn BẮT BUỘC phải đánh dấu sản phẩm đó bằng cặp tag <PRODUCT|ID: ID_SẢN_PHẨM>TÊN_SẢN_PHẨM</PRODUCT|ID: ID_SẢN_PHẨM>
//             - CHỈ đánh dấu TÊN SẢN PHẨM bên trong tag, KHÔNG bao gồm màu sắc, kích thước, giá cả hay bất kỳ thông tin mô tả nào khác
//             - Các thông tin về màu sắc, kích thước, giá cả phải được viết BÊN NGOÀI tag
//             - Mỗi sản phẩm chỉ được đánh dấu tag MỘT LẦN trong toàn bộ câu trả lời
//             - Nếu không tìm thấy sản phẩm phù hợp trong dữ liệu, KHÔNG được đánh dấu tag nào cả

//             VÍ DỤ ĐÚNG:
//             "Tôi giới thiệu <PRODUCT|ID: 75>Áo Thun Teelab Local Brand Unisex Premium Cotton 380gsm TS268</PRODUCT|ID: 75> với nhiều màu sắc như đen, be, nâu và xanh khói, giá chỉ 420.000đ"

//             VÍ DỤ SAI (TUYỆT ĐỐI KHÔNG LÀM):
//             "Tôi giới thiệu <PRODUCT|ID: 75>Áo Thun Teelab Local Brand Unisex Premium Cotton 380gsm TS268 với màu đen, be, nâu và xanh khói</PRODUCT|ID: 75>"

//             LƯUÝ QUAN TRỌNG:
//             - KHÔNG được đưa thông tin màu sắc (đen, be, nâu, xanh, v.v.) vào trong tag <PRODUCT>
//             - KHÔNG được đưa thông tin kích thước (S, M, L, XL, v.v.) vào trong tag <PRODUCT>  
//             - KHÔNG được đưa thông tin giá cả vào trong tag <PRODUCT>
//             - CHỈ có tên chính thức của sản phẩm được phép nằm trong tag

//             Câu hỏi: ${question}  
//             Trả lời:
//             `;

//         // Gửi yêu cầu đến Cohere
//         const response = await cohere.chat({
//             model: 'command-r-plus',
//             message: prompt,
//             max_tokens: 300,
//             temperature: 0.7,
//         });

//         // Lưu phản hồi của chatbot vào lịch sử
//         let answer = response.text.trim();
//         chatHistory.push(`Bot: ${answer}`);
//         console.log("Phản hồi từ Cohere:", answer);

//         // Cập nhật regex để xử lý tag chính xác hơn
//         const regex = /<PRODUCT\|ID:\s*(\d+)>/g;
//         let match;

//         while ((match = regex.exec(answer)) !== null) {
//             const productId = match[1];
//             if (!mentioned_product_id_end.includes(productId)) {
//                 mentioned_product_id_end.push(productId);
//             }
//         }

//         // Xóa tag khỏi câu trả lời - cập nhật regex cho chính xác
//         answer = answer.replace(/<PRODUCT\|ID:\s*\d+>|<\/PRODUCT\|ID:\s*\d+>/g, '');

//         // Nếu có sản phẩm được đề cập, lấy thông tin chi tiết theo ID
//         let mentionedProductsInfo = [];
//         if (mentioned_product_id_end.length > 0) {
//             mentionedProductsInfo = await getProductsByIdForCohere(mentioned_product_id_end);
//         }

//         console.log("ID sản phẩm được đề cập:", mentioned_product_id_end);
//         console.log("Số sản phẩm được đề cập:", mentionedProductsInfo.length);

//         // Trả kết quả về cho frontend kèm theo thông tin sản phẩm
//         res.json({
//             success: true,
//             cohereResponse: answer,
//             relatedProducts: mentionedProductsInfo // Trả về thông tin sản phẩm liên quan
//         });

//     } catch (error) {
//         console.error('Lỗi khi gửi dữ liệu đến Cohere:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Lỗi khi gửi dữ liệu đến Cohere',
//             error: error.message
//         });
//     }
// };

export const sendMessage = async (req, res) => {
    try {
        const { userId, productId, messages } = req.body;
        let message = '';
        if (Array.isArray(messages) && messages.length > 0) {
            message = messages[messages.length - 1].content; // lấy nội dung tin nhắn mới nhất
        }

        let mentioned_product_id_end = [];

        // console.log("Received message:", message);
        // console.log("User ID:", userId);
        // console.log("Product ID:", productId);
        console.log("Messages from frontend:", messages);


        // Ưu tiên context từ FE nếu có
        let conversationContext = '';
        if (Array.isArray(messages) && messages.length > 0) {
            conversationContext = messages.map(
                m => `${m.sender === 'user' ? 'Người dùng' : 'Bot'}: ${m.content}`
            ).join('\n');
            // console.log("Conversation context from frontend:", conversationContext);
        }
        //  else {
        //     // fallback: lấy từ chatHistory cục bộ
        //     conversationContext = chatHistory.slice(-10).join("\n");
        // }

        // Cập nhật lịch sử hội thoại với context người dùng
        if (message) {
            chatHistory.push(`Người dùng ${userId ? `(ID: ${userId})` : ''}: ${message}`);
        }

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
        const { message } = req.query;
        console.log("Message:", message);

        let prompt = '';
        if (message && message.trim() !== '' && message !== 'undefined' && message !== 'null') {
            prompt = `
Bạn là một khách hàng thực sự đang cân nhắc mua sắm tại shop thời trang DNGSON.
Bạn vừa hỏi: "${message}"

Hãy đặt ra đúng 3 câu hỏi tiếp theo mà một khách hàng thực sự sẽ hỏi về sản phẩm này trước khi quyết định mua, tập trung vào các khía cạnh thực tế như:
- Chất liệu, cảm giác mặc, độ bền, xuất xứ
- Tính năng nổi bật, công nghệ, phù hợp mục đích sử dụng (ví dụ: đi mưa, giữ ấm, chống nắng, phối đồ, v.v.)
- Chính sách đổi trả, bảo hành, ưu đãi, trải nghiệm thực tế của khách hàng khác
- Gợi ý phối đồ, màu sắc, size phù hợp với vóc dáng, phong cách
- Cách bảo quản, giặt ủi, giữ form

Yêu cầu:
- Không hỏi lan man, không hỏi về sản phẩm khác, không hỏi thông tin chung chung
- Không lặp lại câu hỏi đã hỏi ở trên
- Mỗi câu hỏi trên 1 dòng riêng, không đánh số thứ tự, không thêm giải thích
- Tối đa 15 từ mỗi câu, ngắn gọn, đúng tâm lý khách hàng
`;
        } else {
            prompt = `
Bạn là một khách hàng lần đầu mua sắm online tại shop thời trang DNGSON.
Hãy nghĩ như một khách hàng mới, đặt ra 3 câu hỏi mở đầu đúng tâm lý khách hàng để bắt chuyện với shop.

Yêu cầu:
- 3 câu hỏi thực tế, gần gũi, đúng tâm lý khách hàng mới
- Gợi ý về chất liệu, cảm giác mặc, ưu đãi, phối đồ, size, đổi trả, v.v.
- Không hỏi quá chung chung, không hỏi về thông tin shop không có
- Mỗi câu hỏi trên 1 dòng riêng, không đánh số thứ tự
- Tối đa 15 từ mỗi câu
`;
        }

        const response = await cohere.chat({
            model: 'command-r-plus',
            message: prompt,
            max_tokens: 120,
            temperature: 0.8,
        });

        let suggestions = response.text.trim();
        suggestions = cleanSuggestions(suggestions);
        const suggestionArr = suggestions.split('\n').filter(Boolean);

        res.json({
            success: true,
            suggestions: suggestionArr,
        });

    } catch (error) {
        console.error('Lỗi khi tạo gợi ý câu hỏi:', error);
        res.json({
            success: true,
            suggestions: [
                "Sản phẩm nào đang được ưa chuộng nhất?",
                "Tôi nên chọn size như thế nào?",
                "Có chương trình khuyến mãi nào không?"
            ],
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