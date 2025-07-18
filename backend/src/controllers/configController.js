export const getAuthConfig = (req, res) => {
  try {
    res.json({
      googleClientId: process.env.GOOGLE_APP_ID
    });
  } catch (error) {
    console.error('Config fetch error:', error);
    res.status(500).json({ message: 'Lỗi lấy cấu hình' });
  }
};