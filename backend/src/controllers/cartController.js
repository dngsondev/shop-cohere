import {
    addToCart,
    getCart,
    getQuantity, // ✨ Thêm import này
    getCartWithStockCheck,
    adjustCartQuantityToStock,
    removeOutOfStockItems,
    deleteCart,
    updateCart,
    removeItemsFromCart,
    clearCartByCustomerId,
    verifyCartOwnership,
    getCartItemsByIds,
    cleanupInvalidCartItems
} from "../models/cartModels.js";

export const addToCartController = async (req, res) => {
    const { customerId, productId, variantId, quantity } = req.body;
    // console.log("Adding to cart:", { customerId, productId, variantId, quantity });

    try {
        const result = await addToCart(customerId, productId, variantId, quantity);
        res.status(200).json({ message: "Product added to cart successfully", result });
    } catch (error) {
        res.status(500).json({ message: "Error adding product to cart", error });
    }
}

// Cập nhật controller getCart để kiểm tra tồn kho
export const getCartController = async (req, res) => {
    const { customerId } = req.params;
    try {
        const cartItems = await getCartWithStockCheck(customerId); // ✨ Sử dụng hàm mới

        // Phân loại items theo trạng thái tồn kho
        const availableItems = cartItems.filter(item => item.stock_status === 'available');
        const outOfStockItems = cartItems.filter(item => item.stock_status === 'out_of_stock');
        const insufficientStockItems = cartItems.filter(item => item.stock_status === 'insufficient_stock');

        res.status(200).json({
            items: cartItems,
            summary: {
                total_items: cartItems.length,
                available_items: availableItems.length,
                out_of_stock_items: outOfStockItems.length,
                insufficient_stock_items: insufficientStockItems.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching cart items", error });
    }
}

export const getQuantityController = async (req, res) => {
    const { customerId } = req.params;
    try {
        const quantity = await getQuantity(customerId);
        // console.log("Quantity:", quantity);
        res.status(200).json(quantity);
    } catch (error) {
        res.status(500).json({ message: "Error fetching cart quantity", error });
    }
}

export const deleteCartController = async (req, res) => {
    const { cartId } = req.params;
    try {
        await deleteCart(cartId);
        res.status(200).json({ message: "Product removed from cart successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error removing product from cart", error });
    }
}

export const updateCartController = async (req, res) => {
    const { cartId, quantity } = req.body;
    try {
        await updateCart(cartId, quantity);
        res.status(200).json({ message: "Cart updated successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error updating cart", error });
    }
}

// Xóa các sản phẩm cụ thể khỏi giỏ hàng
export const removeItemsFromCartController = async (req, res) => {
    try {
        const { customerId, cartIds } = req.body;

        console.log('Removing items from cart:', { customerId, cartIds });

        if (!customerId || !cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID and cart item IDs are required'
            });
        }

        // Verify ownership trước khi xóa (security check)
        const ownership = await verifyCartOwnership(customerId, cartIds);
        if (!ownership.valid) {
            console.warn(`Security violation: Customer ${customerId} attempted to remove items not owned by them:`, ownership.invalidCartIds);
            return res.status(403).json({
                success: false,
                message: 'You can only remove your own cart items',
                invalidItems: ownership.invalidCartIds
            });
        }

        // Lấy thông tin sản phẩm trước khi xóa (for logging)
        const itemsToRemove = await getCartItemsByIds(cartIds);
        console.log('Items being removed:', itemsToRemove.map(item => ({
            cart_id: item.cart_id,
            product_name: item.product_name,
            quantity: item.quantity
        })));

        // Thực hiện xóa
        const result = await removeItemsFromCart(customerId, cartIds);

        res.json({
            success: true,
            message: `Successfully removed ${result.removedItems} items from cart`,
            removedItems: result.removedItems,
            removedProducts: itemsToRemove.map(item => ({
                product_name: item.product_name,
                quantity: item.quantity,
                size: item.size_name,
                color: item.color_name
            }))
        });

    } catch (error) {
        console.error('Error in removeItemsFromCartController:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Xóa tất cả sản phẩm trong giỏ hàng của customer
export const clearCartController = async (req, res) => {
    try {
        const { customerId } = req.params;

        console.log('Clearing cart for customer:', customerId);

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        // Lấy thông tin giỏ hàng trước khi xóa (for logging)
        const currentCartItems = await getCart(customerId);
        console.log(`Customer ${customerId} had ${currentCartItems.length} items in cart before clearing`);

        // Thực hiện xóa tất cả
        const result = await clearCartByCustomerId(customerId);

        res.json({
            success: true,
            message: `Successfully cleared cart`,
            removedItems: result.removedItems,
            previousItemCount: currentCartItems.length
        });

    } catch (error) {
        console.error('Error in clearCartController:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// Cleanup invalid cart items (utility endpoint)
export const cleanupCartController = async (req, res) => {
    try {
        const { customerId } = req.params;

        console.log('Cleaning up invalid cart items for customer:', customerId);

        if (!customerId) {
            return res.status(400).json({
                success: false,
                message: 'Customer ID is required'
            });
        }

        const result = await cleanupInvalidCartItems(customerId);

        res.json({
            success: true,
            message: `Cleaned up ${result.removedItems} invalid cart items`,
            removedItems: result.removedItems
        });

    } catch (error) {
        console.error('Error in cleanupCartController:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

// ✨ Controller mới để tự động điều chỉnh giỏ hàng
export const adjustCartController = async (req, res) => {
    const { customerId } = req.params;
    const { action } = req.body; // 'adjust_quantity' hoặc 'remove_out_of_stock'

    try {
        if (action === 'remove_out_of_stock') {
            const result = await removeOutOfStockItems(customerId);
            res.json({
                success: true,
                message: `Đã xóa ${result.removedItems} sản phẩm hết hàng khỏi giỏ hàng`,
                removedItems: result.removedItems
            });
        } else if (action === 'adjust_quantity') {
            const cartItems = await getCartWithStockCheck(customerId);
            const adjustments = [];

            for (const item of cartItems) {
                if (item.stock_status === 'insufficient_stock') {
                    await adjustCartQuantityToStock(item.cart_id, item.stock_quantity);
                    adjustments.push({
                        cart_id: item.cart_id,
                        product_name: item.product_name,
                        old_quantity: item.quantity,
                        new_quantity: item.stock_quantity
                    });
                }
            }

            res.json({
                success: true,
                message: `Đã điều chỉnh ${adjustments.length} sản phẩm theo tồn kho`,
                adjustments
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Invalid action'
            });
        }
    } catch (error) {
        console.error('Error adjusting cart:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};