import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { QuestionSuggestions } from "../../utils/chatUtils";
import ChatBot from "./ChatBot";
import StaffChat from "./StaffChat";
import ChatBubble from "./ChatBubble";

function ChatWindow({ children, showChat, setShowChat }) {
    const renderCount = useRef(0);
    renderCount.current += 1;

    const [props, setProps] = useState({
        productId: null,
        userId: null,
        user: null
    });
    const [chatType, setChatType] = useState('bot');
    const [globalRoomId, setGlobalRoomId] = useState(null); // 🔑 SHARED ROOM STATE
    const eventHandlerRef = useRef(null);

    useEffect(() => {
        eventHandlerRef.current = async () => {
            try {
                let userId = null;
                let productId = null;
                let user = null;

                if (localStorage.getItem('user')) {
                    user = JSON.parse(localStorage.getItem('user'));
                    userId = user.id;
                }

                if (sessionStorage.getItem('productId')) {
                    productId = JSON.parse(sessionStorage.getItem('productId'));
                }

                const updatedProps = { userId, productId, user };
                setProps(updatedProps);
            } catch (error) {
                console.error("Error in updatePropsFromSession:", error);
            }
        };

        eventHandlerRef.current();

        const updatePropsFromSession = () => {
            if (eventHandlerRef.current) {
                eventHandlerRef.current();
            }
        };

        window.addEventListener('storage', updatePropsFromSession);
        window.addEventListener('productIdChanged', updatePropsFromSession);

        return () => {
            window.removeEventListener('storage', updatePropsFromSession);
            window.removeEventListener('productIdChanged', updatePropsFromSession);
        };
    }, []);

    const handleChatToggle = () => {
        setShowChat(!showChat);
    };

    const handleChatTypeChange = (type) => {
        console.log("🔄 ChatWindow: Changing chat type to:", type);
        setChatType(type);
        // KHÔNG reset globalRoomId khi chuyển đổi
    };

    // 🔑 Handler cho room creation/update
    const handleRoomCreated = (roomId) => {
        console.log(`🏠 Room created/found: ${roomId}`);
        setGlobalRoomId(roomId);
    };

    return (
        <>
            {/* Main App Content */}
            {children}

            {/* Chat Bubble - Chỉ hiện khi chat đóng */}
            {!showChat && (
                <ChatBubble onClick={handleChatToggle} isOpen={showChat} />
            )}

            {/* Chat Window Overlay - Chỉ mount khi showChat = true */}
            <AnimatePresence>
                {showChat && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed bottom-6 right-6 z-[9998] w-96 h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-8rem)]"
                        style={{ marginBottom: '80px' }}
                    >
                        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden h-full">
                            {/* Render Bot hoặc Staff trong cùng 1 khung */}
                            {chatType === 'bot' ? (
                                <ChatBot
                                    setShowChat={setShowChat}
                                    chatType={chatType}
                                    setChatType={handleChatTypeChange}
                                    user={props.user}
                                    globalRoomId={globalRoomId} // 🔑 PASS GLOBAL ROOM
                                    onRoomCreated={handleRoomCreated} // 🔑 PASS HANDLER
                                />
                            ) : (
                                <StaffChat
                                    setShowChat={setShowChat}
                                    chatType={chatType}
                                    setChatType={handleChatTypeChange}
                                    user={props.user}
                                    globalRoomId={globalRoomId} // 🔑 PASS GLOBAL ROOM
                                    onRoomCreated={handleRoomCreated} // 🔑 PASS HANDLER
                                />
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

export default ChatWindow;
