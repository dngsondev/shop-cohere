import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { CgMenu } from "react-icons/cg";
import { AiOutlineSearch } from "react-icons/ai";
import { RiShoppingCart2Line } from "react-icons/ri";

import cartService from '../../../services/cartService';
import productService from '../../../services/productService';

import { getFullImageUrl } from '../../../utils/imageUtils';

import styles from './Header.module.scss';

const navLinks = [
    { label: "Sản phẩm", to: "/products" },
    { label: "Bảng kích thước", to: "/size" },
    { label: "Hỗ trợ", to: "/support" },
    { label: "Giới thiệu", to: "/about" },
];

const Header = React.memo(({ setLogin }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchActive, setSearchActive] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggest, setShowSuggest] = useState(false);
    const [userInfo, setUserInfo] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user')) || null;
        } catch {
            return null;
        }
    });
    const [cartQuantity, setCartQuantity] = useState(0);

    const customerData = localStorage.getItem("user");
    const customer = customerData ? JSON.parse(customerData) : null;
    const customerId = customer ? customer.id : null;

    const location = useLocation();
    const navigate = useNavigate();
    const inputRef = useRef();

    // Effect để theo dõi thay đổi trong localStorage
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'user' || e.key === null) {
                try {
                    const newUserInfo = JSON.parse(localStorage.getItem('user')) || null;
                    console.log('🔄 User info updated in header:', newUserInfo);
                    setUserInfo(newUserInfo);
                } catch {
                    setUserInfo(null);
                }
            }

            if (e.key === 'cartQuantity') {
                const storedQuantity = localStorage.getItem('cartQuantity');
                if (storedQuantity) {
                    setCartQuantity(Number(storedQuantity));
                }
            }
        };

        // Custom event để refresh user khi cập nhật từ profile
        const handleUserUpdate = () => {
            try {
                const newUserInfo = JSON.parse(localStorage.getItem('user')) || null;
                console.log('👤 User updated via custom event:', newUserInfo);
                setUserInfo(newUserInfo);
            } catch {
                setUserInfo(null);
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('userUpdated', handleUserUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('userUpdated', handleUserUpdate);
        };
    }, []);

    useEffect(() => {
        const refreshCartCount = async () => {
            if (customerId) {
                try {
                    const response = await cartService.getQuantity(customerId);
                    if (response && response.data && response.data[0]) {
                        const quantity = response.data[0].total_quantity;
                        setCartQuantity(quantity);
                    }
                } catch (error) {
                    console.error("Error fetching cart quantity:", error);
                    setCartQuantity(0);
                }
            } else {
                setCartQuantity(0);
            }
        };

        refreshCartCount();
    }, [customerId]);

    // Gợi ý sản phẩm khi nhập
    const handleSearchInput = async (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value.trim()) {
            const res = await productService.suggestProducts(value.trim());
            setSuggestions(res.data || []);
            setShowSuggest(true);
        } else {
            setSuggestions([]);
            setShowSuggest(false);
        }
    };

    const handleSearchClick = () => {
        if (!searchActive) {
            setSearchActive(true);
            setTimeout(() => inputRef.current?.focus(), 100);
        } else if (searchTerm.trim()) {
            navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
            setSearchActive(false);
            setSearchTerm('');
        }
    };

    const handleSuggestionClick = (name) => {
        setSearchTerm('');
        setShowSuggest(false);
        navigate(`/search?q=${encodeURIComponent(name)}`);
    };

    const handleBlur = () => setTimeout(() => setShowSuggest(false), 100);

    const isCartPage = location.pathname.includes('/cart');

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-blue-50 via-white to-blue-100 shadow-lg">
            {/* Overlay cho menu mobile */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-40 animate-fadeIn"
                    onClick={() => setMenuOpen(false)}
                />
            )}
            <div className="container mx-auto flex items-center h-20 px-2 md:px-8">
                {/* Logo */}
                <div className="flex items-center w-1/4">
                    <button
                        className="md:hidden p-2 rounded-md hover:bg-blue-100 transition"
                        onClick={() => setMenuOpen(!menuOpen)}
                        aria-label="Open menu"
                    >
                        <CgMenu className={`text-3xl transition-transform ${menuOpen ? 'rotate-90' : ''}`} />
                    </button>
                    <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                        <span className={styles.logo}>DNGSON</span>
                    </Link>
                </div>
                {/* Nav desktop */}
                <nav className="hidden md:flex items-center w-2/4 justify-center gap-8">
                    {navLinks.map(link => (
                        <Link
                            key={link.label}
                            to={link.to}
                            className="text-base font-medium text-gray-700 hover:text-blue-600 px-2 py-1 rounded transition"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
                {/* Search, Cart, User */}
                <div className="flex items-center w-3/4 md:w-1/4 justify-end gap-4 relative">
                    {/* Search box tách biệt, không ảnh hưởng cart/avatar */}
                    <div>
                        <div
                            className={`flex items-center transition-all duration-300 ${searchActive ? "w-64" : "w-10"} overflow-hidden bg-white border border-blue-200 rounded-lg shadow-sm ${styles['search-bar']} ${searchActive ? styles.active : ""}`}
                        >
                            {searchActive && (
                                <>
                                    <button
                                        className="p-2 text-gray-400 hover:text-blue-600 text-xl"
                                        onClick={() => { setSearchActive(false); setSearchTerm(''); }}
                                        tabIndex={-1}
                                        aria-label="Đóng tìm kiếm"
                                    >&#10005;</button>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        className="flex-1 px-3 py-2 border-none outline-none bg-transparent text-base"
                                        placeholder="Tìm kiếm sản phẩm..."
                                        value={searchTerm}
                                        onChange={handleSearchInput}
                                        onFocus={() => suggestions.length > 0 && setShowSuggest(true)}
                                        onBlur={handleBlur}
                                        autoFocus
                                    />
                                </>
                            )}
                            <button
                                className="p-2 text-blue-700 hover:bg-blue-100 rounded-full transition"
                                onClick={() => {
                                    if (!searchActive) {
                                        setSearchActive(true);
                                        setTimeout(() => inputRef.current?.focus(), 100);
                                    } else if (searchTerm.trim()) {
                                        navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                                        setSearchActive(false);
                                        setSearchTerm('');
                                    } else {
                                        setSearchActive(false);
                                    }
                                }}
                                aria-label="Search"
                            >
                                <AiOutlineSearch className="text-2xl" />
                            </button>
                            {showSuggest && suggestions.length > 0 && (
                                <ul
                                    className="absolute left-0 right-0 top-full bg-white border rounded shadow-lg z-50 max-h-60 overflow-y-auto"
                                    style={{ minWidth: '100%' }}
                                >
                                    {suggestions.map(item => (
                                        <li
                                            key={item.product_id}
                                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer flex items-center gap-2 transition"
                                            onMouseDown={() => handleSuggestionClick(item.product_name)}
                                        >
                                            <span className="font-medium text-gray-700">{item.product_name}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    {/* Cart */}
                    {userInfo && userInfo.username && (
                        <div
                            className="relative flex items-center justify-center cursor-pointer group"
                            style={{ visibility: isCartPage ? 'hidden' : 'visible' }}
                            onClick={() => {
                                if (customerId) {
                                    window.location.href = `/cart/${customerId}`;
                                }
                            }}
                        >
                            <RiShoppingCart2Line className="text-3xl text-blue-700 group-hover:text-blue-900 transition" />
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white shadow">
                                {cartQuantity}
                            </div>
                        </div>
                    )}
                    {/* Avatar */}
                    {userInfo && userInfo.username ? (
                        <Link to="/profile">
                            <div className="relative">
                                <img
                                    className="w-10 h-10 rounded-full border-2 border-blue-400 shadow hover:scale-105 transition object-cover"
                                    src={getFullImageUrl(userInfo.avatar || '/images/avatar/avatar-default.png')}
                                    alt="avatar"
                                    onLoad={() => {
                                        console.log('✅ Header avatar loaded:', userInfo.avatar);
                                    }}
                                    onError={(e) => {
                                        console.error('❌ Header avatar failed to load:', userInfo.avatar);
                                        // Fallback to initials
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                {/* Fallback avatar with initials */}
                                <div
                                    className="absolute inset-0 w-10 h-10 rounded-full border-2 border-blue-400 shadow bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-bold hidden"
                                >
                                    {(userInfo.fullname || userInfo.username || 'U').charAt(0).toUpperCase()}
                                </div>
                            </div>
                        </Link>
                    ) : (
                        <button
                            onClick={() => setLogin(true)}
                            className={`${styles.loginBtn} ml-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition`}
                        >
                            Đăng nhập
                        </button>
                    )}
                </div>
            </div>
            {/* Nav mobile */}
            {menuOpen && (
                <div className={styles.menuOverlay} onClick={() => setMenuOpen(false)}>
                    <nav
                        className={styles.menuDrawer}
                        onClick={e => e.stopPropagation()} // Để bấm trong menu không đóng overlay
                    >
                        <button className={styles.menuClose} onClick={() => setMenuOpen(false)}>×</button>
                        <div className={styles.menuList}>
                            <Link to="/products" className={styles.menuItem} onClick={() => setMenuOpen(false)}>Sản phẩm</Link>
                            <Link to="/size" className={styles.menuItem} onClick={() => setMenuOpen(false)}>Bảng kích thước</Link>
                            <Link to="/support" className={styles.menuItem} onClick={() => setMenuOpen(false)}>Hỗ trợ</Link>
                            <Link to="/about" className={styles.menuItem} onClick={() => setMenuOpen(false)}>Giới thiệu</Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
});

export default Header;