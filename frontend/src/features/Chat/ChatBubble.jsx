import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import styles from './ChatBubble.module.scss';

function ChatBubble({ onClick, isOpen }) {
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            const timer = setTimeout(() => {
                setShowWelcome(true);
            }, 2000);

            return () => clearTimeout(timer);
        } else {
            setShowWelcome(false);
        }
    }, [isOpen]);

    const handleClick = () => {
        setShowWelcome(false);
        onClick();
    };

    return (
        <div className={styles.chatBubbleContainer}>
            {/* Welcome Message */}
            <AnimatePresence>
                {showWelcome && !isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.8 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="mb-4 mr-2"
                    >
                        <div className="relative">
                            <div className="bg-white rounded-2xl p-4 shadow-xl border border-gray-100 max-w-xs">
                                <div className="flex items-start space-x-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100">
                                            <img
                                                src="/images/bot/meow.gif"
                                                alt="Bot"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentElement.innerHTML = '🤖';
                                                    e.target.parentElement.className += ' flex items-center justify-center text-lg';
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-gray-800 text-sm font-medium mb-1">
                                            Xin chào! 👋
                                        </div>
                                        <div className="text-gray-600 text-xs leading-relaxed">
                                            Tôi có thể hỗ trợ bạn tìm kiếm sản phẩm và giải đáp thắc mắc
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowWelcome(false)}
                                        className="text-gray-400 hover:text-gray-600 text-xs"
                                    >
                                        <FaTimes />
                                    </button>
                                </div>
                            </div>
                            {/* Speech bubble arrow */}
                            <div className="absolute bottom-[-6px] right-6">
                                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-white border-r-[6px] border-r-transparent"></div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Chat GIF Button */}
            <motion.div
                onClick={handleClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative cursor-pointer group chat-gif-button"
                title="Mở trợ lý AI"
            >
                {/* GIF Button */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden shadow-xl border-4 border-white bg-white group-hover:shadow-2xl transition-all duration-300">
                    <img
                        src="/images/bot/meow.gif"
                        alt="Chat Bot"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // Fallback nếu không load được GIF
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl">🤖</div>';
                        }}
                    />
                    {/* Pulse effect */}
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20"></div>
                </div>
            </motion.div>
        </div>
    );
}

export default ChatBubble;
