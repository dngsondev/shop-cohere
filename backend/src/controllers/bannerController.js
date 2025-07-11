import {
    getAllBanners,
    getProductsByCollectionId,
    createCollection, addProductToCollection, updateBanner,
    deleteBanner,
    deleteAllProductsInCollection
} from '../models/bannerModels.js';

export const getBanners = async (req, res) => {
    try {
        const collections = await getAllBanners();
        const collectionsWithProducts = await Promise.all(
            collections.map(async (col) => {
                const { products } = await getProductsByCollectionId(col.collection_id);
                return {
                    ...col,
                    products: products.map(p => ({
                        product_id: p.product_id,
                        name: p.name || p.product_name || ''
                    })),
                    product_ids: products.map(p => p.product_id) // Thêm dòng này
                };
            })
        );
        res.json(collectionsWithProducts);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách bộ sưu tập', error });
    }
};

export const getProductsByCollection = async (req, res) => {
    const { collectionId } = req.params;
    try {
        const result = await getProductsByCollectionId(collectionId);
        res.json(result); // result: { collection_name, products }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách sản phẩm trong collection', error });
    }
};

export const createCollectionController = async (req, res) => {
    try {
        const { name, description, image_url, product_ids } = req.body;
        console.log('Received data:', req.body);

        if (!name || !image_url) {
            return res.status(400).json({ success: false, message: 'Thiếu tên hoặc ảnh bộ sưu tập' });
        }
        const result = await createCollection({
            collection_name: name,
            description,
            banner_url: image_url
        });
        const collection_id = result.insertId;
        // Thêm sản phẩm vào collection_products nếu có
        if (Array.isArray(product_ids) && product_ids.length > 0) {
            for (const pid of product_ids) {
                await addProductToCollection(collection_id, pid);
            }
        }
        res.status(201).json({ success: true, collection_id });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi tạo bộ sưu tập', error });
    }
};

export const updateBannerController = async (req, res) => {
    try {
        const { id } = req.params;
        const { collection_name, description, banner_url, product_ids } = req.body;
        await updateBanner(id, { collection_name, description, banner_url });

        // Xử lý cập nhật sản phẩm trong collection_products
        if (Array.isArray(product_ids)) {
            // Xóa hết sản phẩm cũ
            await deleteAllProductsInCollection(id);
            // Thêm lại sản phẩm mới
            for (const pid of product_ids) {
                await addProductToCollection(id, pid);
            }
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi cập nhật bộ sưu tập', error });
    }
};

export const deleteBannerController = async (req, res) => {
    try {
        const { id } = req.params;
        await deleteBanner(id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa bộ sưu tập', error });
    }
};