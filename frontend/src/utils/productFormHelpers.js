import productService from '../services/productService';

/**
 * Consolidates product data from multiple variants with the same product_id
 * @param {Array} products - Array of product variants from the API
 * @param {number} productId - The product_id to filter by
 * @param {Array} productImages - Array of product image URLs from API
 * @returns {Object} - Consolidated product data for the ProductForm
 */
export const consolidateProductData = (products, productId, productImages = []) => {
    console.log("🔍 consolidateProductData called with:");
    console.log("  - products:", products?.length || 0);
    console.log("  - productId:", productId);
    console.log("  - productImages:", productImages);
    console.log("  - productImages length:", productImages?.length || 0);

    if (!products || !products.length || !productId) {
        console.log("❌ Invalid inputs for consolidateProductData");
        return null;
    }

    // Filter products with the matching product_id
    const productVariants = products.filter(p =>
        p.product_id === productId || p.product_id === Number(productId)
    );

    console.log("Found variants:", productVariants.length, "for product ID:", productId);

    if (!productVariants.length) {
        console.log("❌ No variants found for product ID:", productId);
        return null;
    }

    // Get the main product data from the first variant
    const baseProduct = productVariants[0];
    console.log("Sample variant data:", baseProduct);

    // Extract unique values and create maps
    const sizeMap = new Map();
    const colorMap = new Map();
    const brandMap = new Map();
    const categoryMap = new Map();
    const materialMap = new Map();
    const targetMap = new Map();

    // Build maps and collect variants
    const variants = productVariants.map(variant => {
        // Size mapping
        if (variant.size_id && variant.size_name) {
            sizeMap.set(variant.size_id.toString(), {
                id: variant.size_id.toString(),
                name: variant.size_name
            });
        }

        // Color mapping
        if (variant.color_id && variant.color_name) {
            colorMap.set(variant.color_id.toString(), {
                id: variant.color_id.toString(),
                name: variant.color_name,
                code: variant.color_code
            });
        }

        // Brand mapping
        if (variant.brand_id && variant.brand_name) {
            brandMap.set(variant.brand_id.toString(), {
                id: variant.brand_id.toString(),
                name: variant.brand_name
            });
        }

        // Category mapping
        if (variant.category_id && variant.category_name) {
            categoryMap.set(variant.category_id.toString(), {
                id: variant.category_id.toString(),
                name: variant.category_name
            });
        }

        // Material mapping
        if (variant.material_id && variant.material_name) {
            materialMap.set(variant.material_id.toString(), {
                id: variant.material_id.toString(),
                name: variant.material_name
            });
        }

        // Target mapping
        if (variant.target_id && variant.target_name) {
            targetMap.set(variant.target_id.toString(), {
                id: variant.target_id.toString(),
                name: variant.target_name
            });
        }

        return {
            variant_id: variant.variant_id,
            product_id: variant.product_id,
            color_id: variant.color_id?.toString() || '',
            size_id: variant.size_id?.toString() || '',
            price: variant.price || '',
            quantity: variant.quantity || 0,
            image_url: variant.variant_image_url || ''
        };
    });

    // Get arrays of IDs for form
    const size_ids = Array.from(sizeMap.keys());
    const color_ids = Array.from(colorMap.keys());

    // Get default IDs for single selects
    const defaultBrandId = baseProduct.brand_id?.toString() || '';
    const defaultCategoryId = baseProduct.category_id?.toString() || '';
    const defaultMaterialId = baseProduct.material_id?.toString() || '';
    const defaultTargetId = baseProduct.target_id?.toString() || '';

    // ✨ Sử dụng productImages từ parameter
    console.log("✅ Using productImages from parameter:", productImages);

    // Prepare the consolidated data object
    const result = {
        product_id: baseProduct.product_id,
        product_name: baseProduct.product_name || '',
        brand_id: defaultBrandId,
        category_id: defaultCategoryId,
        material_id: defaultMaterialId,
        target_id: defaultTargetId,
        discount: baseProduct.discount || 0,
        description: baseProduct.description || '',

        // IDs for form selection
        size_ids: size_ids,
        color_ids: color_ids,

        // Maps for lookup
        sizeMap: Object.fromEntries(sizeMap),
        colorMap: Object.fromEntries(colorMap),
        brandMap: Object.fromEntries(brandMap),
        categoryMap: Object.fromEntries(categoryMap),
        materialMap: Object.fromEntries(materialMap),
        targetMap: Object.fromEntries(targetMap),

        // Names as strings for display
        sizes: Array.from(sizeMap.values()).map(s => s.name).join(', '),
        colors: Array.from(colorMap.values()).map(c => c.name).join(', '),

        // Brand, category, material and target names (for display if needed)
        brand_name: brandMap.get(defaultBrandId)?.name || '',
        category_name: categoryMap.get(defaultCategoryId)?.name || '',
        material_name: materialMap.get(defaultMaterialId)?.name || '',
        target_name: targetMap.get(defaultTargetId)?.name || '',

        // ✨ Sử dụng productImages từ parameter thay vì hardcode []
        productImages: productImages || [],

        // Variants data for the form
        variants: variants
    };

    console.log("✅ Consolidated result:");
    console.log("  - productImages count:", result.productImages.length);
    console.log("  - productImages data:", result.productImages);

    return result;
};

