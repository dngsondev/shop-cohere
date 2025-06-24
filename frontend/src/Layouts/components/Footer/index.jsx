import styles from './Footer.module.scss';

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.container}>
                <div className={styles.section}>
                    <h3>DNGSON - Thời Trang Hiện Đại</h3>
                    <p>Địa chỉ: 123 Đường ABC, Phường Rạch Giá, Tỉnh An Giang, Việt Nam</p>
                    <p>Hotline: 0123 456 789</p>
                    <p>Email: support@dngson.vn</p>
                </div>
                <div className={styles.section}>
                    <h4>Liên kết nhanh</h4>
                    <ul>
                        <li><a href="/">Trang chủ</a></li>
                        <li><a href="/products">Sản phẩm</a></li>
                        <li><a href="/about">Giới thiệu</a></li>
                        <li><a href="/support">Liên hệ</a></li>
                    </ul>
                </div>
                <div className={styles.section}>
                    <h4>Kết nối với chúng tôi</h4>
                    <div className={styles.socials}>
                        <a href="#"><i className="fab fa-facebook-f"></i> Facebook</a>
                        <a href="#"><i className="fab fa-instagram"></i> Instagram</a>
                        <a href="#"><i className="fab fa-tiktok"></i> TikTok</a>
                    </div>
                </div>
            </div>
            <div className={styles.copyright}>
                &copy; {new Date().getFullYear()} DNGSON Fashion. All rights reserved.
            </div>
        </footer>
    );
}

export default Footer;