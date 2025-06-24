import * as mammoth from 'mammoth';

/**
 * Đọc nội dung từ file .docx và trả về text
 * @param {File} file - File .docx từ input
 * @returns {Promise<string>} - Nội dung file dưới dạng text
 */
export function getWordReader(file) {
    return new Promise((resolve, reject) => {
        if (file && file.name.endsWith(".docx")) {
            const reader = new FileReader();

            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;

                try {
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    resolve(result.value); // Trả về nội dung text
                } catch (error) {
                    console.error("Lỗi khi đọc file:", error);
                    reject(error);
                }
            };

            reader.readAsArrayBuffer(file);
        } else {
            reject("Vui lòng chọn file .docx");
        }
    });
}
