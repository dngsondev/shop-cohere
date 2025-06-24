import React, { useState } from 'react';
import { FaQuestionCircle, FaPhone, FaEnvelope, FaMapMarkerAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { MdSupport, MdContactSupport } from 'react-icons/md';
import styles from './Support.module.scss';

const Support = () => {
    const [activeTab, setActiveTab] = useState('faq');
    const [expandedFAQ, setExpandedFAQ] = useState(null);

    const faqData = [
        {
            question: "Làm thế nào để đặt hàng?",
            answer: "Bạn có thể đặt hàng bằng cách thêm sản phẩm vào giỏ hàng và tiến hành thanh toán. Chúng tôi hỗ trợ nhiều phương thức thanh toán khác nhau như thẻ tín dụng, chuyển khoản ngân hàng, và thanh toán khi nhận hàng."
        },
        {
            question: "Chính sách đổi trả như thế nào?",
            answer: "Chúng tôi hỗ trợ đổi trả trong vòng 7 ngày kể từ ngày nhận hàng với điều kiện sản phẩm còn nguyên tem mác và chưa qua sử dụng. Khách hàng vui lòng liên hệ hotline để được hướng dẫn chi tiết."
        },
        {
            question: "Thời gian giao hàng bao lâu?",
            answer: "Thời gian giao hàng từ 2-5 ngày làm việc tùy theo khu vực. Đối với nội thành các thành phố lớn, thời gian giao hàng từ 1-2 ngày. Các khu vực xa có thể mất 3-5 ngày."
        },
        {
            question: "Làm sao để kiểm tra kích thước phù hợp?",
            answer: "Bạn có thể tham khảo bảng kích thước chi tiết của chúng tôi hoặc liên hệ với bộ phận tư vấn để được hỗ trợ chọn size phù hợp. Chúng tôi cũng có chính sách đổi size miễn phí."
        },
        {
            question: "Có những phương thức thanh toán nào?",
            answer: "Chúng tôi hỗ trợ đa dạng phương thức thanh toán: Thẻ tín dụng/ghi nợ, Chuyển khoản ngân hàng, Ví điện tử (MoMo, ZaloPay), và Thanh toán khi nhận hàng (COD)."
        },
        {
            question: "Làm thế nào để theo dõi đơn hàng?",
            answer: "Sau khi đặt hàng thành công, bạn sẽ nhận được mã theo dõi qua email hoặc SMS. Bạn có thể kiểm tra trạng thái đơn hàng trong mục 'Đơn hàng của tôi' hoặc liên hệ hotline."
        }
    ];

    const toggleFAQ = (index) => {
        setExpandedFAQ(expandedFAQ === index ? null : index);
    };

    const renderFAQ = () => (
        <div className={styles.faqContainer}>
            <div className={styles.faqHeader}>
                <MdSupport className={styles.faqIcon} />
                <h3>Câu hỏi thường gặp</h3>
                <p>Tìm câu trả lời cho những thắc mắc phổ biến</p>
            </div>
            <div className={styles.faqList}>
                {faqData.map((item, index) => (
                    <div key={index} className={`${styles.faqItem} ${expandedFAQ === index ? styles.expanded : ''}`}>
                        <div className={styles.faqQuestion} onClick={() => toggleFAQ(index)}>
                            <h4>{item.question}</h4>
                            <span className={styles.faqToggle}>
                                {expandedFAQ === index ? <FaChevronUp /> : <FaChevronDown />}
                            </span>
                        </div>
                        <div className={styles.faqAnswer}>
                            <p>{item.answer}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderContact = () => (
        <div className={styles.contactContainer}>
            <div className={styles.contactHeader}>
                <MdContactSupport className={styles.contactHeaderIcon} />
                <h3>Thông tin liên hệ</h3>
                <p>Nhiều cách để kết nối với chúng tôi</p>
            </div>
            <div className={styles.contactGrid}>
                <div className={styles.contactCard}>
                    <div className={styles.contactCardHeader}>
                        <FaPhone className={styles.contactIcon} />
                        <h4>Hotline</h4>
                    </div>
                    <div className={styles.contactDetails}>
                        <p className={styles.primaryContact}>1900 1234</p>
                        <span className={styles.contactNote}>(Miễn phí)</span>
                        <p>0123 456 789</p>
                        <span className={styles.workingHours}>Thời gian: 8:00 - 22:00</span>
                    </div>
                </div>

                <div className={styles.contactCard}>
                    <div className={styles.contactCardHeader}>
                        <FaEnvelope className={styles.contactIcon} />
                        <h4>Email</h4>
                    </div>
                    <div className={styles.contactDetails}>
                        <p className={styles.primaryContact}>support@dngson.com</p>
                        <span className={styles.contactNote}>Hỗ trợ khách hàng</span>
                        <p>info@dngson.com</p>
                        <span className={styles.workingHours}>Phản hồi trong 24h</span>
                    </div>
                </div>

                <div className={styles.contactCard}>
                    <div className={styles.contactCardHeader}>
                        <FaMapMarkerAlt className={styles.contactIcon} />
                        <h4>Địa chỉ</h4>
                    </div>
                    <div className={styles.contactDetails}>
                        <p className={styles.primaryContact}>123 Đường ABC, Phường Rạch Giá</p>
                        <p>Tỉnh Kiên Giang, Việt Nam</p>
                        <span className={styles.workingHours}>Thứ 2 - Thứ 7: 9:00 - 17:00</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className={styles.supportPage}>
            <div className={styles.backgroundPattern}></div>
            <div className="container mx-auto px-4 py-8">
                <div className={styles.supportHeader}>
                    <div className={styles.headerContent}>
                        <h1>Trung tâm hỗ trợ</h1>
                        <p>Chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
                    </div>
                </div>

                <div className={styles.supportTabs}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'faq' ? styles.active : ''}`}
                        onClick={() => setActiveTab('faq')}
                    >
                        <FaQuestionCircle />
                        <span>FAQ</span>
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'contact' ? styles.active : ''}`}
                        onClick={() => setActiveTab('contact')}
                    >
                        <FaPhone />
                        <span>Liên hệ</span>
                    </button>
                </div>

                <div className={styles.supportContent}>
                    {activeTab === 'faq' && renderFAQ()}
                    {activeTab === 'contact' && renderContact()}
                </div>
            </div>
        </div>
    );
};

export default Support;