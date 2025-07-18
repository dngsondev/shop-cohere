import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

import {
    getAllProducts,
    getAllInfoProducts,
    getProductById,
    getProductByVariantId,
    getVoucher,
    getTopProducts,
    getSizes,
    getColors,
    getBrands,
    getCategories,
    getMaterials,
    getTargets,
    createProduct,
    updateProduct as updateProductModel,
    updateVariant as updateVariantModel,
    getProductImages,
    deleteProduct,
    getProductsByCategory,
    getProductReviews,
    createReviewWithMedia,
    deleteReview,
    getAllReviews,
    replyReview,
    searchProducts,
    suggestProducts,
    getProductsForYou
} from '../models/productModel.js';

import {
    processImagesInDescription,
    processDescriptionImages,
    cleanupOldDescriptionImages,
    extractImagesFromDescription,
    cleanupOrphanedImages,
    getAllUsedDescriptionImages
} from '../utils/imageHandler.js';

// Lấy tất cả sản phẩm
export const getAllProductsController = async (req, res) => {
    try {
        const products = await getAllProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Error fetching products' });
    }
};

// Get all product info for admin display
export const getAllInfoProductsController = async (req, res) => {
    try {
        const products = await getAllInfoProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching product info:', error);
        res.status(500).json({ message: 'Error fetching product info' });
    }
};

// Get specific product
export const getProductController = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await getProductById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ message: 'Error fetching product' });
    }
};

// Get product by variant ID
export const getProductByVariantIdController = async (req, res) => {
    try {
        // console.log(req.params);

        const { variantId } = req.params;
        // console.log(`Fetching product for variant ID: ${variantId}`);

        const product = await getProductByVariantId(variantId);

        if (!product) {
            return res.status(404).json({ message: 'Product variant not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error fetching product by variant:', error);
        res.status(500).json({ message: 'Error fetching product by variant' });
    }
};

// Check voucher validity
export const checkVoucherController = async (req, res) => {
    try {
        const { voucherCode } = req.query; // Sửa từ req.body thành req.query

        if (!voucherCode) {
            return res.status(400).json({
                valid: false,
                message: 'Voucher code is required'
            });
        }

        const voucher = await getVoucher(voucherCode);

        if (!voucher) {
            return res.status(404).json({
                valid: false,
                message: 'Voucher not found'
            });
        }

        // Kiểm tra thời hạn voucher
        const now = new Date();
        const expiryDate = new Date(voucher.valid_to);

        if (now > expiryDate) {
            return res.status(400).json({
                valid: false,
                message: 'Voucher has expired'
            });
        }

        // Kiểm tra ngày bắt đầu
        const startDate = new Date(voucher.valid_from);
        if (now < startDate) {
            return res.status(400).json({
                valid: false,
                message: 'Voucher is not yet active'
            });
        }

        // Trả về voucher hợp lệ với flag valid: true
        res.json({
            valid: true,
            ...voucher,
            message: 'Voucher is valid'
        });

    } catch (error) {
        console.error('Error checking voucher:', error);
        res.status(500).json({
            valid: false,
            message: 'Error checking voucher'
        });
    }
};

// Get top products (best sellers or newest)
export const getTopProductsController = async (req, res) => {
    try {
        const topProducts = await getTopProducts();
        res.json(topProducts);
    } catch (error) {
        console.error('Error fetching top products:', error);
        res.status(500).json({ message: 'Error fetching top products' });
    }
};

// Get all available sizes
export const getAllSizes = async (req, res) => {
    try {
        const sizes = await getSizes();
        res.json(sizes);
    } catch (error) {
        console.error('Error fetching sizes:', error);
        res.status(500).json({ message: 'Error fetching sizes' });
    }
};

// Get all available colors
export const getAllColors = async (req, res) => {
    try {
        const colors = await getColors();
        res.json(colors);
    } catch (error) {
        console.error('Error fetching colors:', error);
        res.status(500).json({ message: 'Error fetching colors' });
    }
};

// Get all brands
export const getAllBrands = async (req, res) => {
    try {
        const brands = await getBrands();
        res.json(brands);
    } catch (error) {
        console.error('Error fetching brands:', error);
        res.status(500).json({ message: 'Error fetching brands' });
    }
};

// Get all categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await getCategories();
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ message: 'Error fetching categories' });
    }
};

