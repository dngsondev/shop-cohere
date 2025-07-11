// import PrivateRoute from "../components/PrivateRoute/PrivateRoute";

//Layout
import { AdminLayout, DefaultLayout } from '../Layouts';

import Home from '../pages/Home';
// import AdminHome from '../pages/AdminHome'
import Product from '../pages/Product';
import ProductDetail from '../pages/ProductDetail';
import Profile from '../pages/Profile';
import Cart from '../pages/Cart';
import Order from '../pages/Order';

// Import ZaloPayResult component
import { VnpayResult } from '../features/Order';

// Import tìm kiếm sản phẩm
import { ProductSearch } from '../features/Products';

import { SizeTable, About, Support, CollectionProducts } from '../components';

import { ResetPassword } from '../features/Auth';

import {
    Commands,
    AdminProduct,
    ReplyReviews,
    AdminOrder,
    AdminChat,
    AdminUser,
    AdminDashboard,
    VoucherManager,
    CollectionManager
} from '../features/Manage';

// Đảm bảo import chính xác các layout
const publicRoutes = [
    { path: '/', component: Home, layout: DefaultLayout },
    { path: '/size', component: SizeTable, layout: DefaultLayout },
    { path: '/product/:id', component: ProductDetail, layout: DefaultLayout },
    { path: '/products', component: Product, layout: DefaultLayout },
    { path: '/search', component: ProductSearch, layout: DefaultLayout },
    { path: '/about', component: About, layout: null },
    { path: '/support', component: Support, layout: null },
    { path: '/collections/:id', component: CollectionProducts, layout: DefaultLayout },
    { path: '/reset-password', component: ResetPassword, layout: null }
];

const privateRoutes = [
    { path: '/admin/bot', component: Commands, layout: AdminLayout },
    { path: '/admin/products', component: AdminProduct, layout: AdminLayout },
    { path: '/admin/review-reply', component: ReplyReviews, layout: AdminLayout },
    { path: '/admin/orders', component: AdminOrder, layout: AdminLayout },
    { path: '/admin/chat', component: AdminChat, layout: AdminLayout },
    { path: '/admin/users', component: AdminUser, layout: AdminLayout },
    { path: '/admin/voucher', component: VoucherManager, layout: AdminLayout },
    { path: '/admin/collections', component: CollectionManager, layout: AdminLayout },
    { path: '/admin', component: AdminDashboard, layout: AdminLayout },


    { path: '/profile', component: Profile, layout: DefaultLayout },
    { path: '/profile/address', component: Profile, layout: DefaultLayout },
    { path: '/profile/privacy', component: Profile, layout: DefaultLayout },
    { path: '/profile/orders', component: Profile, layout: DefaultLayout },
    { path: '/profile/password', component: Profile, layout: DefaultLayout },
    // { path: '/order-detail/:id', component: Profile, layout: DefaultLayout },

    { path: '/cart/:id', component: Cart, layout: DefaultLayout },
    { path: '/order', component: Order, layout: DefaultLayout },
    { path: '/order/vnpay-result', component: VnpayResult, layout: DefaultLayout },
];

export { publicRoutes, privateRoutes };