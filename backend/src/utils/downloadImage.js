import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function downloadImageToAvatars(url, userId) {
    try {
        const ext = url.split('.').pop().split('?')[0].split('#')[0] || 'jpg';
        const fileName = `avatar-${userId}-${Date.now()}.${ext}`;
        const avatarDir = path.join(__dirname, '../../uploads/avatars');
        if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
        const filePath = path.join(avatarDir, fileName);

        const response = await axios.get(url, { responseType: 'arraybuffer' });
        fs.writeFileSync(filePath, response.data);

        return `uploads/avatars/${fileName}`;
    } catch (error) {
        console.error('❌ Error downloading Google avatar:', error);
        return null;
    }
}