/**
 * Cache cho data từ API để tránh gọi lại nhiều lần
 */
let cachedMappingData = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Lấy mapping data từ API và cache lại
 * @returns {Promise<Object>} - Object chứa mapping data
 */
const getMappingData = async () => {
    const now = Date.now();

    // Kiểm tra cache còn hiệu lực không
    if (cachedMappingData && now < cacheExpiry) {
        return cachedMappingData;
    }

    try {
        console.log('🔄 Fetching mapping data from API...');

        // Gọi tất cả API cùng lúc
        const [
            sizesResponse,
            colorsResponse,
            brandsResponse,
            categoriesResponse,
            materialsResponse,
            targetsResponse
        ] = await Promise.all([
            productService.getSizes(),
            productService.getColors(),
            productService.getBrands(),
            productService.getCategories(),
            productService.getMaterials(),
            productService.getTargets()
        ]);

        // Tạo mapping objects
        const mappingData = {
            sizes: {},
            colors: {},
            brands: {},
            categories: {},
            materials: {},
            targets: {}
        };

        // Process sizes
        if (sizesResponse?.data) {
            sizesResponse.data.forEach(size => {
                mappingData.sizes[size.id] = size.name;
            });
        }

        // Process colors
        if (colorsResponse?.data) {
            colorsResponse.data.forEach(color => {
                mappingData.colors[color.id] = color.name;
            });
        }

        // Process brands
        if (brandsResponse?.data) {
            brandsResponse.data.forEach(brand => {
                mappingData.brands[brand.id] = brand.name;
            });
        }

        // Process categories
        if (categoriesResponse?.data) {
            categoriesResponse.data.forEach(category => {
                mappingData.categories[category.id] = category.name;
            });
        }

        // Process materials
        if (materialsResponse?.data) {
            materialsResponse.data.forEach(material => {
                mappingData.materials[material.id] = material.name;
            });
        }

        // Process targets
        if (targetsResponse?.data) {
            targetsResponse.data.forEach(target => {
                mappingData.targets[target.id] = target.name;
            });
        }

        // Cache data
        cachedMappingData = mappingData;
        cacheExpiry = now + CACHE_DURATION;

        // console.log('✅ Mapping data fetched and cached:', mappingData);
        return mappingData;

    } catch (error) {
        console.error('❌ Error fetching mapping data:', error);

        // Trả về cache cũ nếu có lỗi
        if (cachedMappingData) {
            console.log('⚠️ Using cached data due to API error');
            return cachedMappingData;
        }

        // Fallback data nếu không có cache
        return {
            sizes: {},
            colors: {},
            brands: {},
            categories: {},
            materials: {},
            targets: {}
        };
    }
};

/**
 * Helper function to get name from ID for any category
 * @param {string|number} id - The ID to look up
 * @param {string} type - The type of lookup (sizes, colors, brands, categories, materials, targets)
 * @returns {Promise<string>} - The name or a fallback string
 */
