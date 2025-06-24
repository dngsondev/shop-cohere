import { useState, useEffect } from "react";
import adminSevice from "../../../services/adminService";
import { getWordReader } from "../../../utils/WordReaderUtil";

function Commands() {
    const [command, setCommand] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateStatus, setUpdateStatus] = useState(null);

    useEffect(() => {
        const fetchCommands = async () => {
            try {
                setLoading(true);
                setError(null);
                const token = localStorage.getItem('token');
                const res = await adminSevice.getCommands(token);
                if (res.data && res.data.length > 0) {
                    setCommand(res.data[0].contents || "");
                } else {
                    setCommand("");
                }
            } catch (error) {
                setError(`Không thể tải dữ liệu: ${error.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchCommands();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setUpdateStatus("Đang cập nhật...");
            await adminSevice.updateCommands(command);
            setUpdateStatus("Đã cập nhật thành công!");
            setTimeout(() => setUpdateStatus(null), 3000);
        } catch (error) {
            setUpdateStatus(`Lỗi: ${error.message}`);
        }
    };

    const handleFile = async (e) => {
        const file = e.target.files[0];
        try {
            const text = await getWordReader(file);
            // Thêm nội dung file vào cuối nội dung hiện tại, cách ra 1 dòng nếu có sẵn nội dung
            setCommand(prev => prev ? prev + "\n" + text : text);
        } catch (err) {
            alert("Không thể đọc file: " + err);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-80">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500 mb-4"></div>
                <span className="text-blue-600 text-lg">Đang tải dữ liệu...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center p-8">
                <h2 className="text-xl font-bold text-red-600 mb-2">Đã xảy ra lỗi</h2>
                <p className="mb-4 text-red-500">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Tải lại trang
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto mt-8 bg-white shadow-lg rounded-lg p-8">
            <h2 className="text-3xl font-bold mb-6 text-blue-700">Cấu hình Lệnh AI</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-6 w-full">
                    <label className="block text-gray-800 font-semibold mb-2" htmlFor="command">
                        Lệnh Chatbot
                    </label>
                    <div className="w-full">
                        <textarea
                            id="command"
                            value={command}
                            onChange={(e) => setCommand(e.target.value)}
                            rows={12}
                            className="w-full px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 transition resize-none"
                            placeholder="Nhập lệnh cho chatbot hoặc tải file lên..."
                        />
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition w-full sm:w-auto"
                    >
                        Lưu lệnh
                    </button>
                    <label className="flex items-center w-full sm:w-auto">
                        <span className="bg-gray-100 border border-gray-300 rounded px-3 py-2 mr-2 text-gray-700 hover:bg-gray-200 transition block w-full sm:w-auto text-center">
                            Tải file .docx/.txt
                        </span>
                        <input
                            type="file"
                            accept=".docx, .txt"
                            className="hidden"
                            onChange={handleFile}
                        />
                    </label>
                    {updateStatus && (
                        <span className={`text-sm font-medium ${updateStatus.includes('Lỗi') ? 'text-red-500' : 'text-green-600'} w-full sm:w-auto text-center`}>
                            {updateStatus}
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}

export default Commands;