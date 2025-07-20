import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot, FaUserTie } from 'react-icons/fa';
import { IoIosCloseCircle } from 'react-icons/io';
import { RiSendPlaneFill } from 'react-icons/ri';
import { MdSupportAgent } from 'react-icons/md';

import botService from '../../services/botService';
import { QuestionSuggestions } from '../../utils/chatUtils';
import BotSuggestQuestions from './BotSuggestQuestions';
import Messages from './Messages';
import styles from './ChatBot.module.scss';

// Lấy userId, nếu chưa có thì tạo userId tạm cho khách
const getUserId = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user?.id) return user.id;
    let guestId = localStorage.getItem('guest_id');
    if (!guestId) {
        guestId = 'guest_' + Date.now();
        localStorage.setItem('guest_id', guestId);
    }
    return guestId;
};

// Thêm props globalRoomId và onRoomCreated
function ChatBot({ setShowChat, chatType, setChatType, user, globalRoomId, onRoomCreated }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false); // Thêm state này
    const [isOnline, setIsOnline] = useState(true); // Trạng thái online của bot
    const [lastMentionedProductIds, setLastMentionedProductIds] = useState([]);

    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Get userId và productId từ props user hoặc storage
    const userId = user?.id || getUserId();
    const productId = JSON.parse(sessionStorage.getItem('productId')) || null;

    // Tạo unique key cho session này
    const sessionKey = `chatbot_messages_${userId || 'guest'}_${productId || 'general'}`;

    // Load messages từ sessionStorage khi component mount
    useEffect(() => {
        const savedMessages = sessionStorage.getItem(sessionKey);
        if (savedMessages) {
            try {
                const parsedMessages = JSON.parse(savedMessages);
                setMessages(parsedMessages);
            } catch (error) {
                console.error('Error parsing saved messages:', error);
                // Nếu có lỗi, khởi tạo với tin nhắn chào mừng
                initializeWelcomeMessage();
            }
        } else {
            // Khởi tạo với tin nhắn chào mừng
            initializeWelcomeMessage();
        }
    }, [sessionKey]);

    // Khởi tạo tin nhắn chào mừng
    const initializeWelcomeMessage = () => {
        const welcomeMessage = {
            content: "Xin chào! Tôi là Luna - trợ lý AI của DNGSON. Tôi có thể giúp bạn tìm kiếm sản phẩm và tư vấn thời trang. Bạn cần hỗ trợ gì hôm nay? 😊",
            sender: 'bot',
            timestamp: new Date().toISOString()
        };
        setMessages([welcomeMessage]);
        saveMessagesToSession([welcomeMessage]);
    };

    // Lưu messages vào sessionStorage
    const saveMessagesToSession = (messagesToSave) => {
        try {
            // Chỉ lưu 50 tin nhắn gần nhất để tránh sessionStorage quá lớn
            const limitedMessages = messagesToSave.slice(-50);
            sessionStorage.setItem(sessionKey, JSON.stringify(limitedMessages));
        } catch (error) {
            console.error('Error saving messages to session:', error);
            // Nếu sessionStorage đầy, xóa tin nhắn cũ
            if (error.name === 'QuotaExceededError') {
                try {
                    const reducedMessages = messagesToSave.slice(-20);
                    sessionStorage.setItem(sessionKey, JSON.stringify(reducedMessages));
                } catch (retryError) {
                    console.error('Failed to save even reduced messages:', retryError);
                }
            }
        }
    };

    // Update sessionStorage mỗi khi messages thay đổi
    useEffect(() => {
        if (messages.length > 0) {
            saveMessagesToSession(messages);
        }
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    // Load initial suggestions
    useEffect(() => {
        // Lấy message mới nhất của user
        const lastUserMsg = [...messages].reverse().find(msg => msg.sender === 'user');
        const lastMsgContent = lastUserMsg ? lastUserMsg.content : '';

        const loadSuggestionsByMessage = async () => {
            setSuggestionsLoading(true);
            try {
                const newSuggestions = await QuestionSuggestions({
                    message: lastMsgContent
                });
                setSuggestions(newSuggestions || []);
            } catch (error) {
                setSuggestions([]);
            } finally {
                setSuggestionsLoading(false);
            }
        };

        if (lastMsgContent) {
            loadSuggestionsByMessage();
        }
    }, [messages]);

    // Kiểm tra trạng thái online (có thể dựa vào WebSocket, API, etc.)
    useEffect(() => {
        // Bot AI luôn online, hoặc có thể check server status
        setIsOnline(true);

        // Nếu muốn check real-time status:
        // const checkBotStatus = setInterval(() => {
        //     // Call API to check bot service status
        //     botService.checkStatus().then(status => setIsOnline(status));
        // }, 30000); // Check every 30s

        // return () => clearInterval(checkBotStatus);
    }, []);

    useEffect(() => {
        // Tìm productIds mới nhất từ tin nhắn bot cuối cùng
        const lastBotMsg = messages.slice().reverse().find(msg => msg.sender === 'bot' && msg.products && Object.keys(msg.products).length > 0);
        if (lastBotMsg) {
            const newProductIds = Object.values(lastBotMsg.products).map(p => p.product_id);
            // So sánh với state cũ, nếu khác thì làm mới gợi ý
            if (JSON.stringify(newProductIds) !== JSON.stringify(lastMentionedProductIds)) {
                setLastMentionedProductIds(newProductIds);
                // Gọi lại API lấy gợi ý dựa trên sản phẩm mới
                (async () => {
                    setSuggestionsLoading(true);
                    try {
                        const props = { userId, productId: newProductIds[0] }; // lấy productId đầu tiên hoặc logic phù hợp
                        const newSuggestions = await QuestionSuggestions({ props });
                        setSuggestions(newSuggestions);
                    } catch (error) {
                        setSuggestions([]);
                    } finally {
                        setSuggestionsLoading(false);
                    }
                })();
            }
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');

        // Thêm tin nhắn người dùng
        const newUserMessage = {
            content: userMessage,
            sender: 'user',
            timestamp: new Date().toISOString()
        };

        const updatedMessages = [...messages, newUserMessage];
        setMessages(updatedMessages);

        // Thêm tin nhắn "đang suy nghĩ..."
        const thinkingMessage = {
            content: 'đang suy nghĩ...',
            sender: 'bot',
            timestamp: new Date().toISOString()
        };

        const messagesWithThinking = [...updatedMessages, thinkingMessage];
        setMessages(messagesWithThinking);
        setIsLoading(true);

        try {
            // Lấy 4 tin nhắn gần nhất (bao gồm cả user và bot)
            const last4Messages = updatedMessages.slice(-4).map(msg => ({
                content: msg.content,
                sender: msg.sender,
                // timestamp: msg.timestamp
            }));

            const response = await botService.sendMessage({
                messages: last4Messages,
                userId: userId,
                productId: productId
            });

            // Xóa tin nhắn "đang suy nghĩ..."
            const messagesWithoutThinking = messagesWithThinking.filter(msg => msg.content !== 'đang suy nghĩ...');

            if (response.data && response.data.success) {
                const botResponse = {
                    content: response.data.reply || 'Xin lỗi, tôi không hiểu câu hỏi của bạn.',
                    sender: 'bot',
                    timestamp: new Date().toISOString(),
                    products: response.data.products || {}
                };

                const finalMessages = [...messagesWithoutThinking, botResponse];
                setMessages(finalMessages);

                // Lấy productId mới nhất nếu có sản phẩm mới được nhắc đến
                let newProductId = productId;
                if (response.data.products && Object.keys(response.data.products).length > 0) {
                    // Lấy productId đầu tiên trong danh sách sản phẩm trả về
                    const firstProduct = Object.values(response.data.products)[0];
                    newProductId = firstProduct?.product_id || productId;
                }

                // Luôn truyền message vừa gửi vào QuestionSuggestions
                try {
                    setSuggestionsLoading(true);
                    // const props = { userId, productId: newProductId };
                    const newSuggestions = await QuestionSuggestions({ message: userMessage });
                    setSuggestions(newSuggestions);
                } catch (suggestionError) {
                    setSuggestions([]);
                } finally {
                    setSuggestionsLoading(false);
                }
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Error sending message:', error);

            // Xóa tin nhắn "đang suy nghĩ..."
            const messagesWithoutThinking = messagesWithThinking.filter(msg => msg.content !== 'đang suy nghĩ...');

            const errorMessage = {
                content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.',
                sender: 'bot',
                timestamp: new Date().toISOString()
            };

            const finalMessages = [...messagesWithoutThinking, errorMessage];
            setMessages(finalMessages);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestedQuestionClick = async (question) => {
        if (isLoading) return;
        setInput(question);

        setSuggestionsLoading(true);
        try {
            // const props = { userId, productId };
            // Luôn truyền câu hỏi vừa chọn
            const newSuggestions = await QuestionSuggestions({ message: question });
            setSuggestions(newSuggestions);
        } catch (error) {
            setSuggestions([]);
        } finally {
            setSuggestionsLoading(false);
        }

        setTimeout(() => {
            handleSend();
        }, 100);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.chatContainer}>
            {/* Header */}
            <div className={styles.chatHeader}>
                <div className={styles.headerInfo}>
                    <div className={styles.avatar}>
                        <span className={styles.avatarIcon}>
                            <img src="public/images/bot/meow.gif" alt="" style={{ width: 32, height: 32 }} />
                        </span>
                        <div
                            className={styles.statusDot}
                            style={{
                                background: isOnline ? '#22c55e' : '#a3a3a3'
                            }}
                        />
                    </div>
                    <div className={styles.staffDetails}>
                        <span className={styles.staffName}>Trợ lý AI Luna</span>
                        <span className={styles.statusText}>
                            {isLoading
                                ? 'Đang trả lời...'
                                : isOnline
                                    ? 'Đang hoạt động'
                                    : 'Không có sẵn'
                            }
                        </span>
                    </div>
                </div>
                <div className={styles.headerActions}>
                    <button
                        onClick={() => setChatType('staff')}
                        className={styles.actionButton}
                        title="Chuyển sang chat với nhân viên"
                    >
                        <MdSupportAgent />
                    </button>
                    <button
                        onClick={() => setShowChat(false)}
                        className={styles.closeButton}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-hidden">
                <Messages messages={messages} />
            </div>

            {/* Suggestions */}
            <div className="border-t border-gray-100 bg-gray-50/50">
                <BotSuggestQuestions
                    suggestions={suggestions}
                    onQuestionClick={handleSuggestedQuestionClick}
                    isLoading={suggestionsLoading}
                />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-100 bg-white">
                <div className="flex items-center space-x-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={isLoading ? "Đang gửi..." : "Nhập câu hỏi của bạn..."}
                        disabled={isLoading}
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                            <RiSendPlaneFill className="text-lg" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ChatBot;