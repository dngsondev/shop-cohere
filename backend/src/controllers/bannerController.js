import { getAllBanners, getProductsByCollectionId } from '../models/bannerModels.js';

export const getBanners = async (req, res) => {
    try {
        const banners = await getAllBanners();
        res.json(banners);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy danh sách banner', error });
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