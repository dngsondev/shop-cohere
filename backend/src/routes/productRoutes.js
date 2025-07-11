import express from 'express';
import { productImageUpload, reviewMediaUpload } from '../config/multerConfig.js';
import {
  getAllProductsController,
  getAllInfoProductsController,
  getProductController,
  getProductByVariantIdController,
  checkVoucherController,
  getTopProductsController,
  getAllSizes,
  getAllColors,
  getAllBrands,
  getAllCategories,
  getAllMaterials,
  getAllTargets,
  createProductController,
  updateProductController,
  getProductImagesController,
  deleteProductController,
  getProductsByCategoryController,
  getProductReviewsController,
  createProductReviewsController,
  deleteReviewController,
  getAllReviewsController,
  replyReviewController,
  searchProductController,
  suggestProductController,
  getProductsForYouController
} from '../controllers/productController.js';
import {
  getBanners,
  getProductsByCollection,
  createCollectionController,
  updateBannerController,
  deleteBannerController
} from '../controllers/bannerController.js';
import { memoryMonitor } from '../middleware/memoryMonitor.js';

const router = express.Router();

router.get('/banner', getBanners);
router.put('/banner/:id', updateBannerController);
router.delete('/banner/:id', deleteBannerController);
router.get('/banner/:collectionId', getProductsByCollection);
router.post('/collections', createCollectionController);

// Route tạo sản phẩm mới với memory monitoring
router.post('/create',
  memoryMonitor,
  productImageUpload.array('productImages', 20),
  createProductController
);

// Route cập nhật sản phẩm với memory monitoring
router.put('/:id',
  memoryMonitor,
  productImageUpload.array('productImages', 20),
  updateProductController
);

router.delete('/:id', deleteProductController);

// Các route GET - đặt các route cụ thể trước route có params
router.get('/:categoryId/related', getProductsByCategoryController);

router.get('/reviews', getAllReviewsController);
router.post('/reviews/:reviewId/reply', replyReviewController);
router.delete('/reviews/:reviewId', deleteReviewController);
router.get('/:id/reviews', getProductReviewsController);
router.post('/:id/createreviews', reviewMediaUpload.array('media', 5), createProductReviewsController);

router.get('/for-you', getProductsForYouController);
router.get('/suggest', suggestProductController);
router.get('/search', searchProductController);
router.get('/info', getAllInfoProductsController);
router.get('/:id/images', getProductImagesController); // ✨ Thêm route này
router.get('/variant/:variantId', getProductByVariantIdController);
router.get('/top', getTopProductsController);
router.get('/sizes', getAllSizes);
router.get('/colors', getAllColors);
router.get('/brands', getAllBrands);
router.get('/categories', getAllCategories);
router.get('/materials', getAllMaterials);
router.get('/targets', getAllTargets);
router.get('/voucher', checkVoucherController); // Bỏ /:productId vì không cần thiết
router.get('/:id', getProductController);
router.get('/', getAllProductsController);

export default router;