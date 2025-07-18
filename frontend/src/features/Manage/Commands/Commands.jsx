import { useState, useEffect } from "react";
import adminSevice from "../../../services/adminService";
import botService from "../../../services/botService";
import { MdDownload, MdDelete } from "react-icons/md";

function Commands() {
    const [command, setCommand] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updateStatus, setUpdateStatus] = useState(null);
    const [files, setFiles] = useState([]);

    const MAX_FILES = 3;
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    // Lấy danh sách file đã upload
    const fetchFiles = async () => {
        try {
            const res = await botService.getCommandFiles();
            setFiles(res.data.files || []);
        } catch (err) {
            setFiles([]);
        }
    };

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
        fetchFiles();
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
        if (!file) return;

        if (files.length >= MAX_FILES) {
            setUpdateStatus("Chỉ được thêm tối đa 3 file lệnh!");
            return;
        }
        if (file.size > MAX_SIZE) {
            setUpdateStatus("File quá lớn! Dung lượng tối đa là 5MB.");
            return;
        }

        const formData = new FormData();
        formData.append('commandFile', file);

        setUpdateStatus("Đang tải file lên...");
        try {
            await botService.uploadCommandFile(formData);
            setUpdateStatus("Đã lưu file thành công!");
            fetchFiles();
            setTimeout(() => setUpdateStatus(null), 3000);
        } catch (err) {
            setUpdateStatus("Lỗi khi lưu file: " + err.message);
        }
    };

    const handleDownload = (filename) => {
        window.open(`${import.meta.env.VITE_BACKEND_URL}/uploads/commands/${filename}`, "_blank");
    };

    const handleDelete = async (filename) => {
        if (!window.confirm("Bạn có chắc muốn xoá file này?")) return;
        try {
            await botService.deleteCommandFile(filename);
            setUpdateStatus("Đã xoá file thành công!");
            fetchFiles();
            setTimeout(() => setUpdateStatus(null), 3000);
        } catch (err) {
            setUpdateStatus("Lỗi khi xoá file: " + err.message);
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
            <div className="mt-8">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">File hiện tại</h3>
                <p className="text-sm text-gray-500 mb-1">Lưu ý: Bạn chỉ có thể tải lên file .docx hoặc .txt
                    và mỗi file không được vượt quá 5MB. Tối đa 3 file.
                </p>
                {files.length === 0 ? (
                    <div className="text-gray-500">Chưa có file nào.</div>
                ) : (
                    <ul className="space-y-3">
                        {files.map((file) => (
                            <li
                                key={file}
                                className="flex items-center justify-between bg-white px-4 py-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition"
                            >
                                <div className="flex items-center gap-2 w-2/3">
                                    <span className="truncate font-medium text-gray-800">{file}</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 transition text-sm font-semibold"
                                        onClick={() => handleDownload(file)}
                                    >
                                        <MdDownload size={20} />
                                        Tải về
                                    </button>
                                    <button
                                        className="flex items-center gap-1 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 transition text-sm font-semibold"
                                        onClick={() => handleDelete(file)}
                                    >
                                        <MdDelete size={20} />
                                        Xoá
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div >
    );
}

export default Commands;