// Get all materials
export const getAllMaterials = async (req, res) => {
    try {
        const materials = await getMaterials();
        res.json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ message: 'Error fetching materials' });
    }
};

// Get all targets
export const getAllTargets = async (req, res) => {
    try {
        const targets = await getTargets();
        res.json(targets);
    } catch (error) {
        console.error('Error fetching targets:', error);
        res.status(500).json({ message: 'Error fetching targets' });
    }
};

// Create a new product
export const createProductController = async (req, res) => {
    try {
        console.log('🚀 ===== PRODUCT CREATION START =====');
        console.log('📊 REQUEST ANALYSIS:');
        console.log('  - Files count:', req.files?.length || 0);
        console.log('  - Request size:', JSON.stringify(req.body).length, 'bytes');

        // Batch process images để tránh quá tải
        const BATCH_SIZE = 5;

        // LOG CHI TIẾT TẤT CẢ FILES
        if (req.files) {
            if (Array.isArray(req.files) && req.files.length > 0) {
                req.files.forEach((file, index) => {
                    console.log(`📸 FILE ${index + 1}:`, {
                        fieldname: file.fieldname,
                        originalname: file.originalname,
                        encoding: file.encoding,
                        mimetype: file.mimetype,
                        destination: file.destination,
                        filename: file.filename,
                        path: file.path,
                        size: file.size
                    });
                });
            } else {
                console.log('⚠️ Files exist but not an array or empty:', req.files);
            }
        } else {
            console.log('❌ NO FILES RECEIVED');
        }

        // LOG CHI TIẾT REQUEST BODY FIELDS
        console.log('📋 REQUEST BODY ANALYSIS:');
        for (const [key, value] of Object.entries(req.body)) {
            if (typeof value === 'string' && value.length > 100) {
                console.log(`${key}: [STRING - ${value.length} chars] ${value.substring(0, 100)}...`);
            } else {
                console.log(`${key}:`, value);
            }
        }

        // Validate required fields
        const requiredFields = ['product_name', 'brand_id', 'category_id', 'material_id', 'target_id'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                console.log(`❌ Missing required field: ${field}`);
                return res.status(400).json({
                    success: false,
                    message: `Missing required field: ${field}`
                });
            }
        }

        // Parse JSON fields với error handling
        let size_ids = [];
        let color_ids = [];
        let variants = [];

        try {
            if (req.body.size_ids) {
                size_ids = typeof req.body.size_ids === 'string'
                    ? JSON.parse(req.body.size_ids)
                    : req.body.size_ids;
                console.log('✅ Parsed size_ids:', size_ids);
            }

            if (req.body.color_ids) {
                color_ids = typeof req.body.color_ids === 'string'
                    ? JSON.parse(req.body.color_ids)
                    : req.body.color_ids;
                console.log('✅ Parsed color_ids:', color_ids);
            }

            if (req.body.variants) {
                variants = typeof req.body.variants === 'string'
                    ? JSON.parse(req.body.variants)
                    : req.body.variants;
            }
        } catch (parseError) {
            console.error('❌ JSON parsing error:', parseError);
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON format in request data',
                error: parseError.message
            });
        }

        // ========== 1. XỬ LÝ ẢNH CHUNG CỦA SẢN PHẨM (BATCH PROCESSING) ==========
        console.log('🖼️ ===== PROCESSING MAIN PRODUCT IMAGES =====');
        let mainProductImages = [];

        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            console.log(`📸 Processing ${req.files.length} main product files in batches...`);

            // Xử lý theo batch để tránh quá tải memory
            for (let i = 0; i < req.files.length; i += BATCH_SIZE) {
                const batch = req.files.slice(i, i + BATCH_SIZE);
                console.log(`🔄 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(req.files.length / BATCH_SIZE)}`);

                const batchImages = batch.map((file, index) => {
                    const imagePath = `uploads/products/${file.filename}`;
                    console.log(`✅ Batch image ${index + 1}:`, {
                        originalName: file.originalname,
                        savedAs: file.filename,
                        size: `${(file.size / 1024).toFixed(2)} KB`
                    });
                    return imagePath;
                });

                mainProductImages.push(...batchImages);

                // Thêm delay nhỏ giữa các batch để tránh quá tải
                if (i + BATCH_SIZE < req.files.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            console.log(`✅ Total main product images processed: ${mainProductImages.length}`);
        } else {
            console.log('⚠️ NO MAIN PRODUCT IMAGES');
        }

        // ========== 2. XỬ LÝ ẢNH MÔ TẢ (QUILL EDITOR) → uploads/quill/ ==========
        console.log('📝 ===== PROCESSING DESCRIPTION IMAGES =====');
        let processedDescription = req.body.description || '';
        let descriptionImageUrls = [];

        if (processedDescription && processedDescription.includes('data:image')) {
            console.log('🔍 Found base64 images in description, processing...');
            try {
                // ✨ Sử dụng processDescriptionImages với prefix tùy chỉnh
                processedDescription = await processDescriptionImages(
                    processedDescription,
                    'new-product'
                );

                // ✨ Extract danh sách images đã được xử lý
                descriptionImageUrls = extractImagesFromDescription(processedDescription);
                console.log(`✅ Description images processed: ${descriptionImageUrls.length}`);
                descriptionImageUrls.forEach((url, index) => {
                    console.log(`  📝 Description image ${index + 1}: ${url}`);
                });
            } catch (error) {
                console.error('❌ Description processing failed:', error);
            }
        } else {
            console.log('ℹ️ No base64 images found in description');
        }

        // ========== 3. XỬ LÝ ẢNH VARIANTS → uploads/variants/ ==========
        // Map để lưu ảnh đã xử lý cho từng màu sắc
        const colorImageMap = new Map();
        const processedVariants = [];
        let variantIndex = 0;

        for (const colorId of color_ids) {
            // Tìm base64 đầu tiên của màu này trong variants
            let colorBase64 = null;
            let extension = null;
            for (let i = 0; i < variants.length; i++) {
                const variant = variants[i];
                if (variant.color_id == colorId && variant.variant_image_url && variant.variant_image_url.startsWith('data:image/')) {
                    const matches = variant.variant_image_url.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        extension = matches[1];
                        colorBase64 = matches[2];
                        break;
                    }
                }
            }

            let imageUrl = null;
            if (colorBase64) {
                // Nếu màu này đã có ảnh, dùng lại
                if (colorImageMap.has(colorId)) {
                    imageUrl = colorImageMap.get(colorId);
                } else {
                    // Lưu file mới
                    const hash = crypto.createHash('md5').update(colorBase64).digest('hex');
                    const filename = `variant-color${colorId}-${hash}.${extension}`;
                    const filePath = path.join('uploads', 'variants', filename);
                    const fullPath = path.join(process.cwd(), filePath);

                    if (!fs.existsSync(path.dirname(fullPath))) {
                        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                    }
                    if (!fs.existsSync(fullPath)) {
                        fs.writeFileSync(fullPath, Buffer.from(colorBase64, 'base64'));
                    }
                    imageUrl = filePath.replace(/\\/g, '/');
                    colorImageMap.set(colorId, imageUrl);
                }
            }

            // Gán imageUrl cho tất cả biến thể cùng màu
            for (const sizeId of size_ids) {
                const variant = variants[variantIndex];
                if (!variant) {
                    console.error(`❌ Variant at index ${variantIndex} not found`);
                    continue;
                }

                let variantImageUrl = imageUrl || null;
                // Nếu không có base64, kiểm tra xem có đường dẫn sẵn không
                if (!variantImageUrl && variant.variant_image_url && !variant.variant_image_url.startsWith('data:')) {
                    variantImageUrl = variant.variant_image_url;
                }

                processedVariants.push({
                    color_id: parseInt(colorId),
                    size_id: parseInt(sizeId),
                    price: parseFloat(variant.price),
                    quantity: parseInt(variant.quantity),
                    image_url: variantImageUrl
                });

                variantIndex++;
            }
        }

        // ========== CHUẨN BỊ DỮ LIỆU CUỐI CÙNG ==========
        const productData = {
            product_name: req.body.product_name.trim(),
            brand_id: parseInt(req.body.brand_id),
            category_id: parseInt(req.body.category_id),
            material_id: parseInt(req.body.material_id),
            target_id: parseInt(req.body.target_id),
            discount: parseFloat(req.body.discount) || 0,
            description: processedDescription, // ✨ Description đã được xử lý base64 → file paths
            color_ids,
            size_ids,
            // ✨ CHỈ LƯU ẢNH CHÍNH (description images đã được xử lý trong description content)
            uploadedImageUrls: mainProductImages,
            variants: processedVariants
        };

        // Create product in database
        console.log('💾 Creating product in database...');
        const result = await createProduct(productData);

        res.status(201).json({
            success: true,
            message: 'Product created successfully',
            product_id: result.product_id,
            variants_created: result.variants_count || processedVariants.length,
            images_breakdown: {
                main_product_images: mainProductImages.length,
                variant_images: processedVariants.filter(v => v.image_url).length,
                description_images: descriptionImageUrls.length,
                total_images: mainProductImages.length + processedVariants.filter(v => v.image_url).length + descriptionImageUrls.length
            },
            file_locations: {
                main_images: 'uploads/products/ (from form upload)',
                variant_images: 'uploads/variants/ (from base64)',
                description_images: 'uploads/quill/ (from Quill editor base64)'
            }
        });

    } catch (error) {
        console.error('❌ Error creating product:', error);
        console.error('Stack:', error.stack);

        res.status(500).json({
            success: false,
            message: 'Internal server error while creating product',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Update an existing product
export const updateProductController = async (req, res) => {
    console.log("🔄 UPDATE PRODUCT - Product ID:", req.params.id);
    console.log("📦 Request body keys:", Object.keys(req.body));

    try {
        const productId = req.params.id;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // ✨ Lấy thông tin sản phẩm hiện tại trước khi update
        const allProducts = await getAllInfoProducts();
        const currentProduct = allProducts.find(p => p.product_id === parseInt(productId));

        if (!currentProduct) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // ✨ Lấy description cũ để cleanup images sau khi update thành công
        const oldProduct = await getProductById(productId);
        const oldDescription = oldProduct?.description;

        console.log("📋 Current product info:", {
            brand_id: currentProduct.brand_id,
            category_id: currentProduct.category_id,
            material_id: currentProduct.material_id,
            target_id: currentProduct.target_id
        });

        // ✨ Kiểm tra xem có phải là update chỉ những thay đổi không
        const isPartialUpdate = req.body.product_id && Object.keys(req.body).length < 10;

        if (isPartialUpdate) {
            console.log("🔧 Partial update detected, processing only changes...");

            // ✨ Xử lý description mới nếu có
            let processedDescription = req.body.description;
            if (processedDescription && processedDescription.includes('data:image')) {
                console.log('🖼️ Processing description images for partial update...');
                processedDescription = await processDescriptionImages(
                    processedDescription,
                    `product-${productId}`
                );
            }

            // Xử lý update từng phần với thông tin từ sản phẩm hiện tại
            const updateData = {
                product_id: parseInt(productId),
                brand_id: currentProduct.brand_id,
                category_id: currentProduct.category_id,
                material_id: currentProduct.material_id,
                target_id: currentProduct.target_id,
                product_name: currentProduct.product_name,
                description: processedDescription || oldDescription // ✨ Sử dụng description đã xử lý
            };

            // Xử lý các trường cơ bản có thể được cập nhật
            const allowedFields = ['product_name', 'discount'];

            allowedFields.forEach(field => {
                if (req.body[field] !== undefined) {
                    updateData[field] = req.body[field];
                    console.log(`✓ Will update ${field}:`, req.body[field]);
                }
            });

            // Xử lý arrays
            if (req.body.size_ids) {
                try {
                    updateData.size_ids = JSON.parse(req.body.size_ids);
                    console.log("✓ Will update size_ids:", updateData.size_ids);
                } catch (e) {
                    console.error("Error parsing size_ids:", e);
                }
            }

            if (req.body.color_ids) {
                try {
                    updateData.color_ids = JSON.parse(req.body.color_ids);
                    console.log("✓ Will update color_ids:", updateData.color_ids);
                } catch (e) {
                    console.error("Error parsing color_ids:", e);
                }
            }

            if (req.body.variants) {
                try {
                    let variants = JSON.parse(req.body.variants);
                    // Xử lý base64 cho từng variant
                    variants = await Promise.all(variants.map(async (variant, idx) => {
                        let variantImageUrl = variant.variant_image_url;
                        if (variantImageUrl && variantImageUrl.startsWith('data:image/')) {
                            try {
                                const matches = variantImageUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
                                if (matches && matches.length === 3) {
                                    const extension = matches[1];
                                    const base64Data = matches[2];
                                    const filename = `variant-${Date.now()}-${idx + 1}.${extension}`;
                                    const filePath = path.join('uploads', 'variants', filename);
                                    const fullPath = path.join(process.cwd(), filePath);
                                    const dir = path.dirname(fullPath);
                                    if (!fs.existsSync(dir)) {
                                        fs.mkdirSync(dir, { recursive: true });
                                    }
                                    const buffer = Buffer.from(base64Data, 'base64');
                                    fs.writeFileSync(fullPath, buffer);
                                    variant.variant_image_url = filePath.replace(/\\/g, '/');
                                    console.log(`✅ [Partial] Variant image saved: ${variant.variant_image_url}`);
                                } else {
                                    variant.variant_image_url = null;
                                }
                            } catch (error) {
                                console.error('❌ [Partial] Error processing variant image:', error);
                                variant.variant_image_url = null;
                            }
                        } else if (variantImageUrl && !variantImageUrl.startsWith('uploads/variants/')) {
                            // Không hợp lệ, bỏ qua
                            variant.variant_image_url = null;
                        }
                        return variant;
                    }));
                    updateData.variants = variants;
                    console.log("✓ Will update variants count:", updateData.variants.length);
                } catch (e) {
                    console.error("Error parsing variants:", e);
                }
            }

            if (req.body.productImages) {
                try {
                    updateData.productImages = JSON.parse(req.body.productImages);
                    console.log("✓ Will update productImages count:", updateData.productImages.length);
                } catch (e) {
                    console.error("Error parsing productImages:", e);
                }
            }

            // Xử lý file ảnh mới nếu có
            if (req.files && req.files.length > 0) {
                const newImageUrls = req.files.map(file => `uploads/products/${file.filename}`);
                // Nếu đã có productImages thì nối thêm, nếu chưa có thì gán luôn
                if (updateData.productImages && Array.isArray(updateData.productImages)) {
                    updateData.productImages = [...updateData.productImages, ...newImageUrls];
                } else {
                    updateData.productImages = newImageUrls;
                }
                console.log("✓ New images uploaded:", newImageUrls.length);
            }

            console.log("📋 Final update data:", updateData);

            // Gọi hàm update với dữ liệu đã lọc
            const result = await updateProductModel(updateData);

            // ✨ Cleanup old description images sau khi update thành công
            if (oldDescription && req.body.description && req.body.description !== oldDescription) {
                console.log('🧹 Cleaning up old description images...');
                await cleanupOldDescriptionImages(oldDescription);
            }

            return res.status(200).json({
                success: true,
                message: 'Product updated successfully (partial update)',
                product_id: parseInt(productId),
                changes_applied: Object.keys(updateData).filter(key => !['brand_id', 'category_id', 'material_id', 'target_id'].includes(key)).length,
                updated_fields: Object.keys(updateData).filter(key => req.body[key] !== undefined),
                variants_count: result.variants_count || 0
            });
        }

        // ✨ Nếu không phải partial update, thực hiện full update
        console.log("🔄 Full update mode...");

        // Validate required fields
        const requiredFields = ['product_name', 'brand_id', 'category_id', 'material_id', 'target_id'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                console.log(`❌ Missing required field: ${field}`);
                return res.status(400).json({
                    success: false,
                    message: `Missing required field: ${field}`
                });
            }
        }

        // Parse JSON fields với error handling
        let size_ids = [];
        let color_ids = [];
        let variants = [];

        try {
            if (req.body.size_ids) {
                size_ids = typeof req.body.size_ids === 'string'
                    ? JSON.parse(req.body.size_ids)
                    : req.body.size_ids;
                console.log('✅ Parsed size_ids:', size_ids);
            }

            if (req.body.color_ids) {
                color_ids = typeof req.body.color_ids === 'string'
                    ? JSON.parse(req.body.color_ids)
                    : req.body.color_ids;
                console.log('✅ Parsed color_ids:', color_ids);
            }

            if (req.body.variants) {
                variants = typeof req.body.variants === 'string'
                    ? JSON.parse(req.body.variants)
                    : req.body.variants;
            }
        } catch (parseError) {
            console.error('❌ JSON parsing error:', parseError);
            return res.status(400).json({
                success: false,
                message: 'Invalid JSON format in request data',
                error: parseError.message
            });
        }

        // ========== 1. XỬ LÝ ẢNH CHUNG CỦA SẢN PHẨM → uploads/products/ ==========
        console.log('🖼️ ===== PROCESSING MAIN PRODUCT IMAGES =====');
        let mainProductImages = [];

        if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            mainProductImages = req.files.map((file, index) => {
                const imagePath = `uploads/products/${file.filename}`;
                console.log(`✅ Main image ${index + 1}:`, {
                    originalName: file.originalname,
                    savedAs: file.filename,
                    fullPath: imagePath,
                    size: `${(file.size / 1024).toFixed(2)} KB`,
                    mimetype: file.mimetype
                });
                return imagePath;
            });

            console.log(`✅ Total main product images processed: ${mainProductImages.length}`);
        } else {
            console.log('⚠️ NO NEW MAIN PRODUCT IMAGES');
        }

        // ========== 2. XỬ LÝ ẢNH MÔ TẢ (QUILL EDITOR) → uploads/quill/ ==========
        console.log('📝 ===== PROCESSING DESCRIPTION IMAGES =====');
        let processedDescription = req.body.description || '';

        if (processedDescription && processedDescription.includes('data:image')) {
            console.log('🔍 Found base64 images in description, processing...');
            try {
                processedDescription = await processDescriptionImages(
                    processedDescription,
                    `product-${productId}`
                );
                console.log(`✅ Description images processed successfully`);
            } catch (error) {
                console.error('❌ Description processing failed:', error);
            }
        } else {
            console.log('ℹ️ No base64 images found in description');
        }

        // ========== 3. XỬ LÝ ẢNH VARIANTS (EDIT) → uploads/variants/ ==========
        const colorImageMap = new Map();
        const processedVariants = [];
        let variantIndex = 0;

        for (const colorId of color_ids) {
            // Tìm base64 đầu tiên của màu này trong variants
            let colorBase64 = null;
            let extension = null;
            for (let i = 0; i < variants.length; i++) {
                const variant = variants[i];
                if (
                    variant.color_id == colorId &&
                    variant.variant_image_url &&
                    variant.variant_image_url.startsWith('data:image/')
                ) {
                    const matches = variant.variant_image_url.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
                    if (matches && matches.length === 3) {
                        extension = matches[1];
                        colorBase64 = matches[2];
                        break;
                    }
                }
            }

            let imageUrl = null;
            if (colorBase64) {
                // Nếu màu này đã có ảnh base64 mới, lưu lại
                if (colorImageMap.has(colorId)) {
                    imageUrl = colorImageMap.get(colorId);
                } else {
                    const hash = crypto.createHash('md5').update(colorBase64).digest('hex');
                    const filename = `variant-color${colorId}-${hash}.${extension}`;
                    const filePath = path.join('uploads', 'variants', filename);
                    const fullPath = path.join(process.cwd(), filePath);

                    if (!fs.existsSync(path.dirname(fullPath))) {
                        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
                    }
                    if (!fs.existsSync(fullPath)) {
                        fs.writeFileSync(fullPath, Buffer.from(colorBase64, 'base64'));
                    }
                    imageUrl = filePath.replace(/\\/g, '/');
                    colorImageMap.set(colorId, imageUrl);
                }
            }

            // Gán imageUrl cho tất cả biến thể cùng màu
            for (const sizeId of size_ids) {
                const variant = variants[variantIndex];
                if (!variant) {
                    console.error(`❌ Variant at index ${variantIndex} not found`);
                    continue;
                }

                let variantImageUrl = imageUrl || null;
                // Nếu không có base64 mới, giữ lại đường dẫn cũ (nếu có)
                if (!variantImageUrl && variant.variant_image_url && !variant.variant_image_url.startsWith('data:')) {
                    variantImageUrl = variant.variant_image_url;
                }

                processedVariants.push({
                    color_id: parseInt(colorId),
                    size_id: parseInt(sizeId),
                    price: parseFloat(variant.price),
                    quantity: parseInt(variant.quantity),
                    image_url: variantImageUrl
                });

                variantIndex++;
            }
        }

        // ========== CHUẨN BỊ DỮ LIỆU CUỐI CÙNG ==========
        const updateData = {
            product_id: parseInt(productId),
            product_name: req.body.product_name.trim(),
            brand_id: parseInt(req.body.brand_id),
            category_id: parseInt(req.body.category_id),
            material_id: parseInt(req.body.material_id),
            target_id: parseInt(req.body.target_id),
            discount: parseFloat(req.body.discount) || 0,
            description: processedDescription, // ✨ Description đã được xử lý
            color_ids,
            size_ids,
            // Combine existing images with new ones
            uploadedImageUrls: [
                ...(req.body.existingImages ? JSON.parse(req.body.existingImages) : []),
                ...mainProductImages
            ],
            variants: processedVariants
        };

        // Update product in database
        console.log('💾 Updating product in database...');
        const result = await updateProductModel(updateData);

        // ✨ Cleanup old description images sau khi update thành công
        if (oldDescription && req.body.description && req.body.description !== oldDescription) {
            console.log('🧹 Cleaning up old description images...');
            await cleanupOldDescriptionImages(oldDescription);
        }

        console.log('✅ Product updated successfully with ID:', productId);

        res.status(200).json({
            success: true,
            message: 'Product updated successfully',
            product_id: parseInt(productId),
            variants_updated: result.variants_count || processedVariants.length,
            images_breakdown: {
                main_product_images: mainProductImages.length,
                variant_images: processedVariants.filter(v => v.image_url && !v.image_url.startsWith('data:')).length,
                description_images_processed: true,
                total_new_images: mainProductImages.length + variantImagesProcessed
            },
            file_locations: {
                main_images: 'uploads/products/ (from form upload)',
                variant_images: 'uploads/variants/ (from base64)',
                description_images: 'uploads/quill/ (from Quill editor base64)'
            }
        });

    } catch (error) {
        console.error('❌ Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while updating product',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// Get all product images
export const getProductImagesController = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Getting images for product ID:', id);

        const images = await getProductImages(id);
        console.log('📸 Found images:', images);

        res.json({
            success: true,
            data: images
        });
    } catch (error) {
        console.error('❌ Error fetching product images:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product images',
            error: error.message
        });
    }
};

// Delete product
export const deleteProductController = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🗑️ Deleting product ID:', id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        // ✨ Lấy thông tin product trước khi xóa để cleanup images
        const product = await getProductById(id);

        const result = await deleteProduct(id);

        // ✨ Cleanup description images sau khi xóa product thành công
        if (product?.description) {
            console.log('🧹 Cleaning up description images after product deletion...');
            await cleanupOldDescriptionImages(product.description);
        }

        console.log('✅ Product deleted successfully:', result);

        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: result
        });
    } catch (error) {
        console.error('❌ Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
};

// ✨ Route mới để cleanup orphaned images
export const cleanupImagesController = async (req, res) => {
    try {
        // Import connection từ db config
        const { default: connection } = await import('../config/db.js');

        // Mock pool object để tương thích với getAllUsedDescriptionImages
        const mockPool = {
            execute: (query) => {
                return new Promise((resolve, reject) => {
                    connection.query(query, (err, results) => {
                        if (err) reject(err);
                        else resolve([results]);
                    });
                });
            }
        };

        const usedImages = await getAllUsedDescriptionImages(mockPool);
        const cleanedCount = await cleanupOrphanedImages(usedImages);

        res.json({
            success: true,
            message: `Cleaned up ${cleanedCount} orphaned images`,
            usedImagesCount: usedImages.length
        });

    } catch (error) {
        console.error('❌ Error cleaning up images:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup images',
            error: error.message
        });
    }
};

