import React from 'react';
import { createPortal } from 'react-dom';
import styles from './About.module.scss';
import {
    FaTshirt,
    FaTrophy,
    FaShippingFast,
    FaGem,
    FaGlobe,
    FaMobileAlt,
    FaStore,
    FaStar,
    FaHeart,
    FaRocket,
    FaUsers,
    FaAward,
    FaCheckCircle,
    FaPercent,
    FaExchangeAlt,
    FaCrown,
    FaHandshake,
    FaRobot
} from 'react-icons/fa';
import {
    HiSparkles,
    HiLightningBolt
} from 'react-icons/hi';
import {
    RiPlanetFill,
    RiStarSLine
} from 'react-icons/ri';

const About = () => {
    const aboutContent = (
        <div className={styles.aboutWrapper}>
            <div className={styles.container}>
                {/* Floating Cosmic Icons */}
                <HiSparkles className={`${styles.floatingIcon} ${styles.icon1}`} />
                <RiPlanetFill className={`${styles.floatingIcon} ${styles.icon2}`} />
                <RiStarSLine className={`${styles.floatingIcon} ${styles.icon3}`} />
                <HiLightningBolt className={`${styles.floatingIcon} ${styles.icon4}`} />
                <FaStar className={`${styles.floatingIcon} ${styles.icon5}`} />
                <HiSparkles className={`${styles.floatingIcon} ${styles.icon6}`} />
                <RiPlanetFill className={`${styles.floatingIcon} ${styles.icon7}`} />
                <RiStarSLine className={`${styles.floatingIcon} ${styles.icon8}`} />

                {/* Hero Section */}
                <section className={styles.heroSection}>
                    <div className={styles.heroContent}>
                        <h1 className={styles.title}>DNGSON Fashion Universe</h1>
                        <p className={styles.subtitle}>Khám phá vũ trụ thời trang không giới hạn</p>
                    </div>
                </section>

                {/* About Section */}
                <section className={styles.aboutSection}>
                    <div className={styles.sectionContainer}>
                        <div className={styles.content}>
                            <h2 className={styles.sectionTitle}>Về Chúng Tôi</h2>
                            <div className={styles.aboutGrid}>
                                <div className={styles.aboutText}>
                                    <p className={styles.paragraph}>
                                        <strong>DNGSON</strong> - Thương hiệu thời trang hàng đầu với hơn 10 năm kinh nghiệm trong ngành công nghiệp
                                        <span className={styles.highlight}> thời trang cao cấp luxury</span>.
                                    </p>
                                    <p className={styles.paragraph}>
                                        Chúng tôi tự hào là đối tác tin cậy của hàng triệu khách hàng trên toàn quốc với hệ thống phân phối rộng khắp và dịch vụ chăm sóc khách hàng 24/7.
                                    </p>
                                </div>
                                <div className={styles.aboutImage}>
                                    <div className={styles.imageCard}>
                                        <div className={styles.iconContainer}>
                                            <FaHeart className={styles.cardIcon} />
                                        </div>
                                        <h3>Passion Fashion</h3>
                                        <p>Đam mê thời trang là động lực phát triển của chúng tôi</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className={styles.featuresSection}>
                    <div className={styles.sectionContainer}>
                        <div className={styles.content}>
                            <h2 className={styles.sectionTitle}>Điểm Nổi Bật</h2>
                            <div className={styles.featureGrid}>
                                <div className={styles.featureCard}>
                                    <div className={styles.iconContainer}>
                                        <FaTshirt className={styles.featureIcon} />
                                    </div>
                                    <h3>Thiết Kế Độc Quyền</h3>
                                    <p>Những mẫu thiết kế độc đáo, không trùng lặp được tạo ra bởi đội ngũ designer hàng đầu</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <div className={styles.iconContainer}>
                                        <FaTrophy className={styles.featureIcon} />
                                    </div>
                                    <h3>Chất Lượng Cao Cấp</h3>
                                    <p>Chất liệu premium, quy trình sản xuất nghiêm ngặt đảm bảo độ bền và thoải mái tối đa</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <div className={styles.iconContainer}>
                                        <FaShippingFast className={styles.featureIcon} />
                                    </div>
                                    <h3>Giao Hàng Nhanh</h3>
                                    <p>Hệ thống logistics hiện đại, giao hàng toàn quốc trong 1-2 ngày với dịch vụ 24/7</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <div className={styles.iconContainer}>
                                        <FaGem className={styles.featureIcon} />
                                    </div>
                                    <h3>Phụ Kiện Luxury</h3>
                                    <p>Bộ sưu tập phụ kiện cao cấp từ các thương hiệu danh tiếng trên thế giới</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <div className={styles.iconContainer}>
                                        <FaRobot className={styles.featureIcon} />
                                    </div>
                                    <h3>Chatbot Thông Minh</h3>
                                    <p>AI tư vấn thông minh 24/7, giúp bạn tìm kiếm sản phẩm phù hợp và hỗ trợ mua sắm tối ưu</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <div className={styles.iconContainer}>
                                        <FaCrown className={styles.featureIcon} />
                                    </div>
                                    <h3>Thương Hiệu Uy Tín</h3>
                                    <p>Được tin tưởng bởi hàng triệu khách hàng với chất lượng sản phẩm và dịch vụ xuất sắc</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <div className={styles.iconContainer}>
                                        <FaHandshake className={styles.featureIcon} />
                                    </div>
                                    <h3>Dịch Vụ Tận Tâm</h3>
                                    <p>Đội ngũ tư vấn chuyên nghiệp, hỗ trợ khách hàng 24/7 với sự nhiệt tình và chu đáo</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <div className={styles.iconContainer}>
                                        <FaPercent className={styles.featureIcon} />
                                    </div>
                                    <h3>Giá Cả Cạnh Tranh</h3>
                                    <p>Cam kết mang đến sản phẩm chất lượng cao với mức giá tốt nhất thị trường</p>
                                </div>
                                <div className={styles.featureCard}>
                                    <div className={styles.iconContainer}>
                                        <FaExchangeAlt className={styles.featureIcon} />
                                    </div>
                                    <h3>Đổi Trả Dễ Dàng</h3>
                                    <p>Chính sách đổi trả linh hoạt trong 7 ngày, hoàn tiền 100% nếu có lỗi đến từ sản phẩm</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services Section */}
                <section className={styles.servicesSection}>
                    <div className={styles.sectionContainer}>
                        <div className={styles.content}>
                            <h2 className={styles.sectionTitle}>Dịch Vụ Của Chúng Tôi</h2>
                            <div className={styles.serviceGrid}>
                                <div className={styles.serviceCard}>
                                    <div className={styles.serviceIconContainer}>
                                        <FaGlobe className={styles.serviceIcon} />
                                    </div>
                                    <div className={styles.serviceContent}>
                                        <h4>E-commerce Platform</h4>
                                        <p>Nền tảng mua sắm trực tuyến hiện đại với giao diện thân thiện và bảo mật cao</p>
                                    </div>
                                </div>
                                <div className={styles.serviceCard}>
                                    <div className={styles.serviceIconContainer}>
                                        <FaMobileAlt className={styles.serviceIcon} />
                                    </div>
                                    <div className={styles.serviceContent}>
                                        <h4>Mobile App</h4>
                                        <p>Ứng dụng di động với đầy đủ tính năng mua sắm và theo dõi đơn hàng</p>
                                    </div>
                                </div>
                                <div className={styles.serviceCard}>
                                    <div className={styles.serviceIconContainer}>
                                        <FaStore className={styles.serviceIcon} />
                                    </div>
                                    <div className={styles.serviceContent}>
                                        <h4>Physical Stores</h4>
                                        <p>Hệ thống cửa hàng trải dài khắp cả nước với không gian mua sắm sang trọng</p>
                                    </div>
                                </div>
                                <div className={styles.serviceCard}>
                                    <div className={styles.serviceIconContainer}>
                                        <FaStar className={styles.serviceIcon} />
                                    </div>
                                    <div className={styles.serviceContent}>
                                        <h4>Personal Styling</h4>
                                        <p>Dịch vụ tư vấn phong cách cá nhân từ các chuyên gia thời trang hàng đầu</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Statistics Section */}
                <section className={styles.statsSection}>
                    <div className={styles.sectionContainer}>
                        <div className={styles.content}>
                            <h2 className={styles.sectionTitle}>Con Số Ấn Tượng</h2>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIconContainer}>
                                        <FaAward className={styles.statIcon} />
                                    </div>
                                    <div className={styles.statNumber}>10+</div>
                                    <div className={styles.statLabel}>Năm Kinh Nghiệm</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIconContainer}>
                                        <FaUsers className={styles.statIcon} />
                                    </div>
                                    <div className={styles.statNumber}>1M+</div>
                                    <div className={styles.statLabel}>Khách Hàng Tin Tưởng</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIconContainer}>
                                        <FaStore className={styles.statIcon} />
                                    </div>
                                    <div className={styles.statNumber}>50+</div>
                                    <div className={styles.statLabel}>Cửa Hàng Toàn Quốc</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIconContainer}>
                                        <FaCheckCircle className={styles.statIcon} />
                                    </div>
                                    <div className={styles.statNumber}>99%</div>
                                    <div className={styles.statLabel}>Khách Hàng Hài Lòng</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Mission Section */}
                <section className={styles.missionSection}>
                    <div className={styles.sectionContainer}>
                        <div className={styles.content}>
                            <h2 className={styles.sectionTitle}>Sứ Mệnh & Tầm Nhìn</h2>
                            <div className={styles.missionGrid}>
                                <div className={styles.missionCard}>
                                    <div className={styles.missionIconContainer}>
                                        <FaHeart className={styles.missionIcon} />
                                    </div>
                                    <h3>Sứ Mệnh</h3>
                                    <p>Mang đến cho mọi người phong cách thời trang độc đáo, chất lượng cao với giá cả hợp lý.
                                        Tạo ra những trải nghiệm mua sắm tuyệt vời và góp phần nâng cao vẻ đẹp, sự tự tin của khách hàng.</p>
                                </div>
                                <div className={styles.missionCard}>
                                    <div className={styles.missionIconContainer}>
                                        <FaRocket className={styles.missionIcon} />
                                    </div>
                                    <h3>Tầm Nhìn</h3>
                                    <p>Trở thành thương hiệu thời trang hàng đầu Đông Nam Á, tiên phong trong việc ứng dụng
                                        công nghệ và xu hướng bền vững vào ngành thời trang hiện đại.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer Section */}
                <section className={styles.footerSection}>
                    <div className={styles.sectionContainer}>
                        <div className={styles.footerContent}>
                            <div className={styles.footerIconContainer}>
                                <HiSparkles className={styles.footerIcon} />
                            </div>
                            <p className={styles.footerText}>
                                Cảm ơn bạn đã tin tưởng và lựa chọn DNGSON
                            </p>
                            <p className={styles.footerSubtext}>
                                Hãy cùng chúng tôi tạo nên phong cách riêng biệt của bạn trong vũ trụ thời trang!
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );

    return createPortal(aboutContent, document.body);
};

export default About;
