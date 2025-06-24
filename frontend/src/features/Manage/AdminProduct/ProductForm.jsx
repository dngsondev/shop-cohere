import { useState, useEffect, useRef, useCallback } from 'react';
import QuillEditor from '../../../components/QuillEditor/QuillEditor';
import { processQuillContentForEdit, normalizeQuillContentForDB } from '../../../utils/quillUtils';
import { getFullImageUrl } from '../../../utils/imageUtils';
import 'react-quill/dist/quill.snow.css';
import productService from '../../../services/productService';
import { consolidateProductData, getNameFromId } from '../../../utils/productFormHelpers';

function ProductForm({ form, setForm, handleSubmit, editId, originalFormData, setOriginalFormData }) {
    console.log("ProductForm - Received props:", {
        form,
        editId,
        hasOriginalData: !!originalFormData,
        hasSetOriginalFormData: !!setOriginalFormData
    });

    // ✨ State để theo dõi các thay đổi
    const [hasChanges, setHasChanges] = useState(false);
    const [changesCount, setChangesCount] = useState(0);

    // State
    const [selectedSizes, setSelectedSizes] = useState([]); // Array of size IDs
    const [selectedColors, setSelectedColors] = useState([]); // Array of color IDs
    const [productVariants, setProductVariants] = useState([]);
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [targets, setTargets] = useState([]);
    const [availableSizes, setAvailableSizes] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);
    const quillEditorRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Bulk actions state
    const [bulkPrice, setBulkPrice] = useState('');
    const [bulkQuantity, setBulkQuantity] = useState('');
    const [selectedVariants, setSelectedVariants] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [colorImages, setColorImages] = useState({});
    const [showVariantsTable, setShowVariantsTable] = useState(false);

    // Helper functions để lấy tên từ ID - CẢI THIỆN
    const getSizeNameById = (id) => {
        // console.log('🔍 Looking for size ID:', id, 'in:', availableSizes);

        if (!availableSizes || availableSizes.length === 0) {
            console.warn('⚠️ availableSizes is empty or not loaded yet');
            return `Size ${id}`;
        }

        // Chuyển đổi cả hai về cùng kiểu dữ liệu để so sánh
        const size = availableSizes.find(s => String(s.id) === String(id) || s.id === id);
        const result = size?.name || `Size ${id}`;

        // console.log('🎯 Found size:', size, 'returning:', result);
        return result;
    };

    const getColorNameById = (id) => {
        // console.log('🔍 Looking for color ID:', id, 'in:', availableColors);

        if (!availableColors || availableColors.length === 0) {
            console.warn('⚠️ availableColors is empty or not loaded yet');
            return `Color ${id}`;
        }

        // Chuyển đổi cả hai về cùng kiểu dữ liệu để so sánh
        const color = availableColors.find(c => String(c.id) === String(id) || c.id === id);
        const result = color?.name || `Color ${id}`;

        // console.log('🎯 Found color:', color, 'returning:', result);
        return result;
    };

    // Tự động hiển thị bulk actions khi có variants
    useEffect(() => {
        if (productVariants.length > 0) {
            setShowBulkActions(true);
        }
    }, [productVariants.length]);

    // Khi chỉnh sửa, phân tích kích thước và màu sắc từ form
    useEffect(() => {
        if (editId && form.size_ids && form.color_ids) {
            const sizesArray = Array.isArray(form.size_ids) ? form.size_ids :
                (typeof form.size_ids === 'string' ? JSON.parse(form.size_ids) : []);
            const colorsArray = Array.isArray(form.color_ids) ? form.color_ids :
                (typeof form.color_ids === 'string' ? JSON.parse(form.color_ids) : []);

            setSelectedSizes(sizesArray);
            setSelectedColors(colorsArray);

            setForm(prev => ({
                ...prev,
                size_ids: sizesArray,
                color_ids: colorsArray
            }));
        }
    }, [editId, form.size_ids, form.color_ids, setForm]);

    // Load existing variants khi edit
    useEffect(() => {
        const loadExistingVariants = async () => {
            if (!editId || !form.product_id) return;

            try {
                console.log('🔄 Loading existing variants for product:', form.product_id);

                const response = await productService.getAllInfoProducts();

                if (response.data) {
                    // Lọc variants theo product_id
                    const productVariantsData = response.data.filter(
                        item => item.product_id === parseInt(form.product_id)
                    );

                    console.log('📦 Found product variants:', productVariantsData);

                    if (productVariantsData.length > 0) {
                        // Format variants cho ProductForm
                        const formattedVariants = productVariantsData.map(variant => ({
                            id: `${variant.size_id}-${variant.color_id}-${variant.id || Date.now()}`,
                            variant_id: variant.variant_id,
                            size_name: variant.size_name || getSizeNameById(variant.size_id),
                            size_id: parseInt(variant.size_id),
                            color_name: variant.color_name || getColorNameById(variant.color_id),
                            color_id: parseInt(variant.color_id),
                            color_code: variant.color_code || '#000000',
                            price: parseFloat(variant.price) || 0,
                            quantity: parseInt(variant.quantity) || 0,
                            variant_image_url: variant.variant_image_url
                        }));

                        setProductVariants(formattedVariants);
                        setShowVariantsTable(true);

                        // Lấy unique size và color IDs
                        const uniqueSizeIds = [...new Set(formattedVariants.map(v => v.size_id))];
                        const uniqueColorIds = [...new Set(formattedVariants.map(v => v.color_id))];

                        setSelectedSizes(uniqueSizeIds);
                        setSelectedColors(uniqueColorIds);

                        console.log('✅ Variants loaded successfully:', {
                            formattedVariants,
                            uniqueSizeIds,
                            uniqueColorIds
                        });
                    }
                }
            } catch (error) {
                console.error('❌ Error loading variants:', error);
            }
        };

        // Chỉ load khi đã có đủ dữ liệu sizes và colors
        if (editId && form.product_id && availableSizes.length > 0 && availableColors.length > 0) {
            loadExistingVariants();
        }
    }, [editId, form.product_id, availableSizes.length, availableColors.length]);

    // Fetch sizes và colors
    useEffect(() => {
        const fetchSizesAndColors = async () => {
            try {
                console.log('🔄 Fetching sizes and colors...');

                const [sizesRes, colorsRes] = await Promise.all([
                    productService.getSizes(),
                    productService.getColors()
                ]);

                console.log('📊 Sizes response:', sizesRes);
                console.log('📊 Colors response:', colorsRes);

                if (sizesRes?.data) {
                    setAvailableSizes(sizesRes.data);
                    console.log('✅ Sizes loaded:', sizesRes.data);
                }

                if (colorsRes?.data) {
                    setAvailableColors(colorsRes.data);
                    console.log('✅ Colors loaded:', colorsRes.data);
                }
            } catch (error) {
                console.error('❌ Error fetching sizes/colors:', error);
            }
        };

        fetchSizesAndColors();
    }, []); // Chạy ngay khi component mount

    // Hàm tạo biến thể - sử dụng ID
    const generateVariants = () => {
        console.log('🔄 Generating variants with:', { selectedSizes, selectedColors });

        if (selectedSizes.length === 0 || selectedColors.length === 0) {
            alert('Vui lòng chọn ít nhất một kích thước và một màu sắc');
            return;
        }

        const newVariants = [];
        selectedSizes.forEach(sizeId => {
            selectedColors.forEach(colorId => {
                const colorObj = availableColors.find(c => c.id === colorId);
                const sizeObj = availableSizes.find(s => s.id === sizeId);

                newVariants.push({
                    id: `${sizeId}-${colorId}-${Date.now()}`,
                    size_name: sizeObj?.name || `Size ${sizeId}`,
                    size_id: sizeId,
                    color_name: colorObj?.name || `Color ${colorId}`,
                    color_id: colorId,
                    color_code: colorObj?.value || '#000000',
                    price: 0,
                    quantity: 0,
                    variant_image_url: null
                });
            });
        });

        setProductVariants(newVariants);
        setShowVariantsTable(true);

        // Cập nhật form với IDs đã chọn
        setForm(prev => ({
            ...prev,
            size_ids: selectedSizes,
            color_ids: selectedColors
        }));

        console.log('✅ Generated variants:', newVariants);
    };

    // Hàm cập nhật variant
    const updateVariant = (index, field, value) => {
        const updatedVariants = [...productVariants];
        updatedVariants[index][field] = value;
        setProductVariants(updatedVariants);
    };

    // Hàm xóa variant
    const removeVariant = (index) => {
        const updatedVariants = productVariants.filter((_, i) => i !== index);
        setProductVariants(updatedVariants);

        // Cập nhật selectedVariants nếu cần
        setSelectedVariants(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    };

    // Hàm xử lý upload ảnh variant
    const handleVariantImageChange = async (index, file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            updateVariant(index, 'variant_image_url', e.target.result);
        };
        reader.readAsDataURL(file);
    };

    // Bulk actions functions
    const applyBulkPrice = () => {
        if (selectedVariants.length === 0 || !bulkPrice) return;

        const updatedVariants = [...productVariants];
        selectedVariants.forEach(index => {
            updatedVariants[index].price = parseFloat(bulkPrice);
        });
        setProductVariants(updatedVariants);
        setBulkPrice('');
    };

    const applyBulkQuantity = () => {
        if (selectedVariants.length === 0 || !bulkQuantity) return;

        const updatedVariants = [...productVariants];
        selectedVariants.forEach(index => {
            updatedVariants[index].quantity = parseInt(bulkQuantity);
        });
        setProductVariants(updatedVariants);
        setBulkQuantity('');
    };

    const handleColorImageChange = (colorId, file) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const colorName = getColorNameById(colorId);
            setColorImages(prev => ({
                ...prev,
                [colorName]: e.target.result
            }));

            // Apply to all variants with this color
            const updatedVariants = [...productVariants];
            updatedVariants.forEach((variant, index) => {
                if (variant.color_id === colorId) {
                    updatedVariants[index].variant_image_url = e.target.result;
                }
            });
            setProductVariants(updatedVariants);
        };
        reader.readAsDataURL(file);
    };

    const selectAllVariants = () => {
        setSelectedVariants(productVariants.map((_, index) => index));
    };

    const clearVariantSelection = () => {
        setSelectedVariants([]);
    };

    const selectVariantsByColor = (colorId) => {
        const indices = productVariants
            .map((variant, index) => variant.color_id === colorId ? index : null)
            .filter(index => index !== null);
        setSelectedVariants(indices);
    };

    // Xử lý description để hiển thị ảnh đúng cách trong editor
    const getQuillEditorValue = () => {
        if (!form.description) return '';

        // Khi edit, chuyển full URL về relative path để Quill có thể edit
        if (editId) {
            return processQuillContentForEdit(form.description);
        }

        return form.description;
    };

    // ✨ Hàm kiểm tra xem có thay đổi gì không với LOG chi tiết
    const checkForChanges = useCallback(() => {
        console.log("🔍 =====  CHECKING FOR CHANGES =====");

        if (!originalFormData || !editId) {
            console.log("❌ No originalFormData or editId:", { originalFormData: !!originalFormData, editId });
            setHasChanges(false);
            setChangesCount(0);
            return;
        }

        console.log("📊 ORIGINAL DATA:", originalFormData);
        console.log("📊 CURRENT FORM:", form);
        console.log("📊 CURRENT VARIANTS:", productVariants);

        let changes = 0;
        let changeDetails = [];

        // Kiểm tra các trường cơ bản
        const basicFields = ['product_name', 'brand_id', 'category_id', 'material_id', 'target_id', 'discount', 'description'];

        basicFields.forEach(field => {
            const originalValue = originalFormData[field];
            const currentValue = form[field];

            console.log(`🔍 Checking ${field}:`, {
                original: originalValue,
                current: currentValue,
                originalType: typeof originalValue,
                currentType: typeof currentValue,
                isEqual: originalValue === currentValue
            });

            if (originalValue !== currentValue) {
                changes++;
                changeDetails.push(`${field}: "${originalValue}" → "${currentValue}"`);
                console.log(`🔄 CHANGE DETECTED in ${field}:`, originalValue, "→", currentValue);
            }
        });

        // Kiểm tra arrays với log chi tiết
        console.log("🔍 Checking size_ids:");
        const originalSizes = (originalFormData.size_ids || []).map(id => Number(id)).sort();
        const currentSizes = (form.size_ids || []).map(id => Number(id)).sort();
        console.log("  Original sizes:", originalSizes);
        console.log("  Current sizes:", currentSizes);

        const originalSizesStr = JSON.stringify(originalSizes);
        const currentSizesStr = JSON.stringify(currentSizes);
        console.log("  Original sizes string:", originalSizesStr);
        console.log("  Current sizes string:", currentSizesStr);

        if (originalSizesStr !== currentSizesStr) {
            changes++;
            changeDetails.push(`size_ids: ${originalSizesStr} → ${currentSizesStr}`);
            console.log("🔄 CHANGE DETECTED in size_ids");
        }

        console.log("🔍 Checking color_ids:");
        const originalColors = (originalFormData.color_ids || []).map(id => Number(id)).sort();
        const currentColors = (form.color_ids || []).map(id => Number(id)).sort();
        console.log("  Original colors:", originalColors);
        console.log("  Current colors:", currentColors);

        const originalColorsStr = JSON.stringify(originalColors);
        const currentColorsStr = JSON.stringify(currentColors);
        console.log("  Original colors string:", originalColorsStr);
        console.log("  Current colors string:", currentColorsStr);

        if (originalColorsStr !== currentColorsStr) {
            changes++;
            changeDetails.push(`color_ids: ${originalColorsStr} → ${currentColorsStr}`);
            console.log("🔄 CHANGE DETECTED in color_ids");
        }

        console.log("🔍 Checking productImages:");
        const originalImages = (originalFormData.productImages || []).sort();
        const currentImages = (form.productImages || []).sort();
        console.log("  Original images:", originalImages);
        console.log("  Current images:", currentImages);

        const originalImagesStr = JSON.stringify(originalImages);
        const currentImagesStr = JSON.stringify(currentImages);
        console.log("  Original images string:", originalImagesStr);
        console.log("  Current images string:", currentImagesStr);

        if (originalImagesStr !== currentImagesStr) {
            changes++;
            changeDetails.push(`productImages: ${originalImagesStr} → ${currentImagesStr}`);
            console.log("🔄 CHANGE DETECTED in productImages");
        }

        // ✨ Kiểm tra variants với xử lý đặc biệt và debug chi tiết
        console.log("🔍 Checking variants:");
        const originalVariants = originalFormData.variants || [];
        console.log("  Original variants:", originalVariants);
        console.log("  Current variants:", productVariants);

        if (originalVariants.length === 0 && productVariants.length > 0) {
            console.log("  ✅ Variants loaded for first time - not counted as change");
        } else if (productVariants.length > 0 && originalVariants.length > 0) {
            // Chuẩn hóa variants để so sánh với debug chi tiết
            const normalizeVariant = (variant) => {
                const normalized = {
                    size_id: Number(variant.size_id),
                    color_id: Number(variant.color_id),
                    price: Number(variant.price || 0),
                    quantity: Number(variant.quantity || 0),
                    variant_image_url: variant.variant_image_url || null
                };
                console.log(`    Normalizing variant:`, variant, `→`, normalized);
                return normalized;
            };

            const sortedOriginalVariants = originalVariants
                .map(normalizeVariant)
                .sort((a, b) => a.size_id - b.size_id || a.color_id - b.color_id);

            const sortedCurrentVariants = productVariants
                .map(normalizeVariant)
                .sort((a, b) => a.size_id - b.size_id || a.color_id - b.color_id);

            console.log("  Normalized original variants:", sortedOriginalVariants);
            console.log("  Normalized current variants:", sortedCurrentVariants);

            // So sánh từng variant một để tìm ra khác biệt
            console.log("  🔍 Comparing variants one by one:");
            const variantDifferences = [];

            for (let i = 0; i < Math.max(sortedOriginalVariants.length, sortedCurrentVariants.length); i++) {
                const orig = sortedOriginalVariants[i];
                const curr = sortedCurrentVariants[i];

                if (!orig) {
                    variantDifferences.push(`Variant ${i}: Added new variant ${JSON.stringify(curr)}`);
                    continue;
                }

                if (!curr) {
                    variantDifferences.push(`Variant ${i}: Removed variant ${JSON.stringify(orig)}`);
                    continue;
                }

                // So sánh từng field
                Object.keys(orig).forEach(key => {
                    if (orig[key] !== curr[key]) {
                        variantDifferences.push(`Variant ${i}.${key}: ${orig[key]} → ${curr[key]}`);
                        console.log(`    🔄 DIFFERENCE in variant ${i}.${key}: ${orig[key]} → ${curr[key]}`);
                    }
                });
            }

            if (variantDifferences.length > 0) {
                changes++;
                changeDetails.push(`variants: ${variantDifferences.length} differences found`);
                console.log("🔄 CHANGE DETECTED in variants:");
                variantDifferences.forEach(diff => console.log(`      ${diff}`));
            } else {
                console.log("  ✅ No variant differences found");
            }

            const originalVariantsStr = JSON.stringify(sortedOriginalVariants);
            const currentVariantsStr = JSON.stringify(sortedCurrentVariants);

            console.log("  Original variants string:", originalVariantsStr);
            console.log("  Current variants string:", currentVariantsStr);
        }

        console.log("📊 SUMMARY:");
        console.log("  Total changes:", changes);
        console.log("  Change details:", changeDetails);
        console.log("===============================");

        setHasChanges(changes > 0);
        setChangesCount(changes);
    }, [form, originalFormData, editId, productVariants]);

    // ✨ Effect để theo dõi thay đổi
    useEffect(() => {
        checkForChanges();
    }, [checkForChanges]);

    // ✨ Effect mới để lưu originalFormData sau khi variants đã load xong
    useEffect(() => {
        // Chỉ lưu originalFormData khi:
        // 1. Đang trong chế độ edit
        // 2. Đã có form data  
        // 3. Đã có variants
        // 4. Chưa có originalFormData (điều kiện quan trọng!)
        // 5. Có setOriginalFormData function
        if (editId && form.product_id && productVariants.length > 0 && !originalFormData && setOriginalFormData) {
            console.log("💾 ===== SAVING ORIGINAL DATA (ONE TIME ONLY) =====");

            const originalData = {
                ...form,
                variants: JSON.parse(JSON.stringify(productVariants)) // Deep copy variants
            };

            console.log("💾 Form data:", form);
            console.log("💾 Product variants at save time:", productVariants);
            console.log("💾 Final original data:", originalData);
            console.log("💾 =====================================");

            setOriginalFormData(originalData);
        } else {
            console.log("⏭️ Skipping originalFormData save:", {
                editId,
                hasProductId: !!form.product_id,
                variantsCount: productVariants.length,
                hasOriginalData: !!originalFormData,
                hasSetFunction: !!setOriginalFormData
            });
        }
    }, [editId, form.product_id, productVariants.length, originalFormData, setOriginalFormData]);

    // Xử lý submit form
    const formSubmitHandler = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            console.log("🟢 Variants gửi lên backend:", productVariants);
            // ✨ Hiển thị thông tin về thay đổi nếu đang edit
            if (editId && originalFormData) {
                if (!hasChanges) {
                    alert('Không có thay đổi nào để cập nhật!');
                    setIsSubmitting(false);
                    return;
                }

                console.log(`📊 Updating product with ${changesCount} changes`);
            }

            // Tạo FormData
            const formData = new FormData();

            // Thêm thông tin cơ bản
            formData.append('product_name', form.product_name);
            formData.append('brand_id', form.brand_id);
            formData.append('category_id', form.category_id);
            formData.append('material_id', form.material_id);
            formData.append('target_id', form.target_id);
            formData.append('discount', form.discount);
            formData.append('description', normalizeQuillContentForDB(form.description));

            // Thêm size_ids và color_ids
            formData.append('size_ids', JSON.stringify(selectedSizes));
            formData.append('color_ids', JSON.stringify(selectedColors));

            // Thêm variants
            formData.append('variants', JSON.stringify(productVariants));

            // Thêm ảnh sản phẩm
            if (form.productImages && form.productImages.length > 0) {
                form.productImages.forEach((image, index) => {
                    if (image instanceof File) {
                        formData.append('productImages', image);
                    }
                });
            }

            await handleSubmit(formData, editId);
        } catch (error) {
            console.error('Error in form submission:', error);
            alert('Có lỗi xảy ra khi gửi form!');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fetch dropdown options
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [brands, categories, materials, targets] = await Promise.all([
                    productService.getBrands(),
                    productService.getCategories(),
                    productService.getMaterials(),
                    productService.getTargets()
                ]);

                setBrands(brands.data || []);
                setCategories(categories.data || []);
                setMaterials(materials.data || []);
                setTargets(targets.data || []);
            } catch (error) {
                console.error("❌ FETCH ERROR:", error.message);
            }
        };
        fetchData();
    }, []);

    // Trả về giao diện
    return (
        <form onSubmit={formSubmitHandler} className="space-y-6 bg-white p-6 rounded-lg shadow-lg">
            {/* ✨ Hiển thị thông báo về thay đổi khi edit */}
            {editId && originalFormData && (
                <div className={`p-4 rounded-lg border ${hasChanges
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-green-50 border-green-200 text-green-800'
                    }`}>
                    <div className="flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">
                            {hasChanges
                                ? `Đã phát hiện ${changesCount} thay đổi`
                                : 'Chưa có thay đổi nào'
                            }
                        </span>
                    </div>
                </div>
            )}

            {/* Thông tin chung */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
                <h2 className="text-xl font-bold text-blue-800 mb-4 flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Thông tin chung
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block font-semibold text-gray-700 mb-2">Tên sản phẩm *</label>
                        <input
                            type="text"
                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            value={form.product_name}
                            onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                            placeholder="e.g. Áo thun nam"
                            required
                        />
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 mb-2">Hãng *</label>
                        <select
                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            value={form.brand_id || ''}
                            onChange={(e) => setForm({ ...form, brand_id: e.target.value })}
                            required
                        >
                            <option value="">Chọn hãng</option>
                            {brands.map((brand) => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 mb-2">Loại *</label>
                        <select
                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            value={form.category_id || ''}
                            onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                            required
                        >
                            <option value="">Chọn loại</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 mb-2">Chất liệu *</label>
                        <select
                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            value={form.material_id || ''}
                            onChange={(e) => setForm({ ...form, material_id: e.target.value })}
                            required
                        >
                            <option value="">Chọn chất liệu</option>
                            {materials.map((material) => (
                                <option key={material.id} value={material.id}>
                                    {material.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 mb-2">Đối tượng *</label>
                        <select
                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            value={form.target_id || ''}
                            onChange={(e) => setForm({ ...form, target_id: e.target.value })}
                            required
                        >
                            <option value="">Chọn đối tượng</option>
                            {targets.map((target) => (
                                <option key={target.id} value={target.id}>
                                    {target.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block font-semibold text-gray-700 mb-2">Giảm giá (%)</label>
                        <input
                            type="number"
                            className="w-full border-2 border-gray-300 p-3 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            value={form.discount}
                            onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })}
                            min="0"
                            max="100"
                            required
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block font-semibold text-gray-700 mb-2">Mô tả</label>
                        <div className="w-full">
                            <QuillEditor
                                value={getQuillEditorValue()}
                                onChange={(content) => setForm({ ...form, description: content })}
                                placeholder="Nhập mô tả sản phẩm..."
                                className="mb-4"
                                style={{ borderRadius: 0 }}
                                ref={quillEditorRef}
                            />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            Nhấp vào hình ảnh để hiển thị thanh công cụ chỉnh sửa.
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block font-semibold text-gray-700 mb-2">Ảnh chung sản phẩm</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 hover:bg-gray-100 transition-colors">
                            {form.productImages && form.productImages.length > 0 ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-4">
                                    {form.productImages.map((img, index) => {
                                        const imageUrl = typeof img === 'string'
                                            ? getFullImageUrl(img)
                                            : URL.createObjectURL(img);

                                        return (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={imageUrl}
                                                    alt={`Ảnh sản phẩm ${index + 1}`}
                                                    className="h-24 w-24 object-cover border rounded-lg shadow-sm group-hover:shadow-md transition-shadow"
                                                    onError={(e) => {
                                                        e.target.src = '/images/otherImages/no-image-placeholder.png';
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updatedImages = [...form.productImages];
                                                        updatedImages.splice(index, 1);
                                                        setForm({ ...form, productImages: updatedImages });
                                                    }}
                                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600"
                                                    title="Xóa ảnh này"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                    </svg>
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-8 text-gray-500">
                                    <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p>Chưa có ảnh nào được chọn</p>
                                </div>
                            )}

                            <div className="flex items-center justify-center">
                                <label className="cursor-pointer bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg flex items-center transition-all duration-200 shadow-md hover:shadow-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                    <span>Tải lên ảnh</span>
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                                const filesArray = Array.from(e.target.files);
                                                const currentImages = form.productImages || [];
                                                const updatedImages = [...currentImages, ...filesArray];
                                                setForm({
                                                    ...form,
                                                    productImages: updatedImages
                                                });
                                            }
                                            e.target.value = '';
                                        }}
                                    />
                                </label>
                            </div>

                            {form.productImages && form.productImages.length > 0 && (
                                <div className="mt-4 text-sm text-gray-600 text-center bg-blue-50 p-3 rounded-lg">
                                    {form.productImages.length} ảnh đã được chọn.
                                    <button
                                        type="button"
                                        className="ml-3 text-red-500 hover:text-red-700 underline font-medium"
                                        onClick={() => setForm({ ...form, productImages: [] })}
                                    >
                                        Xóa tất cả
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Phân loại sản phẩm - HIỂN THỊ TRỰC TIẾP */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
                <h2 className="text-xl font-bold text-purple-800 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Phân loại sản phẩm
                </h2>

                {/* Hiển thị thông tin đã chọn */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <label className="block font-semibold text-gray-700 mb-2">Kích thước đã chọn</label>
                        <input
                            type="text"
                            className={`w-full border-2 p-3 rounded-lg bg-gray-50 ${!selectedSizes.length ? 'border-red-300' : 'border-gray-300'}`}
                            value={selectedSizes.length > 0 ? selectedSizes.map(id => {
                                const sizeName = getSizeNameById(id);
                                // console.log(`Size ID ${id} -> ${sizeName}`);
                                return sizeName;
                            }).join(', ') : ''}
                            readOnly
                            placeholder="Chưa chọn kích thước"
                        />
                        {!selectedSizes.length && (
                            <p className="mt-2 text-sm text-red-500 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Vui lòng chọn ít nhất một kích thước
                            </p>
                        )}
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                        <label className="block font-semibold text-gray-700 mb-2">Màu sắc đã chọn</label>
                        <input
                            type="text"
                            className={`w-full border-2 p-3 rounded-lg bg-gray-50 ${!selectedColors.length ? 'border-red-300' : 'border-gray-300'}`}
                            value={selectedColors.length > 0 ? selectedColors.map(id => {
                                const colorName = getColorNameById(id);
                                // console.log(`Color ID ${id} -> ${colorName}`);
                                return colorName;
                            }).join(', ') : ''}
                            readOnly
                            placeholder="Chưa chọn màu sắc"
                        />
                        {!selectedColors.length && (
                            <p className="mt-2 text-sm text-red-500 flex items-center">
                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Vui lòng chọn ít nhất một màu sắc
                            </p>
                        )}
                    </div>
                </div>

                {/* PHẦN CHỌN KÍCH THƯỚC VÀ MÀU SẮC */}
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                        </svg>
                        Chọn phân loại sản phẩm
                    </h3>

                    {/* Size selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Kích thước *
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {availableSizes.map((size) => (
                                <label key={size.id} className="relative cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={size.id}
                                        checked={selectedSizes.includes(size.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedSizes([...selectedSizes, size.id]);
                                            } else {
                                                setSelectedSizes(selectedSizes.filter(s => s !== size.id));
                                            }
                                        }}
                                        className="hidden peer"
                                    />
                                    <div className="border-2 border-gray-300 rounded-lg p-3 text-center transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-blue-300 hover:bg-blue-25">
                                        <span className="font-medium">{size.name}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Color selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Màu sắc *
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            {availableColors.map((color) => (
                                <label key={color.id} className="relative cursor-pointer">
                                    <input
                                        type="checkbox"
                                        value={color.id}
                                        checked={selectedColors.includes(color.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedColors([...selectedColors, color.id]);
                                            } else {
                                                setSelectedColors(selectedColors.filter(c => c !== color.id));
                                            }
                                        }}
                                        className="hidden peer"
                                    />
                                    <div className="border-2 border-gray-300 rounded-lg p-3 text-center transition-all duration-200 peer-checked:border-blue-500 peer-checked:bg-blue-50 peer-checked:text-blue-700 hover:border-blue-300 hover:bg-blue-25">
                                        <div className="flex items-center justify-center">
                                            <span
                                                className="w-6 h-6 rounded-full border-2 border-gray-300 mr-2 shadow-sm"
                                                style={{ backgroundColor: color.value }}
                                            ></span>
                                            <span className="font-medium text-sm">{color.name}</span>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Generate variants button */}
                    <div className="text-center mb-6">
                        <button
                            type="button"
                            onClick={generateVariants}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center mx-auto transition-all duration-200 shadow-md hover:shadow-lg"
                            disabled={selectedSizes.length === 0 || selectedColors.length === 0}
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Tạo biến thể
                        </button>
                    </div>

                    {/* Variants table */}
                    {showVariantsTable && productVariants.length > 0 && (
                        <div className="mt-6">
                            {/* Bulk Actions - Luôn hiển thị khi có variants */}
                            <div className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg border border-indigo-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-md font-semibold text-indigo-800">Thiết lập hàng loạt</h4>
                                    <button
                                        type="button"
                                        onClick={() => setShowBulkActions(!showBulkActions)}
                                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                    >
                                        {showBulkActions ? 'Ẩn' : 'Hiển thị'}
                                    </button>
                                </div>

                                {/* Phần này sẽ luôn hiển thị theo mặc định */}
                                <div className="space-y-4">
                                    {/* Selection controls */}
                                    <div className="flex flex-wrap gap-3">
                                        <button
                                            type="button"
                                            onClick={selectAllVariants}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Chọn tất cả
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearVariantSelection}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Bỏ chọn
                                        </button>
                                        {selectedColors.map(colorId => {
                                            const color = availableColors.find(c => c.id === colorId);
                                            return (
                                                <button
                                                    key={colorId}
                                                    type="button"
                                                    onClick={() => selectVariantsByColor(colorId)}
                                                    className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm flex items-center"
                                                >
                                                    <span
                                                        className="w-3 h-3 rounded-full mr-1 border"
                                                        style={{ backgroundColor: color?.value }}
                                                    ></span>
                                                    Chọn {color?.name}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Bulk actions - Luôn hiển thị khi có variants */}
                                    <div className="bg-white p-4 rounded-lg border">
                                        <p className="text-sm text-gray-600 mb-3">
                                            Đã chọn {selectedVariants.length} biến thể
                                        </p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={bulkPrice}
                                                    onChange={(e) => setBulkPrice(e.target.value)}
                                                    placeholder="Giá (VND)"
                                                    className="flex-1 border border-gray-300 p-2 rounded"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={applyBulkPrice}
                                                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded text-sm"
                                                    disabled={selectedVariants.length === 0}
                                                >
                                                    Áp dụng giá
                                                </button>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={bulkQuantity}
                                                    onChange={(e) => setBulkQuantity(e.target.value)}
                                                    placeholder="Số lượng"
                                                    className="flex-1 border border-gray-300 p-2 rounded"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={applyBulkQuantity}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded text-sm"
                                                    disabled={selectedVariants.length === 0}
                                                >
                                                    Áp dụng SL
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Color-based image upload */}
                                    <div className="bg-white p-4 rounded-lg border">
                                        <h5 className="font-medium text-gray-700 mb-3">Ảnh theo màu sắc</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                            {selectedColors.map(colorId => {
                                                const color = availableColors.find(c => c.id === colorId);
                                                const colorName = color?.name || `Color ${colorId}`;
                                                return (
                                                    <div key={colorId} className="border border-gray-200 rounded-lg p-3">
                                                        <div className="flex items-center mb-2">
                                                            <span
                                                                className="w-4 h-4 rounded-full mr-2 border"
                                                                style={{ backgroundColor: color?.value }}
                                                            ></span>
                                                            <span className="font-medium text-sm">{colorName}</span>
                                                        </div>
                                                        {colorImages[colorName] && (
                                                            <img
                                                                src={colorImages[colorName]}
                                                                alt={colorName}
                                                                className="w-full h-20 object-cover rounded mb-2"
                                                            />
                                                        )}
                                                        <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs flex items-center justify-center">
                                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                            </svg>
                                                            Chọn ảnh
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleColorImageChange(colorId, e.target.files[0])}
                                                            />
                                                        </label>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Variants table */}
                            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                                    <h4 className="text-md font-semibold text-gray-800">
                                        Danh sách biến thể ({productVariants.length})
                                    </h4>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedVariants.length === productVariants.length}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                selectAllVariants();
                                                            } else {
                                                                clearVariantSelection();
                                                            }
                                                        }}
                                                        className="rounded"
                                                    />
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kích thước</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Màu sắc</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá (VND)</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số lượng</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hình ảnh</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {productVariants.map((variant, index) => (
                                                <tr key={variant.id} className={`hover:bg-gray-50 ${selectedVariants.includes(index) ? 'bg-blue-50' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedVariants.includes(index)}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setSelectedVariants([...selectedVariants, index]);
                                                                } else {
                                                                    setSelectedVariants(selectedVariants.filter(i => i !== index));
                                                                }
                                                            }}
                                                            className="rounded"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                            {variant.size_name}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <span
                                                                className="w-6 h-6 rounded-full mr-3 border-2 border-gray-300 shadow-sm"
                                                                style={{ backgroundColor: variant.color_code || '#FFFFFF' }}
                                                            ></span>
                                                            <span className="text-sm font-medium text-gray-900">{variant.color_name}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            value={variant.price}
                                                            onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            min="0"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <input
                                                            type="number"
                                                            value={variant.quantity}
                                                            onChange={(e) => updateVariant(index, 'quantity', parseInt(e.target.value) || 0)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            min="0"
                                                            placeholder="0"
                                                        />
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center space-x-2">
                                                            {variant.variant_image_url && (
                                                                <img
                                                                    src={getFullImageUrl(variant.variant_image_url)}
                                                                    alt="Variant"
                                                                    className="w-12 h-12 object-cover rounded-lg border shadow-sm"
                                                                    onError={(e) => {
                                                                        e.target.src = '/images/otherImages/no-image-placeholder.png';
                                                                    }}
                                                                />
                                                            )}
                                                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded text-xs">
                                                                Chọn
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    className="hidden"
                                                                    onChange={(e) => handleVariantImageChange(index, e.target.files[0])}
                                                                />
                                                            </label>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeVariant(index)}
                                                            className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-sm transition-colors duration-200"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Submit button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
                {/* Validation warnings */}
                {(selectedSizes.length > 0 && selectedColors.length > 0 && productVariants.length === 0) && (
                    <div className="mr-4 flex items-center text-yellow-600 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Vui lòng nhấn "Tạo biến thể" trước khi lưu</span>
                    </div>
                )}

                {productVariants.length === 0 && (
                    <div className="mr-4 flex items-center text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-200">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">Chưa có biến thể nào</span>
                    </div>
                )}

                <button
                    type="submit"
                    className={`bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${editId && !hasChanges ? 'opacity-60' : ''
                        }`}
                    disabled={isSubmitting || productVariants.length === 0 || (editId && !hasChanges)}
                >
                    {isSubmitting ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {editId
                                ? `Cập nhật sản phẩm${hasChanges ? ` (${changesCount} thay đổi)` : ''}`
                                : 'Thêm sản phẩm'
                            }
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}

export default ProductForm;
