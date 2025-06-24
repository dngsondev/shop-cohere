import React, { useState, useEffect, useRef } from 'react';
import DisplayProducts from './DisplayProducts';
import styles from './Messages.module.scss';

function Messages({ messages }) {
    const [displayedMessages, setDisplayedMessages] = useState(messages);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        setDisplayedMessages(messages);
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    return (
        <div className={styles.messagesContainer}>
            {displayedMessages.map((msg, index) => (
                <div
                    key={index}
                    className={`${styles.messageWrapper} ${msg.sender === "user" ? styles.userMessage : styles.botMessage
                        }`}
                >
                    {msg.sender !== "user" && (
                        <div className={styles.botAvatar}>
                            {/* Sử dụng GIF avatar của bạn */}
                            <img
                                src="/images/bot/meow.gif"
                                alt="Luna Bot"
                                onError={(e) => {
                                    // Fallback nếu không tìm thấy GIF
                                    e.target.style.display = 'none';
                                    e.target.parentNode.innerHTML = '🤖';
                                }}
                            />
                        </div>
                    )}
                    <div
                        className={`${styles.messageContent} ${msg.sender === "user"
                            ? styles.userBubble
                            : (msg.content === "đang suy nghĩ..." || msg.text === "đang suy nghĩ...")
                                ? styles.thinkingBubble
                                : styles.botBubble
                            }`}
                    >
                        <div className={styles.messageText}>
                            {msg.content || msg.text || msg.message}
                            {(msg.content === "đang suy nghĩ..." || msg.text === "đang suy nghĩ...") && (
                                <div className={styles.thinkingDots}>
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            )}
                        </div>
                        {(msg.sender === "bot" || msg.sender === "ai") && msg.products && Object.keys(msg.products).length > 0 && (
                            <div className={styles.productsSection}>
                                <DisplayProducts products={msg.products} />
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}

export default Messages;