// Lấy tất cả các sản phẩm theo danh mục
export const getProductsByCategoryController = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const excludeProductId = req.query.exclude; // Lấy productId cần loại trừ từ query param
        console.log('🔍 Getting products for category ID:', categoryId, 'Exclude product:', excludeProductId);

        if (!categoryId) {
            return res.status(400).json({
                success: false,
                message: 'Category ID is required'
            });
        }

        // Truyền thêm excludeProductId vào model
        const products = await getProductsByCategory(categoryId, excludeProductId);
        console.log(`📦 Found ${products.length} products in category ${categoryId} (excluding ${excludeProductId})`);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('❌ Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products by category',
            error: error.message
        });
    }
};

// Lấy đánh giá sản phẩm
export const getProductReviewsController = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Getting reviews for product ID:', id);

        if (!id) {
            return res.status(400).json({
                success: false,
                message: 'Product ID is required'
            });
        }

        const reviews = await getProductReviews(id);
        console.log(`📦 Found ${reviews.length} reviews for product ${id}`);

        res.json({
            success: true,
            data: reviews
        });
    } catch (error) {
        console.error('❌ Error fetching product reviews:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product reviews',
            error: error.message
        });
    }
};

// Tạo đánh giá sản phẩm
export const createProductReviewsController = async (req, res) => {
    try {
        console.log(req.body);

        const { customerId, rating, comment, variantId } = req.body;
        const productId = req.params.id;

        // Lấy danh sách file đã upload (ảnh/video)
        // Nếu dùng multer, file.path là đường dẫn file đã lưu
        const mediaUrls = (req.files || []).map(file => {
            // file.path có dạng: uploads/review-images/abc.jpg hoặc uploads/review-videos/xyz.mp4
            // Lấy phần sau 'uploads/' để tạo url public
            const relativePath = file.path.replace(/\\/g, '/').split('uploads/')[1];
            return `/uploads/${relativePath}`;
        });

        // Gọi model để thêm review và media
        const review_id = await createReviewWithMedia(
            {
                customer_id: customerId,
                product_id: productId,
                pv_id: variantId,
                rating,
                comment
            },
            mediaUrls
        );

        res.status(201).json({ success: true, review_id });
    } catch (error) {
        console.error('Error creating review:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

//xoá đánh giá sản phẩm
export const deleteReviewController = async (req, res) => {
    try {
        const reviewId = req.params.reviewId;
        const userId = req.body.userId; // Lấy từ frontend gửi lên (hoặc từ token nếu dùng JWT)
        const result = await deleteReview(reviewId, userId);
        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(403).json({ success: false, message: "Bạn không có quyền xóa đánh giá này." });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

//Lấy tất cả đánh giá sản phẩm
export const getAllReviewsController = async (req, res) => {
    try {
        const reviews = await getAllReviews();
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error fetching all reviews:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};

//Trả lời đánh giá sản phẩm
export const replyReviewController = async (req, res) => {
    try {

        console.log('🔄 Replying to review - Review ID:', req.params.reviewId);
        // Lấy reviewId từ params và nội dung trả lời từ body
        console.log('📦 Request body keys:', req.body);


        const reviewId = req.params.reviewId;
        const { content, user_id } = req.body;

        if (!reviewId || !content || !user_id) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }

        const result = await replyReview(reviewId, content, user_id);
        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Reply added successfully' });
        } else {
            res.status(404).json({ success: false, message: 'Review not found or already replied' });
        }
    } catch (error) {
        console.error('Error replying to review:', error);
        res.status(500).json({ success: false, error: error.message });
    }
}

export const searchProductController = async (req, res) => {
    try {
        const q = req.query.q || '';
        if (!q) return res.json([]);
        const products = await searchProducts(q);
        res.json(products);
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

export const suggestProductController = async (req, res) => {
    try {
        const q = req.query.q || '';
        if (!q) return res.json([]);
        const suggestions = await suggestProducts(q);
        res.json(suggestions);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

export const getProductsForYouController = async (req, res) => {
    try {
        const userId = req.query.userId;
        const products = await getProductsForYou(userId);
        res.json(products);
    } catch (error) {
        console.error('Error fetching products for you:', error);
        res.status(500).json({ message: 'Error fetching products for you' });
    }
};