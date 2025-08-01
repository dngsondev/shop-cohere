import cohere from '../config/cohereConfig.js';
import { getInforToCohere, getIdProducts, getProductsByIdForCohere } from '../models/productModel.js';
import { getCommand } from '../models/adminModels.js';
import { getInforToSuggestQuestions } from '../models/cohereModels.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import striptags from 'striptags';

// Bộ nhớ lưu hội thoại trước đó
let chatHistory = [];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache để lưu embeddings của sản phẩm (tránh tính toán lại nhiều lần)
let productEmbeddingsCache = new Map();

// Hàm đọc nội dung file txt/docx
async function convertFileToText(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.txt') {
        return fs.promises.readFile(filePath, 'utf8');
    }
    if (ext === '.docx') {
        try {
            const mammoth = await import('mammoth');
            const buffer = await fs.promises.readFile(filePath);
            const result = await mammoth.convertToHtml({ buffer });
            return result.value.replace(/<[^>]+>/g, '');
        } catch (err) {
            return '';
        }
    }
    return '';
}

// Hàm tính cosine similarity
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Hàm tạo embedding cho sản phẩm
async function createProductEmbedding(product) {
    const productText = `${product.product_name} ${product.brand} ${product.category} ${product.material} ${striptags(product.description || '')}`;

    // console.log("Product text:", productText);

    // console.log("Product text:", productText.length);

    try {
        const response = await cohere.embed({
            texts: [productText],
            model: 'embed-multilingual-v3.0',
            input_type: 'search_document' // Thêm dòng này
        });
        // console.log("Cohere response:", response);

        // console.log("Cohere response:", response.embeddings[0].length);

        return response.embeddings[0];
    } catch (error) {
        console.error('Lỗi khi tạo embedding cho sản phẩm:', product.product_id, error);
        return null;
    }

}

// Hàm tìm kiếm sản phẩm liên quan bằng semantic search
async function searchRelevantProducts(query, allProducts, limit = 8) {
    try {
        console.log(`🔍 Bắt đầu semantic search với query: "${query}"`);

        // 1. Tạo embedding cho query
        const queryEmbeddingResponse = await cohere.embed({
            texts: [query],
            model: 'embed-multilingual-v3.0',
            input_type: 'search_query' // Thêm dòng này
        });
        const queryEmbedding = queryEmbeddingResponse.embeddings[0];

        // 2. Group products để tránh duplicate
        const groupedProducts = groupProducts(allProducts);
        console.log(`📦 Đã group ${allProducts.length} sản phẩm thành ${groupedProducts.length} sản phẩm unique`);

        // 3. Tạo hoặc lấy embeddings cho từng sản phẩm
        const productSimilarities = [];

        for (const product of groupedProducts) {
            let productEmbedding;

            // Kiểm tra cache
            if (productEmbeddingsCache.has(product.product_id)) {
                productEmbedding = productEmbeddingsCache.get(product.product_id);
            } else {
                // Tạo embedding mới và cache
                productEmbedding = await createProductEmbedding(product);
                if (productEmbedding) {
                    productEmbeddingsCache.set(product.product_id, productEmbedding);
                }
            }

            if (productEmbedding) {
                const similarity = cosineSimilarity(queryEmbedding, productEmbedding);
                productSimilarities.push({
                    product,
                    similarity
                });
            }
        }

        // 4. Sắp xếp theo độ tương đồng và lấy top results
        const topProducts = productSimilarities
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, limit)
            .map(item => {
                console.log(`📈 ${item.product.product_name}: ${(item.similarity * 100).toFixed(1)}% similarity`);
                return item.product;
            });

        console.log(`✅ Tìm thấy ${topProducts.length} sản phẩm liên quan`);
        return topProducts;

    } catch (error) {
        console.error('❌ Lỗi khi tìm kiếm sản phẩm liên quan:', error);

        // Fallback: trả về sản phẩm có rating cao
        const groupedProducts = groupProducts(allProducts);
        return groupedProducts
            .filter(p => p.avg_rating >= 4)
            .slice(0, limit);
    }
}

