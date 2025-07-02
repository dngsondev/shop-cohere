import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import styles from './ChatBubble.module.scss';

function ChatBubble({ onClick, isOpen }) {
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        let showTimer;
        let interval;

        function showWelcomeLoop() {
            setShowWelcome(true);
            showTimer = setTimeout(() => {
                setShowWelcome(false);
                interval = setTimeout(showWelcomeLoop, 30000);
            }, 5000);
        }

        if (!isOpen) {
            showWelcomeLoop();
        } else {
            setShowWelcome(false);
        }

        return () => {
            clearTimeout(showTimer);
            clearTimeout(interval);
        };
    }, [isOpen]);

    const handleClick = () => {
        setShowWelcome(false);
        onClick();
    };

    return (
        <div className={styles.chatBubbleContainer}>
            <div className={styles.bubbleWrapper}>
                {/* Welcome Message */}
                <AnimatePresence>
                    {showWelcome && !isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.8 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.8 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className={styles.welcomeMessage}
                        >
                            {/* <div className={styles.welcomeAvatar}>
                                <img
                                    src="/images/bot/meow.gif"
                                    alt="Bot"
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = '🤖';
                                        e.target.parentElement.className += ' flex items-center justify-center text-lg';
                                    }}
                                />
                            </div> */}
                            <div className={styles.welcomeContent}>
                                <div className={styles.welcomeTitle}>
                                    Xin chào! <span role="img" aria-label="wave">👋</span>
                                </div>
                                <div className={styles.welcomeDesc}>
                                    Tôi có thể hỗ trợ bạn tìm kiếm sản phẩm và giải đáp thắc mắc
                                </div>
                            </div>
                            <button className={styles.welcomeClose} onClick={() => setShowWelcome(false)}>
                                <FaTimes />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Main Chat GIF Button */}
                <motion.div
                    onClick={handleClick}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={styles.chatGifButton}
                    title="Mở trợ lý AI"
                >
                    <div className={styles.bubbleButton}>
                        <img
                            src="/images/bot/meow.gif"
                            alt="Chat Bot"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl">🤖</div>';
                            }}
                        />
                        <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20"></div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default ChatBubble;
