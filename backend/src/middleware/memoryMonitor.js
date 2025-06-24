export const memoryMonitor = (req, res, next) => {
    const used = process.memoryUsage();
    
    // Log memory usage for large requests
    if (req.files && req.files.length > 10) {
        console.log('🧠 Memory Usage:', {
            files: req.files.length,
            rss: Math.round(used.rss / 1024 / 1024 * 100) / 100 + ' MB',
            heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100 + ' MB',
            heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100 + ' MB'
        });
        
        // Warning if memory usage is too high
        if (used.heapUsed > 500 * 1024 * 1024) { // 500MB
            console.warn('⚠️ High memory usage detected!');
        }
    }
    
    next();
};