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

// Thêm props globalRoomId và onRoomCreated
function ChatBot({ setShowChat, chatType, setChatType, user, globalRoomId, onRoomCreated }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [suggestions, setSuggestions] = useState([]);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false); // Thêm state này
    const [isOnline, setIsOnline] = useState(true); // Trạng thái online của bot

    const inputRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Get userId và productId từ props user hoặc storage
    const userId = user?.id || JSON.parse(localStorage.getItem('user'))?.id || null;
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
        const loadInitialSuggestions = async () => {
            setSuggestionsLoading(true);
            try {
                const initialSuggestions = await QuestionSuggestions({
                    props: { userId, productId }
                });
                setSuggestions(initialSuggestions || []);
            } catch (error) {
                console.error('Error loading initial suggestions:', error);
                setSuggestions([]);
            } finally {
                setSuggestionsLoading(false);
            }
        };

        loadInitialSuggestions();
    }, [userId, productId]);

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
            const response = await botService.sendMessage({
                message: userMessage,
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

                // Load suggestions mới dựa trên phản hồi
                try {
                    setSuggestionsLoading(true);
                    const props = { userId, productId };
                    const newSuggestions = await QuestionSuggestions({ props, message: userMessage });
                    setSuggestions(newSuggestions);
                } catch (suggestionError) {
                    console.error("Error loading new suggestions:", suggestionError);
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

        console.log("Question clicked:", question);
        setInput(question);

        // Tự động gửi tin nhắn
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

    const handleCloseChat = () => {
        setShowChat(false);
    };

    const handleSwitchToStaff = () => {
        // Nếu có globalRoomId, thông báo cho parent trước khi chuyển
        if (!globalRoomId && userId) {
            // Tạo room trước khi chuyển sang staff chat
            chatService.createOrGetRoom(userId)
                .then(response => {
                    if (response.data?.success && response.data?.room) {
                        onRoomCreated?.(response.data.room.room_id);
                    }
                })
                .catch(error => {
                    console.error('Error creating room before switch:', error);
                })
                .finally(() => {
                    setChatType('staff');
                });
        } else {
            setChatType('staff');
        }
    };

    // Hàm xóa lịch sử chat
    const handleClearHistory = () => {
        if (window.confirm('Bạn có chắc chắn muốn xóa lịch sử chat không?')) {
            sessionStorage.removeItem(sessionKey);
            initializeWelcomeMessage();
        }
    };

    // Hàm export lịch sử chat
    const handleExportHistory = () => {
        try {
            const chatHistory = {
                userId: userId,
                productId: productId,
                messages: messages,
                exportTime: new Date().toISOString(),
                sessionKey: sessionKey
            };

            const dataStr = JSON.stringify(chatHistory, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });

            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `chat_history_${new Date().getTime()}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting chat history:', error);
            alert('Có lỗi xảy ra khi xuất lịch sử chat');
        }
    };

    return (
        <div className={styles.chatContainer}>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <span className="text-lg font-bold"><img src="public/images/bot/meow.gif" alt="" /></span>
                        </div>
                        {/* Dot trạng thái online */}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-400' : 'bg-gray-400'
                            }`}></div>
                    </div>
                    <div>
                        <h3 className="font-semibold text-lg">Trợ lý AI Luna</h3>
                        <p className="text-blue-100 text-sm">
                            {isLoading
                                ? 'Đang trả lời...'
                                : isOnline
                                    ? 'Đang hoạt động'
                                    : 'Không có sẵn'
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setChatType('staff')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Chuyển sang chat với nhân viên"
                    >
                        <span className="text-lg"><MdSupportAgent /></span>
                    </button>
                    <button
                        onClick={() => setShowChat(false)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
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