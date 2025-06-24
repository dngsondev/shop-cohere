/**
 * Helper functions for handling image paths
 */

/**
 * Generates a relative URL for the image
 * @param {string} imagePath - Full path or filename
 * @returns {string} Optimized relative URL
 */
export const getImageUrl = (imagePath) => {
    if (!imagePath) return '';

    // If it's already a relative URL, return as is
    if (imagePath.startsWith('/uploads/')) {
        return imagePath;
    }

    // If it's a full path, extract just the filename
    const filename = imagePath.split('/').pop();

    // Return the structured path
    return `/uploads/products/${filename}`;
};

/**
 * Create a structured image filename based on product and variant info
 * @param {number} productId - Product ID
 * @param {string} type - Image type (main, variant, etc)
 * @param {number} index - Index for multiple images
 * @param {string} ext - File extension
 * @returns {string} Structured filename
 */
export const createImageFilename = (productId, type = 'main', index = 0, ext = '.jpg') => {
    return `p${productId}_${type}_${index}${ext}`;
};