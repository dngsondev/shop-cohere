import React, { useState, useEffect, useRef } from 'react';
import styles from './BotSuggestQuestions.module.scss';

const BotSuggestQuestions = ({ suggestions, onQuestionClick, isLoading = false }) => {
    const [questions, setQuestions] = useState([]);
    const [isVisible, setIsVisible] = useState(false);
    const scrollContainerRef = useRef(null);
    const [isHovering, setIsHovering] = useState(false);

    // Xử lý dữ liệu gợi ý - giữ nguyên full text
    useEffect(() => {
        if (suggestions && suggestions.length > 0) {
            const processedQuestions = suggestions.map((suggestion, index) => {
                if (typeof suggestion === 'string') {
                    return {
                        id: index,
                        text: suggestion, // Hiển thị full text
                        fullText: suggestion
                    };
                }
                return {
                    id: index,
                    text: suggestion.text || suggestion, // Hiển thị full text
                    fullText: suggestion.text || suggestion
                };
            });
            setQuestions(processedQuestions);
        } else {
            setQuestions([]);
        }
    }, [suggestions]);

    // Hiển thị với animation
    useEffect(() => {
        if (questions.length > 0) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 200);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [questions]);

    const handleQuestionClick = (question) => {
        if (onQuestionClick) {
            onQuestionClick(question.fullText);
        }
    };

    // Tạo duplicate items để animation mượt mà hơn
    const duplicatedQuestions = [...questions, ...questions];

    if (isLoading) {
        return (
            <div className={styles.suggestionContainer}>
                <div className={styles.suggestionLoading}>
                    <span className={styles.loadingText}>Đang tải gợi ý</span>
                    <div className={styles.loadingDots}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
        );
    }

    if (questions.length === 0) {
        return null;
    }

    return (
        <div
            className={`${styles.suggestionContainer} ${isVisible ? styles.visible : ''}`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
        >
            <div
                ref={scrollContainerRef}
                className={styles.suggestionScrollContainer}
            >
                <div
                    className={`${styles.suggestionItemsContainer} ${questions.length > 3 ? styles.manyItems : ''
                        }`}
                    style={{
                        animationPlayState: isHovering ? 'paused' : 'running'
                    }}
                >
                    {duplicatedQuestions.map((question, index) => (
                        <button
                            key={`${question.id}-${index}`}
                            className={styles.suggestionItem}
                            onClick={() => handleQuestionClick(question)}
                            title={question.fullText}
                        >
                            <span className={styles.suggestionIcon}>💡</span>
                            <span className={styles.suggestionText}>
                                {question.text}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BotSuggestQuestions;
