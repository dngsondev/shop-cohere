import cartService from '../services/cartService';

export async function refreshCartQuantity(customerId) {
    try {
        const response = await cartService.getQuantity(customerId);
        if (response && response.data && response.data[0]) {
            const newQuantity = response.data[0].total_quantity;
            // console.log("Updated cart quantity:", newQuantity);

            localStorage.setItem('cartQuantity', newQuantity);
            window.dispatchEvent(new Event('storage'));
        }
    } catch (error) {
        console.error("Error updating cart count:", error);
    }
}