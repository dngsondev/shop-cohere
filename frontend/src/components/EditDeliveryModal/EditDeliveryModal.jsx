import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { FaMap, FaMapMarkerAlt, FaTimes, FaUser, FaPhone, FaHome, FaSave } from "react-icons/fa";
// import { VscVerifiedFilled } from "react-icons/vsc";

// Đảm bảo dòng này được thực thi - khá quan trọng!
Modal.setAppElement('#root'); // hoặc '#app' tùy theo id của root element

function EditDeliveryModal({ 
    isOpen, 
    onClose, 
    onUserInfoChange,
    onAddressChange,
    onSave, // Thêm prop mới
    initialUserInfo, 
    initialAddress 
}) {
    // console.log("EditDeliveryModal rendering with props:", { isOpen, initialUserInfo, initialAddress });
    
    const [fullname, setFullname] = useState(initialUserInfo?.fullname || '');
    const [phone, setPhone] = useState(initialUserInfo?.phone || '');
    const [address, setAddress] = useState(initialAddress || '');
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    
    // States cho việc chọn tỉnh/thành phố
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    
    const [selectedProvince, setSelectedProvince] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedWard, setSelectedWard] = useState("");
    const [specificAddress, setSpecificAddress] = useState("");
    
    const [showAddressSelector, setShowAddressSelector] = useState(false);
    
    // Reset form và cập nhật giá trị ban đầu khi modal mở/đóng hoặc initialUserInfo thay đổi
    useEffect(() => {
        // Reset form và cập nhật giá trị ban đầu khi modal mở
        if (isOpen) {
            console.log("Modal opened with initial info:", {
                fullname: initialUserInfo?.fullname,
                phone: initialUserInfo?.phone,
                address: initialAddress
            });
            
            // Đặt lại các giá trị form
            setFullname(initialUserInfo?.fullname || '');
            setPhone(initialUserInfo?.phone || '');
            setAddress(initialAddress || '');
            setError('');
            
            // Reset các lựa chọn địa chỉ
            setShowAddressSelector(false);
            setSelectedProvince("");
            setSelectedDistrict("");
            setSelectedWard("");
            setSpecificAddress("");
        }
    }, [isOpen, initialUserInfo, initialAddress]);
    
    // Fetch các tỉnh, thành phố khi mở address selector
    useEffect(() => {
        if (isOpen && showAddressSelector && provinces.length === 0) {
            fetchProvinces();
        }
    }, [isOpen, showAddressSelector, provinces.length]);
    
    // Fetch các quận/huyện khi chọn tỉnh
    useEffect(() => {
        if (selectedProvince) {
            fetchDistricts(selectedProvince);
        }
    }, [selectedProvince]);
    
    // Fetch các phường/xã khi chọn quận/huyện
    useEffect(() => {
        if (selectedDistrict) {
            fetchWards(selectedDistrict);
        }
    }, [selectedDistrict]);
    
    // Style cho Modal
    const customModalStyles = {
        content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            borderRadius: '8px',
            padding: '20px',
            zIndex: 1000
        },
        overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 9999
        }
    };
    
    // Xử lý lấy vị trí hiện tại
    const handleCurrentLocation = () => {
        if ("geolocation" in navigator) {
            setIsLoading(true);
            navigator.geolocation.getCurrentPosition(async (position) => {
                const { latitude, longitude } = position.coords;
                
                try {
                    // Sử dụng OpenStreetMap - không yêu cầu token
                    const res = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=vi`
                    );
                    const data = await res.json();
                    
                    if (data) {
                        // Tạo một địa chỉ đầy đủ từ kết quả
                        const addressParts = [];
                        if (data.address) {
                            if (data.address.road) addressParts.push(data.address.road);
                            if (data.address.suburb) addressParts.push(data.address.suburb);
                            if (data.address.city_district) addressParts.push(data.address.city_district);
                            if (data.address.city) addressParts.push(data.address.city);
                            if (data.address.state) addressParts.push(data.address.state);
                            if (data.address.country) addressParts.push(data.address.country);
                        }
                        
                        const fullAddress = addressParts.join(', ');
                        // Cập nhật địa chỉ
                        setAddress(fullAddress || data.display_name);
                    } else {
                        throw new Error("Không tìm thấy thông tin địa điểm");
                    }
                    setIsLoading(false);
                } catch (err) {
                    console.error(err);
                    setError("Không thể lấy thông tin địa chỉ hiện tại");
                    setIsLoading(false);
                }
            }, (err) => {
                console.error(err);
                setError("Người dùng đã từ chối quyền định vị");
                setIsLoading(false);
            });
        } else {
            setError("Trình duyệt không hỗ trợ định vị");
        }
    };
    
    // Hàm lấy danh sách tỉnh/thành phố
    const fetchProvinces = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('https://provinces.open-api.vn/api/p/');
            const data = await response.json();
            setProvinces(data);
        } catch (err) {
            setError("Không thể lấy danh sách tỉnh/thành phố");
            console.error(err);
        }
        setIsLoading(false);
    };
    
    // Hàm lấy danh sách quận/huyện
    const fetchDistricts = async (provinceCode) => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`);
            const data = await response.json();
            setDistricts(data.districts || []);
        } catch (err) {
            setError("Không thể lấy danh sách quận/huyện");
            console.error(err);
        }
        setIsLoading(false);
    };
    
    // Hàm lấy danh sách phường/xã
    const fetchWards = async (districtCode) => {
        setIsLoading(true);
        try {
            const response = await fetch(`https://provinces.open-api.vn/api/d/${districtCode}?depth=2`);
            const data = await response.json();
            setWards(data.wards || []);
        } catch (err) {
            setError("Không thể lấy danh sách phường/xã");
            console.error(err);
        }
        setIsLoading(false);
    };
    
    // Hàm xử lý khi chọn tỉnh/thành phố
    const handleProvinceChange = (province) => {
        setSelectedProvince(province.code);
        setSelectedDistrict("");
        setSelectedWard("");
    };
    
    // Hàm xử lý khi chọn quận/huyện
    const handleDistrictChange = (district) => {
        setSelectedDistrict(district.code);
        setSelectedWard("");
    };
    
    // Hàm xử lý khi chọn phường/xã
    const handleWardChange = (ward) => {
        setSelectedWard(ward.code);
    };
    
    // Hàm xử lý khi nhập địa chỉ cụ thể
    const handleSpecificAddress = (value) => {
        setSpecificAddress(value);
    };
    
    // Validate thông tin người dùng và địa chỉ
    const validateInfo = () => {
        // Kiểm tra tên
        if (!fullname || fullname.trim() === '') {
            setError('Vui lòng nhập họ tên');
            return false;
        }
        
        // Kiểm tra số điện thoại
        const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
        if (!phone || !phoneRegex.test(phone)) {
            setError('Số điện thoại không hợp lệ');
            return false;
        }
        
        // Kiểm tra địa chỉ
        if ((!address || address.trim() === '') && 
            (!selectedProvince || !selectedDistrict || !selectedWard)) {
            setError('Vui lòng nhập địa chỉ hoặc chọn từ danh sách');
            return false;
        }
        
        return true;
    };
    
    // Lưu thông tin
    const handleSave = async () => {
        if (validateInfo()) {
            setIsLoading(true);
            
            // Xử lý địa chỉ từ danh sách nếu đã chọn
            let finalAddress = address;
            if (selectedProvince && selectedDistrict && selectedWard) {
                const province = provinces.find(p => p.code === selectedProvince);
                const district = districts.find(d => d.code === selectedDistrict);
                const ward = wards.find(w => w.code === selectedWard);
                
                if (province && district && ward) {
                    finalAddress = specificAddress 
                        ? `${specificAddress}, ${ward.name}, ${district.name}, ${province.name}`
                        : `${ward.name}, ${district.name}, ${province.name}`;
                }
            }
            
            try {
                if (onSave) {
                    // Nếu có callback onSave, sử dụng nó
                    onSave({ fullname, phone }, finalAddress);
                } else {
                    // Ngược lại, sử dụng callbacks tách biệt như cũ
                    onUserInfoChange && onUserInfoChange({ fullname, phone });
                    onAddressChange && onAddressChange(finalAddress);
                }
                
                setIsLoading(false);
                onClose();
            } catch (err) {
                console.error("Lỗi khi lưu thông tin giao hàng:", err);
                setError("Có lỗi xảy ra khi lưu thông tin. Vui lòng thử lại sau.");
                setIsLoading(false);
            }
        }
    };

    // const CheckPhone = (phoneInput) => {
    //     console.log(phone);
        
    //     if (phoneInput !== phone) {
    //         console.log(phoneInput + " chua duoc xac minh");
    //         return false;
    //     } else {
    //         setError('');
    //         return true;
    //     }
    // }
    
    return (
        <Modal 
            isOpen={isOpen} 
            onRequestClose={onClose}
            style={customModalStyles}
            contentLabel="Chỉnh sửa thông tin giao hàng"
        >
            <div className="relative modal-container">
                <div className="flex justify-between items-center mb-4 border-b pb-2">
                    <h2 className="text-xl font-semibold text-blue-600">Thông tin giao hàng</h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-800"
                    >
                        <FaTimes />
                    </button>
                </div>
                
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
                        {error}
                    </div>
                )}
                
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Thông tin người nhận */}
                        <h3 className="text-md font-medium text-gray-700 border-b pb-1 mb-2">Thông tin người nhận</h3>
                        
                        <div className="form-group">
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                                <FaUser className="mr-2 text-blue-500" /> Họ tên
                            </label>
                            <input
                                type="text"
                                name="fullname"
                                placeholder="Nhập họ tên"
                                className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"
                                value={fullname}
                                onChange={(e) => setFullname(e.target.value)}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                                <FaPhone className="mr-2 text-blue-500" /> Số điện thoại
                            </label>
                            <div className='flex items-center'>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Nhập số điện thoại"
                                    className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                {/* <div className="flex items-center ml-2">
                                    <VscVerifiedFilled
                                        className='w-6 h-6 text-green-500 cursor-pointer'
                                        title="Số điện thoại đã được xác minh "
                                    />
                                </div> */}
                                
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-1">
                                Định dạng: 0xxxxxxxxx hoặc +84xxxxxxxxx
                            </p>
                        </div>
                        
                        {/* Địa chỉ giao hàng */}
                        <h3 className="text-md font-medium text-gray-700 border-b pb-1 mb-2 mt-4">Địa chỉ giao hàng</h3>
                        
                        <div className="form-group">
                            <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                                <FaHome className="mr-2 text-blue-500" /> Địa chỉ
                            </label>
                            <div className="flex items-center">
                                <input
                                    type="text"
                                    placeholder="Nhập địa chỉ giao hàng"
                                    className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                />
                                <div className="flex items-center ml-2">
                                    <FaMapMarkerAlt 
                                        className="w-6 h-6 text-red-500 cursor-pointer"
                                        onClick={handleCurrentLocation}
                                        title="Sử dụng vị trí hiện tại"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <button 
                                className="text-blue-500 text-sm flex items-center mt-1"
                                onClick={() => setShowAddressSelector(!showAddressSelector)}
                            >
                                <FaMap className="mr-1" /> 
                                {showAddressSelector ? 'Ẩn chọn từ danh sách' : 'Chọn từ danh sách'}
                            </button>
                        </div>
                        
                        {showAddressSelector && (
                            <div className="mt-2 border-t pt-3">
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tỉnh/Thành phố
                                    </label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto">
                                        {provinces.map(province => (
                                            <button
                                                key={province.code}
                                                onClick={() => handleProvinceChange(province)}
                                                className={`text-left px-3 py-2 text-sm rounded-md ${
                                                    selectedProvince === province.code
                                                        ? 'bg-blue-100 text-blue-700'
                                                        : 'hover:bg-gray-100'
                                                }`}
                                            >
                                                {province.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                {selectedProvince && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Quận/Huyện
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto">
                                            {districts.map(district => (
                                                <button
                                                    key={district.code}
                                                    onClick={() => handleDistrictChange(district)}
                                                    className={`text-left px-3 py-2 text-sm rounded-md ${
                                                        selectedDistrict === district.code
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {district.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedDistrict && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Phường/Xã
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto">
                                            {wards.map(ward => (
                                                <button
                                                    key={ward.code}
                                                    onClick={() => handleWardChange(ward)}
                                                    className={`text-left px-3 py-2 text-sm rounded-md ${
                                                        selectedWard === ward.code
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'hover:bg-gray-100'
                                                    }`}
                                                >
                                                    {ward.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                {selectedWard && (
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Địa chỉ cụ thể (số nhà, đường phố)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Số nhà, tên đường,..."
                                            className="w-full p-2 border rounded-md focus:outline-none focus:border-blue-500"
                                            value={specificAddress}
                                            onChange={(e) => handleSpecificAddress(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        
                        <div className="flex justify-end pt-4 border-t mt-4">
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                            >
                                <FaSave className="mr-2" /> Lưu thông tin
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

export default EditDeliveryModal;