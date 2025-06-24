import { useState, useEffect } from 'react';
import { FiPlus, FiX, FiGrid, FiList, FiFilter, FiDownload, FiSearch } from 'react-icons/fi';
import ProductForm from './ProductForm';
import ProductTable from './ProductTable';
import ProductCard from './ProductCard';
import ProductFilters from './ProductFilters';
import productService from "../../../services/productService";
import { consolidateProductData } from '../../../utils/productFormHelpers';
import { processQuillContentForEdit } from '../../../utils/quillUtils';
import styles from './AdminProduct.module.scss';
import QuickManageModal from './QuickManageModal';

import adminService from '../../../services/adminService';

function AdminProduct() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [form, setForm] = useState({
        product_name: '',
        brand_id: '',
        category_id: '',
        material_id: '',
        target_id: '',
        discount: 0,
        description: '',
        productImages: [],
        size_ids: [],
        color_ids: []
    });

    const [originalFormData, setOriginalFormData] = useState(null);
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // New state for improved UI
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    // const [sortBy, setSortBy] = useState('updated_at');
    // const [sortOrder, setSortOrder] = useState('desc');
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showColorModal, setShowColorModal] = useState(false);
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [showTargetModal, setShowTargetModal] = useState(false);
    const [showSizeModal, setShowSizeModal] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [searchTerm, products]);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const response = await productService.getAllInfoProducts();
            setProducts(response.data);
            setFilteredProducts(response.data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filterProducts = () => {
        let filtered = products;

        if (searchTerm) {
            filtered = filtered.filter(product =>
                product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.brand_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredProducts(filtered);
    };

    // ✨ Hàm so sánh và trích xuất chỉ những thay đổi
    const getFormChanges = (originalData, currentData) => {
        const changes = {};

        // So sánh các trường cơ bản
        const basicFields = ['product_name', 'brand_id', 'category_id', 'material_id', 'target_id', 'discount', 'description'];

        basicFields.forEach(field => {
            if (originalData[field] !== currentData[field]) {
                changes[field] = currentData[field];
                console.log(`🔄 Changed ${field}: ${originalData[field]} → ${currentData[field]}`);
            }
        });

        // So sánh mảng size_ids
        const originalSizes = JSON.stringify(originalData.size_ids?.sort() || []);
        const currentSizes = JSON.stringify(currentData.size_ids?.sort() || []);
        if (originalSizes !== currentSizes) {
            changes.size_ids = currentData.size_ids;
            console.log(`🔄 Changed size_ids: ${originalSizes} → ${currentSizes}`);
        }

        // So sánh mảng color_ids  
        const originalColors = JSON.stringify(originalData.color_ids?.sort() || []);
        const currentColors = JSON.stringify(currentData.color_ids?.sort() || []);
        if (originalColors !== currentColors) {
            changes.color_ids = currentData.color_ids;
            console.log(`🔄 Changed color_ids: ${originalColors} → ${currentColors}`);
        }

        // So sánh productImages
        const originalImages = JSON.stringify(originalData.productImages?.sort() || []);
        const currentImages = JSON.stringify(currentData.productImages?.sort() || []);
        if (originalImages !== currentImages) {
            changes.productImages = currentData.productImages;
            console.log(`🔄 Changed productImages: ${originalImages} → ${currentImages}`);
        }

        // So sánh variants nếu có
        if (currentData.productVariants) {
            changes.variants = currentData.productVariants;
            console.log(`🔄 Variants data included`);
        }

        return changes;
    };

    const handleSubmit = async (formData, productId) => {
        const requiredFields = ['product_name', 'brand_id', 'category_id', 'material_id'];
        let hasEmptyFields = false;

        for (const field of requiredFields) {
            if (!formData.get(field)) {
                console.error(`Missing required field: ${field}`);
                hasEmptyFields = true;
            }
        }

        if (hasEmptyFields) {
            alert('Please fill all required fields before submitting');
            return;
        }

        // Parse variants từ formData
        let variants = [];
        try {
            const variantsString = formData.get('variants');
            if (variantsString) {
                variants = JSON.parse(variantsString);
            }
        } catch (error) {
            console.error('Error parsing variants:', error);
            alert('Invalid variants data');
            return;
        }

        // Extract unique size_ids và color_ids từ variants
        const sizeIds = [...new Set(variants.map(v => parseInt(v.size_id)))].filter(id => !isNaN(id));
        const colorIds = [...new Set(variants.map(v => parseInt(v.color_id)))].filter(id => !isNaN(id));

        // Validate variants
        if (variants.length === 0) {
            alert('Please add at least one variant');
            return;
        }

        if (sizeIds.length === 0 || colorIds.length === 0) {
            alert('Invalid variant data: missing size or color IDs');
            return;
        }

        // ✨ Nếu đang edit, chỉ gửi những thay đổi
        if (productId && originalFormData) {
            // Tạo object chứa dữ liệu hiện tại từ formData
            const currentFormObject = {
                product_name: formData.get('product_name'),
                brand_id: formData.get('brand_id'),
                category_id: formData.get('category_id'),
                material_id: formData.get('material_id'),
                target_id: formData.get('target_id'),
                discount: parseFloat(formData.get('discount')) || 0,
                description: formData.get('description'),
                size_ids: sizeIds,
                color_ids: colorIds,
                productImages: JSON.parse(formData.get('existingImages') || '[]'),
                productVariants: variants
            };

            // So sánh với dữ liệu ban đầu
            const changes = getFormChanges(originalFormData, currentFormObject);

            console.log('📊 Detected changes:', changes);

            // Nếu không có thay đổi gì
            if (Object.keys(changes).length === 0) {
                alert('Không có thay đổi nào để cập nhật!');
                return;
            }

            // Tạo FormData mới chỉ với những thay đổi
            const changesFormData = new FormData();

            // Thêm product_id để backend biết đang update
            changesFormData.append('product_id', productId);

            // Thêm những trường đã thay đổi
            Object.entries(changes).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    changesFormData.append(key, JSON.stringify(value));
                } else {
                    changesFormData.append(key, value);
                }
            });

            // Nếu có file ảnh mới từ form gốc, thêm vào
            const files = formData.getAll('productImages');
            if (files && files.length > 0 && files[0].size > 0) {
                files.forEach(file => {
                    changesFormData.append('productImages', file);
                });
                console.log('📎 Added new image files:', files.length);
            }

            console.log('📦 Changes FormData contents:');
            for (let [key, value] of changesFormData.entries()) {
                console.log(`  ${key}:`, typeof value === 'object' ? value.name || '[Object]' : value);
            }

            formData = changesFormData;
        } else {
            // Cho trường hợp tạo mới, giữ nguyên logic cũ
            formData.set('size_ids', JSON.stringify(sizeIds));
            formData.set('color_ids', JSON.stringify(colorIds));
        }

        setIsLoading(true);
        try {
            let response;

            if (productId) {
                // Update existing product với chỉ những thay đổi
                response = await productService.updateProduct(productId, formData);
                console.log('✅ Product updated successfully:', response?.data);
            } else {
                // Add new product
                response = await productService.createProduct(formData);
                console.log('✅ Product added successfully:', response.data);
            }

            // Refresh the product list
            const productsResponse = await productService.getAllInfoProducts();
            setProducts(productsResponse.data);

            // ✨ Reset states
            setEditId(null);
            setOriginalFormData(null);
            setShowForm(false);

            alert(productId ? 'Sản phẩm đã được cập nhật thành công!' : 'Sản phẩm mới đã được thêm thành công!');
        } catch (error) {
            console.error('❌ Error saving product:', error);
            alert(`Lỗi: ${error.response?.data?.message || 'Không thể lưu sản phẩm. Vui lòng thử lại.'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = async (product) => {
        console.log("🏠 ===== EDIT START =====");
        console.log("🏠 Selected product:", product);

        try {
            setIsLoading(true);

            // ✨ Reset states trước khi bắt đầu
            setOriginalFormData(null);
            setEditId(null);

            // ✨ Sửa lại cách gọi API để đảm bảo không lỗi
            const [allProductsResponse, allProductImagesResponse] = await Promise.allSettled([
                productService.getAllInfoProducts(),
                productService.getAllProductImages(product.product_id)
            ]);

            let allProducts = [];
            if (allProductsResponse.status === 'fulfilled') {
                allProducts = allProductsResponse.value.data || [];
            } else {
                console.error("Error fetching products:", allProductsResponse.reason);
                throw new Error("Không thể tải danh sách sản phẩm");
            }

            let allProductImages = [];
            if (allProductImagesResponse.status === 'fulfilled') {
                const imageResponse = allProductImagesResponse.value;
                console.log("🔍 Image response structure:", imageResponse);

                // ✨ Đơn giản hóa logic - Truy cập nested data
                const responseData = imageResponse.data; // Backend response: {success: true, data: [...]}

                if (responseData && responseData.success && Array.isArray(responseData.data)) {
                    allProductImages = responseData.data;
                    console.log("✅ Successfully extracted images:", allProductImages);
                } else {
                    console.warn("⚠️ Unexpected response format:", responseData);
                    allProductImages = [];
                }
            } else {
                console.warn("Warning: Could not fetch product images:", allProductImagesResponse.reason);
                allProductImages = [];
            }

            console.log("🏠 All products fetched:", allProducts.length);
            console.log("🏠 Product images fetched:", allProductImages.length);
            console.log("🔍 Product images final data:", allProductImages);

            // ✨ Truyền allProductImages vào consolidateProductData
            const consolidatedData = consolidateProductData(allProducts, product.product_id, allProductImages);
            console.log("🏠 Consolidated data from helper:", consolidatedData);

            if (!consolidatedData) {
                throw new Error("Không thể xử lý dữ liệu sản phẩm");
            }

            // Xử lý description để có thể edit
            const editableDescription = consolidatedData.description
                ? processQuillContentForEdit(consolidatedData.description)
                : '';

            const formData = {
                ...consolidatedData,
                description: editableDescription,
                productImages: allProductImages.length > 0 ? allProductImages : consolidatedData.productImages
            };

            console.log("🏠 FINAL FORM DATA before setting:", formData);

            // ✨ Set form data và editId
            setForm(formData);
            setEditId(product.product_id);
            setShowForm(true);

            console.log("🏠 ===== EDIT COMPLETED (waiting for variants to load) =====");

        } catch (error) {
            console.error('❌ EDIT ERROR:', error);
            alert(`Lỗi khi tải dữ liệu sản phẩm: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id) => {
        // ✨ Cải thiện UX với confirm dialog và loading state
        const productToDelete = products.find(p => p.product_id === id);
        const productName = productToDelete?.product_name || `ID ${id}`;

        if (!confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}"?\n\nHành động này không thể hoàn tác và sẽ xóa:\n- Tất cả variants của sản phẩm\n- Tất cả ảnh sản phẩm\n- Dữ liệu sản phẩm`)) {
            return;
        }

        setIsLoading(true);

        try {
            console.log('🗑️ Deleting product:', id);

            const response = await productService.deleteProduct(id);
            console.log('✅ Delete response:', response.data);

            if (response.data.success) {
                // Xóa khỏi state ngay lập tức để UX mượt mà
                setProducts((prev) => prev.filter((p) => p.product_id !== id));

                // Nếu đang edit sản phẩm này thì đóng form
                if (editId === id) {
                    setEditId(null);
                    setOriginalFormData(null);
                    setShowForm(false);
                }

                alert(`Sản phẩm "${productName}" đã được xóa thành công!`);

                // Refresh danh sách để đảm bảo đồng bộ với server
                try {
                    const refreshResponse = await productService.getAllInfoProducts();
                    setProducts(refreshResponse.data);
                    console.log('✅ Product list refreshed after deletion');
                } catch (refreshError) {
                    console.warn('⚠️ Failed to refresh product list:', refreshError);
                    // Không hiển thị lỗi này cho user vì delete đã thành công
                }
            } else {
                throw new Error(response.data.message || 'Delete failed');
            }

        } catch (error) {
            console.error('❌ Error deleting product:', error);

            let errorMessage = 'Không thể xóa sản phẩm. Vui lòng thử lại.';

            if (error.response?.status === 404) {
                errorMessage = 'Sản phẩm không tồn tại hoặc đã được xóa.';
            } else if (error.response?.status === 409) {
                errorMessage = 'Không thể xóa sản phẩm vì có dữ liệu liên quan.';
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            }

            alert(`Lỗi: ${errorMessage}`);

            // Refresh lại danh sách để đảm bảo state đúng
            try {
                const refreshResponse = await productService.getAllInfoProducts();
                setProducts(refreshResponse.data);
            } catch (refreshError) {
                console.error('❌ Failed to refresh products after delete error:', refreshError);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) return;

        if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedProducts.length} sản phẩm?`)) {
            try {
                setIsLoading(true);
                await Promise.all(selectedProducts.map(id => productService.deleteProduct(id)));
                await fetchProducts();
                setSelectedProducts([]);
            } catch (error) {
                console.error('Error bulk deleting products:', error);
            } finally {
                setIsLoading(false);
            }
        }
    };

    const handleExport = () => {
        // Export products to CSV
        const csvContent = [
            ['ID', 'Tên sản phẩm', 'Hãng', 'Giá', 'Giảm giá', 'Trạng thái'],
            ...filteredProducts.map(p => [
                p.product_id,
                p.product_name,
                p.brand_name,
                p.price,
                p.discount,
                p.quantity > 0 ? 'Còn hàng' : 'Hết hàng'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `products_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    return (
        <div className={styles.adminProduct}>
            {/* Header Section */}
            <div className={styles.adminProduct__header}>
                <div className={styles.adminProduct__headerLeft}>
                    <h1 className={styles.adminProduct__title}>
                        Quản lý sản phẩm
                        <span className={styles.adminProduct__count}>
                            ({filteredProducts.length})
                        </span>
                    </h1>
                    <p className={styles.adminProduct__subtitle}>
                        Quản lý toàn bộ sản phẩm trong cửa hàng
                    </p>
                </div>

                <div className={styles.adminProduct__headerRight}>
                    {!showForm && (
                        <>
                            <button
                                onClick={() => {
                                    setForm({
                                        product_name: '',
                                        brand_id: '',
                                        category_id: '',
                                        material_id: '',
                                        target_id: '',
                                        discount: 0,
                                        description: '',
                                        productImages: [],
                                        size_ids: [],
                                        color_ids: []
                                    });
                                    setEditId(null);
                                    setOriginalFormData(null);
                                    setShowForm(true);
                                }}
                                className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--primary']}`}
                            >
                                <FiPlus />
                                Thêm sản phẩm
                            </button>
                            <button
                                onClick={() => {
                                    setShowBrandModal(true);
                                    console.log('setShowBrandModal(true)');
                                }}
                                className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--outline']}`}
                            >
                                Thương hiệu
                            </button>
                            <button
                                onClick={() => setShowCategoryModal(true)}
                                className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--outline']}`}
                            >
                                Danh mục
                            </button>
                            <button
                                onClick={() => setShowColorModal(true)}
                                className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--outline']}`}
                            >
                                Màu sắc
                            </button>
                            <button
                                onClick={() => setShowMaterialModal(true)}
                                className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--outline']}`}
                            >
                                Chất liệu
                            </button>
                            <button
                                onClick={() => setShowTargetModal(true)}
                                className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--outline']}`}
                            >
                                Đối tượng
                            </button>
                            <button
                                onClick={() => setShowSizeModal(true)}
                                className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--outline']}`}
                            >
                                Kích thước
                            </button>
                        </>
                    )}
                </div>
            </div>

            {showForm ? (
                <div className={styles.adminProduct__formContainer}>
                    <div className={styles.adminProduct__formHeader}>
                        <h2 className={styles.adminProduct__formTitle}>
                            {editId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
                        </h2>
                        <button
                            onClick={() => {
                                setShowForm(false);
                                setOriginalFormData(null);
                            }}
                            className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--ghost']}`}
                        >
                            <FiX />
                            Đóng
                        </button>
                    </div>

                    <div className={styles.adminProduct__formContent}>
                        <ProductForm
                            form={form}
                            setForm={setForm}
                            handleSubmit={handleSubmit}
                            editId={editId}
                            originalFormData={originalFormData}
                            setOriginalFormData={setOriginalFormData}
                        />
                    </div>
                </div>
            ) : (
                <div className={styles.adminProduct__content}>
                    {/* Toolbar */}
                    <div className={styles.adminProduct__toolbar}>
                        <div className={styles.adminProduct__toolbarLeft}>
                            {/* Search */}
                            <div className={styles.adminProduct__search}>
                                <FiSearch className={styles.adminProduct__searchIcon} />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className={styles.adminProduct__searchInput}
                                />
                            </div>

                            {/* Filters */}
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--outline']} ${showFilters ? styles.active : ''}`}
                            >
                                <FiFilter />
                                Bộ lọc
                            </button>
                        </div>

                        <div className={styles.adminProduct__toolbarRight}>
                            {/* Bulk Actions */}
                            {selectedProducts.length > 0 && (
                                <div className={styles.adminProduct__bulkActions}>
                                    <span className={styles.adminProduct__bulkCount}>
                                        Đã chọn {selectedProducts.length}
                                    </span>
                                    <button
                                        onClick={handleBulkDelete}
                                        className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--danger']}`}
                                    >
                                        Xóa ({selectedProducts.length})
                                    </button>
                                </div>
                            )}

                            {/* Export */}
                            <button
                                onClick={handleExport}
                                className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--outline']}`}
                            >
                                <FiDownload />
                                Xuất Excel
                            </button>

                            {/* View Mode Toggle */}
                            <div className={styles.adminProduct__viewToggle}>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`${styles.adminProduct__viewBtn} ${viewMode === 'table' ? styles.active : ''}`}
                                >
                                    <FiList />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`${styles.adminProduct__viewBtn} ${viewMode === 'grid' ? styles.active : ''}`}
                                >
                                    <FiGrid />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    <ProductFilters
                        isVisible={showFilters}
                        products={products}
                        onFilter={setFilteredProducts}
                        originalProducts={products}
                    />

                    {/* Product List */}
                    <div className={styles.adminProduct__list}>
                        {viewMode === 'table' ? (
                            <ProductTable
                                products={filteredProducts}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                isLoading={isLoading}
                                selectedProducts={selectedProducts}
                                onSelectProducts={setSelectedProducts}
                            />
                        ) : (
                            <div className={styles.adminProduct__grid}>
                                {filteredProducts.map((product) => (
                                    <ProductCard
                                        key={product.product_id}
                                        product={product}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        isSelected={selectedProducts.includes(product.product_id)}
                                        onSelect={(selected) => {
                                            if (selected) {
                                                setSelectedProducts([...selectedProducts, product.product_id]);
                                            } else {
                                                setSelectedProducts(selectedProducts.filter(id => id !== product.product_id));
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Empty State */}
                    {filteredProducts.length === 0 && !isLoading && (
                        <div className={styles.adminProduct__empty}>
                            <div className={styles.adminProduct__emptyIcon}>📦</div>
                            <h3 className={styles.adminProduct__emptyTitle}>
                                {searchTerm ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm nào'}
                            </h3>
                            <p className={styles.adminProduct__emptyText}>
                                {searchTerm
                                    ? 'Thử tìm kiếm với từ khóa khác'
                                    : 'Hãy thêm sản phẩm đầu tiên để bắt đầu'
                                }
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className={`${styles.adminProduct__btn} ${styles['adminProduct__btn--primary']}`}
                                >
                                    <FiPlus />
                                    Thêm sản phẩm đầu tiên
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Loading Overlay */}
            {isLoading && (
                <div className={styles.adminProduct__loading}>
                    <div className={styles.adminProduct__spinner}></div>
                    <p>Đang tải...</p>
                </div>
            )}

            {/* Quick Manage Modal for Brands - New Feature */}
            <QuickManageModal
                type="brand"
                isOpen={showBrandModal}
                onClose={() => setShowBrandModal(false)}
                fetchApi={adminService.getAllBrands}
                createApi={adminService.createBrand}
                updateApi={adminService.updateBrand}
                deleteApi={adminService.deleteBrand}
            />

            {/* Quick Manage Modal for Categories - New Feature */}
            <QuickManageModal
                type="category"
                isOpen={showCategoryModal}
                onClose={() => setShowCategoryModal(false)}
                fetchApi={adminService.getAllCategories}
                createApi={adminService.createCategory}
                updateApi={adminService.updateCategory}
                deleteApi={adminService.deleteCategory}
            />

            {/* Quick Manage Modal for Colors - New Feature */}
            <QuickManageModal
                type="color"
                isOpen={showColorModal}
                onClose={() => setShowColorModal(false)}
                fetchApi={adminService.getAllColors}
                createApi={adminService.createColor}
                updateApi={adminService.updateColor}
                deleteApi={adminService.deleteColor}
            />

            {/* Quick Manage Modal for Materials - New Feature */}
            <QuickManageModal
                type="material"
                isOpen={showMaterialModal}
                onClose={() => setShowMaterialModal(false)}
                fetchApi={adminService.getAllMaterials}
                createApi={adminService.createMaterial}
                updateApi={adminService.updateMaterial}
                deleteApi={adminService.deleteMaterial}
            />

            {/* Quick Manage Modal for Targets - New Feature */}
            <QuickManageModal
                type="target"
                isOpen={showTargetModal}
                onClose={() => setShowTargetModal(false)}
                fetchApi={adminService.getAllTargets}
                createApi={adminService.createTarget}
                updateApi={adminService.updateTarget}
                deleteApi={adminService.deleteTarget}
            />

            {/* Quick Manage Modal for Sizes - New Feature */}
            <QuickManageModal
                type="size"
                isOpen={showSizeModal}
                onClose={() => setShowSizeModal(false)}
                fetchApi={adminService.getAllSizes}
                createApi={adminService.createSize}
                updateApi={adminService.updateSize}
                deleteApi={adminService.deleteSize}
            />
        </div>
    );
}

export default AdminProduct;