// Hàm fallback tìm kiếm theo từ khóa
function searchByKeywords(query, allProducts, limit = 8) {
    const keywords = query.toLowerCase().split(' ').filter(word => word.length > 2);
    const groupedProducts = groupProducts(allProducts);

    const scoredProducts = groupedProducts.map(product => {
        const searchText = `${product.product_name} ${product.category} ${product.brand} ${product.material}`.toLowerCase();
        let score = 0;

        keywords.forEach(keyword => {
            if (searchText.includes(keyword)) {
                score += 1;
            }
        });

        return { product, score };
    });

    return scoredProducts
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.product);
}

// Tạo thông tin sản phẩm dưới dạng chuỗi liền mạch
function groupProducts(products) {
    const grouped = {};
    products.forEach(p => {
        const id = p.product_id;
        if (!grouped[id]) {
            grouped[id] = {
                product_id: id,
                product_name: p.product_name,
                brand: p.brand,
                category: p.category,
                material: p.material,
                avg_rating: p.avg_rating,
                price: Number(p.price).toFixed(0),
                discount: Number(p.discount).toFixed(0),
                final_price: Number(p.final_price).toFixed(0),
                colors: new Set(),
                sizes: new Set(),
                description: striptags(p.description || '').replace(/\s+/g, ' ').trim().slice(0, 120)
            };
        }
        grouped[id].colors.add(p.color);
        grouped[id].sizes.add(p.size);
    });

    return Object.values(grouped).map(p => ({
        ...p,
        colors: Array.from(p.colors).join('/'),
        sizes: Array.from(p.sizes).join('/')
    }));
}

