import React, { forwardRef, useRef, useImperativeHandle, useState, useEffect, useCallback, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './quill-custom.css';
import { v4 as uuidv4 } from 'uuid';
import { quillModules, quillFormats } from '../../utils/quillUtils';

const QuillEditor = forwardRef(({
    value,
    onChange,
    placeholder,
    style,
    className,
    readOnly = false,
    height = '200px',
    maxLength = 5000,
    showCharCount = true,
    onImageUpload,
    ...rest
}, ref) => {
    // References
    const quillRef = useRef(null);

    // Session ID for tracking
    const sessionId = useMemo(() => uuidv4(), []);

    // Internal state
    const [internalValue, setInternalValue] = useState(value || '');
    const [charCount, setCharCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Enhanced modules with image handling
    const enhancedModules = useMemo(() => ({
        ...quillModules,
        toolbar: {
            ...quillModules.toolbar,
            handlers: {
                image: () => {
                    console.log('🖼️ Image button clicked');

                    const input = document.createElement('input');
                    input.setAttribute('type', 'file');
                    input.setAttribute('accept', 'image/*');
                    input.style.display = 'none';

                    // Add to DOM temporarily
                    document.body.appendChild(input);

                    input.onchange = async () => {
                        console.log('📁 File selected:', input.files[0]);
                        const file = input.files[0];

                        if (file) {
                            setIsLoading(true);
                            try {
                                // Check if onImageUpload is provided
                                if (onImageUpload) {
                                    console.log('🔄 Uploading image...');
                                    const imageUrl = await onImageUpload(file);
                                    console.log('✅ Image uploaded:', imageUrl);

                                    const editor = quillRef.current?.getEditor();
                                    if (editor) {
                                        const range = editor.getSelection() || { index: 0 };
                                        editor.insertEmbed(range.index, 'image', imageUrl);
                                        editor.setSelection(range.index + 1);
                                    }
                                } else {
                                    // Fallback: convert to base64 if no upload handler
                                    console.log('📸 Converting to base64...');
                                    const reader = new FileReader();
                                    reader.onload = (e) => {
                                        const editor = quillRef.current?.getEditor();
                                        if (editor) {
                                            const range = editor.getSelection() || { index: 0 };
                                            editor.insertEmbed(range.index, 'image', e.target.result);
                                            editor.setSelection(range.index + 1);
                                        }
                                    };
                                    reader.readAsDataURL(file);
                                }
                            } catch (error) {
                                console.error('❌ Image upload failed:', error);
                                alert('Không thể tải ảnh lên. Vui lòng thử lại.');
                            } finally {
                                setIsLoading(false);
                                // Clean up
                                document.body.removeChild(input);
                            }
                        } else {
                            document.body.removeChild(input);
                        }
                    };

                    // Trigger file selection
                    input.click();
                }
            }
        }
    }), [quillModules, onImageUpload]);

    // Sync with external value
    useEffect(() => {
        if (value !== undefined && value !== internalValue) {
            setInternalValue(value);
            updateCharCount(value);
        }
    }, [value]);

    // Update character count
    const updateCharCount = useCallback((content) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const textContent = tempDiv.textContent || tempDiv.innerText || '';
        setCharCount(textContent.length);
    }, []);

    // Expose editor and session ID to parent
    useImperativeHandle(ref, () => ({
        getSessionId: () => sessionId,
        getEditor: () => quillRef.current?.getEditor(),
        getQuillInstance: () => quillRef.current,
        getValue: () => internalValue,
        setValue: (newValue) => {
            setInternalValue(newValue);
            updateCharCount(newValue);
        },
        focus: () => quillRef.current?.focus(),
        blur: () => quillRef.current?.blur(),
        clear: () => {
            setInternalValue('');
            setCharCount(0);
            if (onChange) onChange('');
        }
    }), [sessionId, internalValue, onChange]);

    // Handle content changes with validation
    const handleChange = useCallback((content) => {
        // Check max length
        if (maxLength && charCount > maxLength) {
            return;
        }

        setInternalValue(content);
        updateCharCount(content);

        if (typeof onChange === 'function') {
            onChange(content);
        }
    }, [onChange, maxLength, charCount, updateCharCount]);

    // Debug log
    useEffect(() => {
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            console.log("🎯 QuillEditor mounted with editor:", {
                hasEditor: !!editor,
                hasGetSelection: typeof editor.getSelection === 'function',
                hasInsertEmbed: typeof editor.insertEmbed === 'function',
                editorRoot: !!editor.root,
                sessionId
            });
        }
    }, [sessionId]);

    // Custom style with height
    const customStyle = useMemo(() => ({
        height,
        ...style
    }), [height, style]);

    return (
        <div className={`quill-editor-container relative ${className || ''}`}>
            {isLoading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
            )}

            <ReactQuill
                ref={quillRef}
                theme="snow"
                value={internalValue}
                onChange={handleChange}
                readOnly={readOnly}
                placeholder={placeholder || "Nhập mô tả sản phẩm..."}
                modules={enhancedModules}
                formats={quillFormats}
                style={customStyle}
                {...rest}
            />

            {showCharCount && (
                <div className="flex justify-between items-center mt-2 text-sm text-gray-500">
                    <span>
                        {charCount}{maxLength ? `/${maxLength}` : ''} ký tự
                    </span>
                    {maxLength && charCount > maxLength * 0.9 && (
                        <span className={`${charCount > maxLength ? 'text-red-500' : 'text-yellow-500'}`}>
                            {charCount > maxLength ? 'Vượt quá giới hạn!' : 'Gần đạt giới hạn'}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
});

QuillEditor.displayName = 'QuillEditor';

export default QuillEditor;
