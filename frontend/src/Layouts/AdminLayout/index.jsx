import Sidebar from "../components/Sidebar";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import authService from "../../services/authService";
import adminService from "../../services/adminService";

function AdminLayout({ authConfig }) {
    const [isAdmin, setIsAdmin] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const checkAdminStatus = async () => {
            try {
                // SỬA: Kiểm tra admin bằng adminService
                const admin = adminService.getCurrentAdmin();
                const hasAdminRole = admin && (admin.role === 0 || admin.role === 1);
                const hasAdminToken = authService.hasToken();

                // Chỉ cho phép truy cập nếu là admin và có token
                setIsAdmin(hasAdminRole && hasAdminToken);
                setIsLoading(false);

                // Nếu không phải admin hoặc không có token, chuyển hướng luôn
                if (!(hasAdminRole && hasAdminToken)) {
                    navigate('/', { replace: true });
                }
            } catch (error) {
                console.error("Error checking admin status:", error);
                setIsLoading(false);
                setIsAdmin(false);
            }
        };

        checkAdminStatus();
    }, [navigate]);

    // Hiển thị loading khi đang kiểm tra
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
                </div>
            </div>
        );
    }

    // Nếu không phải admin, chuyển hướng về trang chủ
    if (isAdmin === false) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className="flex min-h-screen">
            <div className="bg-gray-100 border-r border-gray-200">
                <Sidebar />
            </div>
            <div className="flex-1 p-1">
                <Outlet />
            </div>
        </div>
    );
}

export default AdminLayout;