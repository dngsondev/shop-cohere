import { useState, useEffect } from 'react';
import { FiX, FiFilter } from 'react-icons/fi';
import productService from '../../../services/productService';
import styles from './ProductFilters.module.scss';

function ProductFilters({ isVisible, products, onFilter, originalProducts }) {
    const [filters, setFilters] = useState({
        brand: '',
        category: '',
        material: '',
        target: '',
        priceRange: '',
        status: '',
        discount: ''
    });

    const [filterOptions, setFilterOptions] = useState({
        brands: [],
        categories: [],
        materials: [],
        targets: []
    });

    useEffect(() => {
        if (isVisible) {
            fetchFilterOptions();
        }
    }, [isVisible]);

    useEffect(() => {
        applyFilters();
    }, [filters, originalProducts]);

    const fetchFilterOptions = async () => {
        try {
            const [brands, categories, materials, targets] = await Promise.all([
                productService.getBrands(),
                productService.getCategories(),
                productService.getMaterials(),
                productService.getTargets()
            ]);

            setFilterOptions({
                brands: brands.data || [],
                categories: categories.data || [],
                materials: materials.data || [],
                targets: targets.data || []
            });
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const applyFilters = () => {
        let filtered = [...originalProducts];

        // Brand filter
        if (filters.brand) {
            filtered = filtered.filter(p => p.brand_id == filters.brand);
        }

        // Category filter
        if (filters.category) {
            filtered = filtered.filter(p => p.category_id == filters.category);
        }

        // Material filter
        if (filters.material) {
            filtered = filtered.filter(p => p.material_id == filters.material);
        }

        // Target filter
        if (filters.target) {
            filtered = filtered.filter(p => p.target_id == filters.target);
        }

        // Price range filter
        if (filters.priceRange) {
            const [min, max] = filters.priceRange.split('-').map(Number);
            filtered = filtered.filter(p => {
                const price = p.price * (1 - p.discount / 100);
                return price >= min && (max ? price <= max : true);
            });
        }

        // Status filter
        if (filters.status) {
            switch (filters.status) {
                case 'in-stock':
                    filtered = filtered.filter(p => p.quantity > 0);
                    break;
                case 'out-of-stock':
                    filtered = filtered.filter(p => p.quantity === 0);
                    break;
                case 'low-stock':
                    filtered = filtered.filter(p => p.quantity > 0 && p.quantity <= 10);
                    break;
            }
        }

        // Discount filter
        if (filters.discount) {
            switch (filters.discount) {
                case 'on-sale':
                    filtered = filtered.filter(p => p.discount > 0);
                    break;
                case 'no-discount':
                    filtered = filtered.filter(p => p.discount === 0);
                    break;
            }
        }

        onFilter(filtered);
    };

    const resetFilters = () => {
        setFilters({
            brand: '',
            category: '',
            material: '',
            target: '',
            priceRange: '',
            status: '',
            discount: ''
        });
    };

    const hasActiveFilters = Object.values(filters).some(filter => filter !== '');

    if (!isVisible) return null;

    return (
        <div className={styles.productFilters}>
            <div className={styles.productFilters__header}>
                <div className={styles.productFilters__title}>
                    <FiFilter />
                    <span>Bộ lọc sản phẩm</span>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={resetFilters}
                        className={styles.productFilters__reset}
                    >
                        <FiX />
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            <div className={styles.productFilters__content}>
                <div className={styles.productFilters__grid}>
                    {/* Brand Filter */}
                    <div className={styles.productFilters__group}>
                        <label className={styles.productFilters__label}>Thương hiệu</label>
                        <select
                            value={filters.brand}
                            onChange={(e) => setFilters({ ...filters, brand: e.target.value })}
                            className={styles.productFilters__select}
                        >
                            <option value="">Tất cả thương hiệu</option>
                            {filterOptions.brands.map(brand => (
                                <option key={brand.id} value={brand.id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div className={styles.productFilters__group}>
                        <label className={styles.productFilters__label}>Danh mục</label>
                        <select
                            value={filters.category}
                            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                            className={styles.productFilters__select}
                        >
                            <option value="">Tất cả danh mục</option>
                            {filterOptions.categories.map(category => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Material Filter */}
                    <div className={styles.productFilters__group}>
                        <label className={styles.productFilters__label}>Chất liệu</label>
                        <select
                            value={filters.material}
                            onChange={(e) => setFilters({ ...filters, material: e.target.value })}
                            className={styles.productFilters__select}
                        >
                            <option value="">Tất cả chất liệu</option>
                            {filterOptions.materials.map(material => (
                                <option key={material.id} value={material.id}>
                                    {material.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Target Filter */}
                    <div className={styles.productFilters__group}>
                        <label className={styles.productFilters__label}>Đối tượng</label>
                        <select
                            value={filters.target}
                            onChange={(e) => setFilters({ ...filters, target: e.target.value })}
                            className={styles.productFilters__select}
                        >
                            <option value="">Tất cả đối tượng</option>
                            {filterOptions.targets.map(target => (
                                <option key={target.id} value={target.id}>
                                    {target.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Price Range Filter */}
                    <div className={styles.productFilters__group}>
                        <label className={styles.productFilters__label}>Khoảng giá</label>
                        <select
                            value={filters.priceRange}
                            onChange={(e) => setFilters({ ...filters, priceRange: e.target.value })}
                            className={styles.productFilters__select}
                        >
                            <option value="">Tất cả giá</option>
                            <option value="0-100000">Dưới 100k</option>
                            <option value="100000-500000">100k - 500k</option>
                            <option value="500000-1000000">500k - 1M</option>
                            <option value="1000000-2000000">1M - 2M</option>
                            <option value="2000000">Trên 2M</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className={styles.productFilters__group}>
                        <label className={styles.productFilters__label}>Trạng thái</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className={styles.productFilters__select}
                        >
                            <option value="">Tất cả trạng thái</option>
                            <option value="in-stock">Còn hàng</option>
                            <option value="low-stock">Sắp hết hàng</option>
                            <option value="out-of-stock">Hết hàng</option>
                        </select>
                    </div>

                    {/* Discount Filter */}
                    <div className={styles.productFilters__group}>
                        <label className={styles.productFilters__label}>Khuyến mãi</label>
                        <select
                            value={filters.discount}
                            onChange={(e) => setFilters({ ...filters, discount: e.target.value })}
                            className={styles.productFilters__select}
                        >
                            <option value="">Tất cả</option>
                            <option value="on-sale">Đang giảm giá</option>
                            <option value="no-discount">Không giảm giá</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductFilters;