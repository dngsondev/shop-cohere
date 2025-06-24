import React, { useState } from 'react';
import * as mammoth from 'mammoth';

function WordReader() {
    const [docContent, setDocContent] = useState('');

    const handleFileChange = async (event) => {
        const file = event.target.files[0];

        if (file && file.name.endsWith(".docx")) {
            const reader = new FileReader();

            reader.onload = async (e) => {
                const arrayBuffer = e.target.result;

                try {
                    const result = await mammoth.extractRawText({ arrayBuffer });
                    setDocContent(result.value); // result.value là toàn bộ text
                } catch (error) {
                    console.error("Lỗi khi đọc file:", error);
                }
            };

            reader.readAsArrayBuffer(file);
        } else {
            alert("Vui lòng chọn file .docx");
        }
    };

    return (
        <div>
            <input type="file" onChange={handleFileChange} accept=".docx" />
            <h3>Nội dung Word trích xuất:</h3>
            <pre>{docContent}</pre>
        </div>
    );
}

export default WordReader;