export const getNameFromId = async (id, type) => {
    if (!id || !type) return 'N/A';

    try {
        const mappingData = await getMappingData();
        const typeMap = mappingData[type];

        if (!typeMap) return 'N/A';

        return typeMap[id] || `${type.slice(0, -1)} ${id}`;
    } catch (error) {
        console.error(`Error getting name for ${type} ID ${id}:`, error);
        return `${type.slice(0, -1)} ${id}`;
    }
};

/**
 * Helper function specifically for ProductRow to get display names
 * @param {Object} product - The product object with IDs
 * @returns {Promise<Object>} - Object with display names
 */
export const getProductDisplayNames = async (product) => {
    if (!product) return {};

    try {
        const mappingData = await getMappingData();

        return {
            brand_name: mappingData.brands[product.brand_id] || `Brand ${product.brand_id}`,
            category_name: mappingData.categories[product.category_id] || `Category ${product.category_id}`,
            material_name: mappingData.materials[product.material_id] || `Material ${product.material_id}`,
            size_name: mappingData.sizes[product.size_id] || `Size ${product.size_id}`,
            color_name: mappingData.colors[product.color_id] || `Color ${product.color_id}`,
            target_name: mappingData.targets[product.target_id] || `Target ${product.target_id}`
        };
    } catch (error) {
        console.error('Error getting product display names:', error);
        return {
            brand_name: `Brand ${product.brand_id || 'N/A'}`,
            category_name: `Category ${product.category_id || 'N/A'}`,
            material_name: `Material ${product.material_id || 'N/A'}`,
            size_name: `Size ${product.size_id || 'N/A'}`,
            color_name: `Color ${product.color_id || 'N/A'}`,
            target_name: `Target ${product.target_id || 'N/A'}`
        };
    }
};

/**
 * Extracts unique available options from the products data
 * @param {Array} products - The full products array
 * @returns {Object} - Object containing unique options for dropdowns
 */
export const extractAvailableOptions = async (products) => {
    if (!products || !products.length) {
        return {
            categories: [],
            brands: [],
            materials: [],
            targets: [],
            sizes: [],
            colors: []
        };
    }

    try {
        const mappingData = await getMappingData();

        // Extract unique values for each option type
        const categories = new Map();
        const brands = new Map();
        const materials = new Map();
        const targets = new Map();
        const sizes = new Map();
        const colors = new Map();

        products.forEach(product => {
            // Add category if available
            if (product.category_id) {
                categories.set(product.category_id, {
                    id: product.category_id,
                    name: mappingData.categories[product.category_id] || `Category ${product.category_id}`
                });
            }

            // Add brand if available
            if (product.brand_id) {
                brands.set(product.brand_id, {
                    id: product.brand_id,
                    name: mappingData.brands[product.brand_id] || `Brand ${product.brand_id}`
                });
            }

            // Add material if available
            if (product.material_id) {
                materials.set(product.material_id, {
                    id: product.material_id,
                    name: mappingData.materials[product.material_id] || `Material ${product.material_id}`
                });
            }

            // Add target if available
            if (product.target_id) {
                targets.set(product.target_id, {
                    id: product.target_id,
                    name: mappingData.targets[product.target_id] || `Target ${product.target_id}`
                });
            }

            // Add size if available
            if (product.size_id) {
                sizes.set(product.size_id, {
                    id: product.size_id,
                    name: mappingData.sizes[product.size_id] || `Size ${product.size_id}`
                });
            }

            // Add color if available
            if (product.color_id) {
                colors.set(product.color_id, {
                    id: product.color_id,
                    name: mappingData.colors[product.color_id] || `Color ${product.color_id}`,
                    value: product.color_code || '#CCCCCC'
                });
            }
        });

        return {
            categories: Array.from(categories.values()),
            brands: Array.from(brands.values()),
            materials: Array.from(materials.values()),
            targets: Array.from(targets.values()),
            sizes: Array.from(sizes.values()),
            colors: Array.from(colors.values())
        };
    } catch (error) {
        console.error('Error extracting available options:', error);
        return {
            categories: [],
            brands: [],
            materials: [],
            targets: [],
            sizes: [],
            colors: []
        };
    }
};

/**
 * Clear cache (useful for testing or when data changes)
 */
export const clearMappingCache = () => {
    cachedMappingData = null;
    cacheExpiry = 0;
    console.log('🗑️ Mapping cache cleared');
};