export const sendMessage = async (req, res) => {
    try {
        const { userId, productId, messages } = req.body;
        let message = '';
        if (Array.isArray(messages) && messages.length > 0) {
            message = messages[messages.length - 1].content;
        }

        let mentioned_product_id_end = [];

        console.log("Messages from frontend:", messages);

        // Ưu tiên context từ FE nếu có
        let conversationContext = '';
        if (Array.isArray(messages) && messages.length > 0) {
            conversationContext = messages.map(
                m => `${m.sender === 'user' ? 'Người dùng' : 'Bot'}: ${m.content}`
            ).join('\n');
        }

        // Cập nhật lịch sử hội thoại với context người dùng
        if (message) {
            chatHistory.push(`Người dùng ${userId ? `(ID: ${userId})` : ''}: ${message}`);
        }

        const command = await getCommand();
        console.log("Command:", command[0].contents);

        // Lấy danh sách file lệnh từ thư mục uploads/commands
        const commandsDir = path.join(__dirname, '../../uploads/commands');
        let files = [];
        if (fs.existsSync(commandsDir)) {
            files = fs.readdirSync(commandsDir).filter(f => !fs.statSync(path.join(commandsDir, f)).isDirectory());
        }

        // Đọc nội dung các file lệnh
        const fileTexts = await Promise.all(
            files.map(async file => {
                const filePath = path.join(commandsDir, file);
                const text = await convertFileToText(filePath);
                if (!text) {
                    console.log(`⚠️ Không đọc được nội dung file: ${file}`);
                }
                return text;
            })
        );
        const fileContext = fileTexts.join("\n");
        console.log("File context:", fileContext);

        // **THAY ĐỔI CHÍNH: Lấy tất cả sản phẩm một lần**
        const allProducts = await getInforToCohere();
        console.log(`📊 Tổng số sản phẩm trong DB: ${allProducts.length}`);

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

        console.log("Thông tin cá nhân hóa:", personalizedInfo);

        // **THAY ĐỔI CHÍNH: Sử dụng semantic search thay vì tất cả sản phẩm**
        let relevantProducts;

        if (message && message.trim().length > 0) {
            // Semantic search cho câu hỏi cụ thể
            relevantProducts = await searchRelevantProducts(message, allProducts, 8);

            // Fallback nếu semantic search không tìm thấy gì
            if (relevantProducts.length === 0) {
                console.log("🔄 Fallback to keyword search");
                relevantProducts = searchByKeywords(message, allProducts, 8);
            }
        } else {
            // Nếu không có message, lấy sản phẩm top-rated
            const groupedProducts = groupProducts(allProducts);
            relevantProducts = groupedProducts
                .filter(p => p.avg_rating >= 4)
                .slice(0, 8);
        }

        // **Tạo productInfo từ sản phẩm liên quan thay vì tất cả**
        const productInfo = relevantProducts.map(product =>
            `product_id: ${product.product_id}, 
            product_name: ${product.product_name}, 
            brand: ${product.brand}, 
            category: ${product.category}, 
            material: ${product.material}, 
            avg_rating: ${product.avg_rating || 'Không có'}, 
            price: ${product.price}, 
            discount: ${product.discount}, 
            final_price: ${product.final_price}, 
            colors: ${product.colors}, 
            sizes: ${product.sizes}, 
            description: ${product.description}`
        ).join('\n');

        console.log(`🎯 Sử dụng ${relevantProducts.length} sản phẩm liên quan thay vì ${allProducts.length} sản phẩm`);
        console.log("📝 Số ký tự productInfo (tối ưu):", productInfo.length);

        // Tạo prompt cho Cohere (giống như cũ)
        const prompt = `${command[0].contents}
${fileContext}
Bạn là chatbot bán quần áo và là 1 nhân viên tư vấn chuyên nghiệp. 
Do là 1 nhân viên tư vấn chuyên nghiệp nên bạn không chỉ mỗi trả lời câu hỏi của khách hàng mà còn tư vấn các sản phẩm phù hợp với nhu cầu của khách hàng.
Hãy đọc hiểu câu hỏi trước khi trả lời bao gồm cả ngữ cảnh hay những thứ liên quan đến câu hỏi.
Trả lời niềm nở, thân thiện và chủ động gợi ý hay quảng cáo về sản phẩm.
Trả lời ngắn gọn, dưới 200 từ. Nếu câu trả lời quá dài hãy tóm lại để khi hiển thị không bị mất chữ và gây ra mất nghĩa của câu.
Chỉ nói về sản phẩm của shop. Nếu không có sản phẩm nào phù hợp với câu hỏi, hãy trả lời rằng không có sản phẩm nào phù hợp.

Nếu khách hỏi về chương trình khuyến mãi, thời gian giao hàng, chính sách bảo hành, đổi trả,... thì:
- Nếu có dữ liệu liên quan trong phần phía trên (ví dụ: fileContext), hãy trả lời đúng theo dữ liệu đó.
- Nếu không có dữ liệu nào về vấn đề khách hỏi, hãy hướng dẫn khách liên hệ với nhân viên chăm sóc khách hàng của shop để được hỗ trợ chi tiết.

Ví dụ: Nếu có điều khoản đổi trả trong dữ liệu, hãy trả lời đúng nội dung đó. Nếu không có, chỉ nói "Bạn vui lòng liên hệ CSKH để biết thêm chi tiết".

${personalizedInfo}

avg_rating là điểm đánh giá trung bình của sản phẩm, được tính từ 1 đến 5 sao.

Dữ liệu sản phẩm:  
${productInfo}

Lịch sử hội thoại:  
${conversationContext}

Khi nhắc đến bất kỳ sản phẩm nào trong dữ liệu, bạn BẮT BUỘC chỉ được đánh dấu tên sản phẩm bằng cặp tag <PRODUCT|ID: ID_SẢN_PHẨM> ... </PRODUCT|ID: ID_SẢN_PHẨM> đúng với ID trong dữ liệu. 
KHÔNG được tạo bất kỳ tag nào khác như <COLOR|...>, <COLORS>...</COLORS>, <SIZE|...>, <SIZES>...</SIZES>, <BRAND|...> hoặc các tag tương tự.
Chỉ đánh dấu tag này cho tên sản phẩm, không được đánh dấu cho các thông tin khác như màu sắc, kích thước, chất liệu, v.v.
Nếu khách hỏi về màu sắc, kích thước, chỉ trả lời dạng văn bản thông thường, KHÔNG dùng tag nào cả.
Nếu không tìm thấy sản phẩm phù hợp trong dữ liệu, KHÔNG được đánh dấu tag nào cả.

Ví dụ đúng:
Khách hỏi: "Bạn có áo khoác thông gió không?"
Trả lời: "<PRODUCT|ID: 80>Áo khoác thông gió a.k.a. AIR-tech jacket AT.02</PRODUCT|ID: 80> là sản phẩm nổi bật với công nghệ AIR-tech™ độc quyền..."

Ví dụ sai (KHÔNG ĐƯỢC dùng):
- <COLORS>...</COLORS>
- <SIZES>...</SIZES>
- <COLOR|...>
- <SIZE|...>

Câu hỏi: ${message}  
Trả lời:
        `;

        console.log("Prompt gửi đến Cohere (SendMessage):", prompt);
        console.log("Prompt length:", prompt.length);


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

        // Xử lý tag sản phẩm
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

