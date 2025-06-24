export const getAuthConfig = (req, res) => {
  try {
    // console.log("ENV vars for OAuth:", {
    //   googleId: process.env.GOOGLE_APP_ID
    // });
    
    res.json({
      googleClientId: process.env.GOOGLE_APP_ID
      // Xóa facebookAppId
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ message: 'Lỗi lấy cấu hình' });
  }
};