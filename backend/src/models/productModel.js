import connection from '../config/db.js';

/**
 * Phân loại các hình ảnh đã tải lên để thêm vào các bảng tương ứng
 * @param {Array} uploadedImageUrls - Mảng chứa các URL ảnh đã tải lên
 * @returns {Object} - Đối tượng chứa các URL ảnh đã được phân loại
 */
function categorizeImages(uploadedImageUrls) {
  // Khởi tạo các mảng để lưu các loại hình ảnh
  const categorizedImages = {
    descriptionImages: [], // Ảnh trong phần mô tả
    productImages: [],     // Ảnh chung sản phẩm
    variantImages: []      // Ảnh của biến thể sản phẩm
  };

  if (!uploadedImageUrls || uploadedImageUrls.length === 0) {
    return categorizedImages;
  }

  // Lặp qua tất cả các URL ảnh
  for (const imageUrl of uploadedImageUrls) {
    // Kiểm tra nếu là ảnh mô tả (có chứa "desc_img" trong URL)
    if (imageUrl.includes('description')) {
      continue; // Bỏ qua ảnh mô tả, không thêm vào mảng
    }
    // Kiểm tra nếu là ảnh của biến thể (có chứa "variant" trong URL)
    else if (imageUrl.includes('variant')) {
      categorizedImages.variantImages.push(imageUrl);
    }
    // Nếu không thuộc 2 loại trên, coi là ảnh chung sản phẩm
    else {
      categorizedImages.productImages.push(imageUrl);
    }
  }

  return categorizedImages;
}

// Lấy tất cả sản phẩm
export const getAllProducts = () => {
  return new Promise((resolve, reject) => {
    const query = `
                  SELECT 
                      p.product_id, 
                      p.product_name, 
                      p.description, 
                      p.discount,
                      p.created_at,
                      ROUND(AVG(r.rating), 1) AS rating,
                      MIN(pv.price) AS price,
                      GROUP_CONCAT(DISTINCT c.color_name ORDER BY c.color_name SEPARATOR ', ') AS colors,
                      GROUP_CONCAT(DISTINCT s.size_name ORDER BY s.size_name SEPARATOR ', ') AS sizes,
                      GROUP_CONCAT(DISTINCT m.material_name ORDER BY m.material_name SEPARATOR ', ') AS materials,
                      GROUP_CONCAT(DISTINCT b.brand_name ORDER BY b.brand_name SEPARATOR ', ') AS brands,
                      GROUP_CONCAT(DISTINCT cat.category_name ORDER BY cat.category_name SEPARATOR ', ') AS categories,
                      GROUP_CONCAT(DISTINCT cat.category_id ORDER BY cat.category_id SEPARATOR ', ') AS categoryId,
                      MIN(pi.product_image_url) AS product_image,
                      COALESCE(sold_table.sold, 0) AS sold
                  FROM products p
                  LEFT JOIN product_variants pv ON p.product_id = pv.product_id 
                  LEFT JOIN colors c ON pv.color_id = c.color_id 
                  LEFT JOIN sizes s ON pv.size_id = s.size_id 
                  LEFT JOIN materials m ON pv.material_id = m.material_id 
                  LEFT JOIN brands b ON pv.brand_id = b.brand_id 
                  LEFT JOIN categories cat ON pv.category_id = cat.category_id 
                  LEFT JOIN product_images pi ON p.product_id = pi.product_id
                  LEFT JOIN reviews r ON r.product_id = p.product_id
                  LEFT JOIN (
                      SELECT product_id, SUM(quantity) AS sold
                      FROM order_details
                      GROUP BY product_id
                  ) AS sold_table ON sold_table.product_id = p.product_id
                  GROUP BY p.product_id;
    `;

    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getAllInfoProducts = () => {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT 
            p.product_id,
            p.product_name,
            p.description,
            p.discount,
            MIN(pi.product_image_url) AS product_image_url, -- lấy 1 ảnh duy nhất
            pv.variant_id,
            pv.price,
            pv.quantity,
            pv.image_url AS variant_image_url,
            c.color_id,
            c.color_code,
            s.size_id,
            m.material_id,
            b.brand_id,
            cat.category_id,
            t.target_id
        FROM 
            products p
        JOIN product_variants pv ON p.product_id = pv.product_id
        JOIN colors c ON pv.color_id = c.color_id
        JOIN sizes s ON pv.size_id = s.size_id
        JOIN materials m ON pv.material_id = m.material_id
        JOIN brands b ON pv.brand_id = b.brand_id
        JOIN categories cat ON pv.category_id = cat.category_id
        JOIN product_targets t ON pv.target_id = t.target_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        GROUP BY 
            p.product_id,
            pv.variant_id,
            p.product_name,
            p.description,
            p.discount,
            pv.price,
            pv.quantity,
            pv.image_url,
            c.color_id,
            c.color_code,
            s.size_id,
            m.material_id,
            b.brand_id,
            cat.category_id,
            t.target_id
        ORDER BY 
            p.product_id DESC, pv.variant_id;
    `;

    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getIdProducts = () => {
  return new Promise((resolve, reject) => {
    connection.query('SELECT product_id FROM products', (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Thêm hàm mới để tìm sản phẩm theo ID
export const getProductsByIdForCohere = (productIds) => {
  return new Promise((resolve, reject) => {
    if (!productIds || productIds.length === 0) {
      resolve([]);
      return;
    }

    // Tạo placeholders cho câu truy vấn SQL
    const placeholders = productIds.map(() => '?').join(',');

    // Truy vấn sản phẩm theo ID
    const query = `
      SELECT 
        p.product_id, 
        p.product_name, 
        p.discount,
        pv.price, 
        pi.product_image_url,
        AVG(r.rating) AS avg_rating
      FROM products p
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      WHERE p.product_id IN (${placeholders})
      GROUP BY p.product_id;
    `;

    connection.query(query, productIds, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

export const getInforToCohere = () => {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT 
        p.product_id, 
        p.product_name, 
        p.description, 
        p.discount, 
        (pv.price * (1 - p.discount / 100)) AS final_price, 
        pv.quantity, 
        pv.price, 
        c.color_name AS color, 
        b.brand_name AS brand, 
        cat.category_name AS category, 
        m.material_name AS material, 
        s.size_name AS size,
        AVG(r.rating) AS avg_rating
      FROM products p
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id
      LEFT JOIN colors c ON pv.color_id = c.color_id
      LEFT JOIN brands b ON pv.brand_id = b.brand_id
      LEFT JOIN categories cat ON pv.category_id = cat.category_id
      LEFT JOIN materials m ON pv.material_id = m.material_id
      LEFT JOIN sizes s ON pv.size_id = s.size_id
      LEFT JOIN reviews r ON p.product_id = r.product_id
      GROUP BY 
  p.product_id, 
  p.product_name, 
  p.description, 
  p.discount, 
  pv.quantity, 
  pv.price, 
  c.color_name, 
  b.brand_name, 
  cat.category_name, 
  m.material_name, 
  s.size_name`,
      (err, results) => {
        if (err) reject(err);
        else resolve(results);
      }
    );
  });
};

//Lays san pham theo id
export const getProductById = (id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT 
                    p.product_id,
                    p.product_name,
                    p.description,
                    p.discount,
                    (pv.price * (1 - p.discount / 100)) AS final_price,
                    pv.price,
                    
                    b.brand_id, 
                    b.brand_name AS brand,

                    cat.category_id, 
                    cat.category_name AS category,

                    GROUP_CONCAT(DISTINCT pi.product_image_url) AS product_images,

                    CONCAT('[', GROUP_CONCAT(
                        DISTINCT JSON_OBJECT(
                            'variant_id', pv.variant_id,
                            'color_id', c.color_id,
                            'color', c.color_code,
                            'color_name', c.color_name,
                            'size_id', s.size_id,
                            'size', s.size_name,
                            'material_id', m.material_id,
                            'material', m.material_name,
                            'image_url', pv.image_url,
                            "quantity", pv.quantity
                        )
                    ), ']') AS variants,
                    
                    ROUND(AVG(r.rating), 1) AS avg_rating,
                    COUNT(DISTINCT r.review_id) AS review_count

                FROM products p
                LEFT JOIN product_variants pv ON p.product_id = pv.product_id
                LEFT JOIN colors c ON pv.color_id = c.color_id
                LEFT JOIN sizes s ON pv.size_id = s.size_id
                LEFT JOIN materials m ON pv.material_id = m.material_id
                LEFT JOIN brands b ON pv.brand_id = b.brand_id
                LEFT JOIN categories cat ON pv.category_id = cat.category_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id
				        LEFT JOIN reviews r ON r.product_id = p.product_id
                WHERE p.product_id = ?
                GROUP BY 
                  p.product_id,
                  p.product_name,
                  p.description,
                  p.discount,
                  pv.price,
                  b.brand_id,
                  b.brand_name,
                  cat.category_id,
                  cat.category_name
                LIMIT 1;`
    connection.query(query, [id], (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || null);
    });
  });
};

export const getProductByVariantId = (variantId) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT 
					          p.product_id,
                    p.product_name,
                    (pv.price * (1 - p.discount / 100)) AS final_price,
                    pv.price,
                    pv.image_url,
                    c.color_name,
                    s.size_name,
                    cat.category_id,
                    pv.variant_id
                FROM products p
                LEFT JOIN product_variants pv ON p.product_id = pv.product_id
                LEFT JOIN colors c ON pv.color_id = c.color_id
                LEFT JOIN sizes s ON pv.size_id = s.size_id
                LEFT JOIN categories cat ON pv.category_id = cat.category_id
                LEFT JOIN product_images pi ON p.product_id = pi.product_id

                WHERE pv.variant_id = ?
                LIMIT 1;`
    connection.query(query, [variantId], (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || null);
    });
  });
}

export const getVoucher = (voucherCode) => {
  return new Promise((resolve, reject) => {
    // Sử dụng UPPER hoặc LOWER để không phân biệt chữ hoa/thường
    const query = `SELECT * FROM vouchers WHERE UPPER(voucher_code) = UPPER(?)`;
    connection.query(query, [voucherCode], (err, results) => {
      if (err) reject(err);
      else resolve(results[0] || null);
    });
  });
}

// Lấy 9 sản phẩm bán chạy nhất hoặc sản phẩm mới nhất nếu chưa đủ
export const getTopProducts = () => {
  return new Promise((resolve, reject) => {
    const query = `
      (SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.discount,
        MIN(pi.product_image_url) AS product_image_url,
        MIN(pv.price) AS price,
        SUM(od.quantity) AS total_sold,
        MAX(p.created_at) AS created_at,
        ROUND(AVG(r.rating), 1) AS rating
      FROM products p
      JOIN product_variants pv ON pv.product_id = p.product_id
      JOIN order_details od ON od.variant_id = pv.variant_id
      JOIN product_images pi ON pi.product_id = p.product_id
      LEFT JOIN reviews r ON r.product_id = p.product_id
      GROUP BY p.product_id, p.product_name, p.description, p.discount, p.created_at
      )
      UNION ALL
      (SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.discount,
        MIN(pi.product_image_url) AS product_image_url,
        MIN(pv.price) AS price,
        0 AS total_sold,
        p.created_at,
        ROUND(AVG(r.rating), 1) AS rating
      FROM products p
      LEFT JOIN product_images pi ON pi.product_id = p.product_id
      LEFT JOIN product_variants pv ON pv.product_id = p.product_id
      LEFT JOIN reviews r ON r.product_id = p.product_id
      LEFT JOIN (
        SELECT 
          p2.product_id
        FROM products p2
        JOIN product_variants pv2 ON pv2.product_id = p2.product_id
        JOIN order_details od2 ON od2.variant_id = pv2.variant_id
        GROUP BY p2.product_id
        ORDER BY SUM(od2.quantity) DESC
        LIMIT 9
      ) ts ON ts.product_id = p.product_id
      WHERE ts.product_id IS NULL
      GROUP BY p.product_id, p.product_name, p.description, p.discount, p.created_at
      )
      ORDER BY total_sold DESC, created_at DESC
      LIMIT 9;
    `;

    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Obtener todos los tamaños disponibles
export const getSizes = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        size_id as id, 
        size_name as name
      FROM sizes
      ORDER BY size_name
    `;

    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Obtener todos los colores disponibles
export const getColors = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        color_id as id, 
        color_name as name, 
        color_code as value
      FROM colors
      ORDER BY color_name
    `;

    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Get all brands
export const getBrands = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        brand_id as id, 
        brand_name as name
      FROM brands
      ORDER BY brand_name
    `;

    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Get all categories
export const getCategories = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        category_id as id, 
        category_name as name
      FROM categories
      ORDER BY category_name
    `;

    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Get all materials
export const getMaterials = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        material_id as id, 
        material_name as name
      FROM materials
      ORDER BY material_name
    `;

    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Get all targets
export const getTargets = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        target_id as id, 
        target_name as name
      FROM product_targets
      ORDER BY target_name
    `;

    connection.query(query, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });
};

// Sửa lại hàm createProduct để đảm bảo đúng cấu trúc
// ...existing code...
export const createProduct = (product) => {
  return new Promise((resolve, reject) => {
    const {
      product_name,
      brand_id,
      category_id,
      material_id,
      target_id,
      discount,
      description,
      variants,
      uploadedImageUrls
    } = product;

    // Phân loại hình ảnh thành các nhóm
    const categorizedImages = categorizeImages(uploadedImageUrls || []);
    console.log("📋 Categorized images:", {
      productImages: categorizedImages.productImages.length,
      variantImages: categorizedImages.variantImages.length
    });

    // Bắt đầu transaction
    connection.beginTransaction((err) => {
      if (err) {
        console.error("❌ Transaction error:", err);
        return reject(err);
      }

      // 1. Thêm sản phẩm cơ bản
      const insertProductSql = 'INSERT INTO products (product_name, description, discount) VALUES (?, ?, ?)';
      connection.query(insertProductSql, [product_name, description, discount], (err, result) => {
        if (err) {
          return connection.rollback(() => reject(err));
        }

        const productId = result.insertId;
        console.log(`✅ Created product with ID ${productId}`);

        // 2. Batch insert cho product images
        const addProductImages = () => {
          return new Promise((resolve, reject) => {
            if (categorizedImages.productImages && categorizedImages.productImages.length > 0) {
              const BATCH_SIZE = 10; // Insert 10 images mỗi lần
              let totalInserted = 0;

              const insertBatch = (startIndex) => {
                const endIndex = Math.min(startIndex + BATCH_SIZE, categorizedImages.productImages.length);
                const batchImages = categorizedImages.productImages.slice(startIndex, endIndex);

                if (batchImages.length === 0) {
                  console.log(`✅ All ${totalInserted} product images inserted`);
                  return resolve();
                }

                const imagesValues = batchImages.map(url => [productId, url]);
                const insertImagesSql = 'INSERT INTO product_images (product_id, product_image_url) VALUES ?';

                connection.query(insertImagesSql, [imagesValues], (err) => {
                  if (err) return reject(err);

                  totalInserted += batchImages.length;
                  console.log(`✅ Inserted batch: ${batchImages.length} images (${totalInserted}/${categorizedImages.productImages.length})`);

                  // Continue with next batch
                  setTimeout(() => insertBatch(endIndex), 50); // Small delay between batches
                });
              };

              insertBatch(0);
            } else {
              console.log('⚠️ No product images to add');
              resolve();
            }
          });
        };

        // 3. Batch insert cho variants
        const addVariants = () => {
          return new Promise((resolve, reject) => {
            if (variants && variants.length > 0) {
              const BATCH_SIZE = 5; // Insert 5 variants mỗi lần
              let totalInserted = 0;

              const insertVariantBatch = (startIndex) => {
                const endIndex = Math.min(startIndex + BATCH_SIZE, variants.length);
                const batchVariants = variants.slice(startIndex, endIndex);

                if (batchVariants.length === 0) {
                  console.log(`✅ All ${totalInserted} variants inserted`);
                  return resolve();
                }

                // Chuẩn bị data cho batch
                const variantValues = batchVariants.map(variant => [
                  productId,
                  parseInt(variant.color_id),
                  parseInt(variant.size_id),
                  parseInt(brand_id),
                  parseInt(category_id),
                  parseInt(material_id),
                  parseInt(target_id),
                  parseFloat(variant.price),
                  parseInt(variant.quantity),
                  variant.image_url || null
                ]);

                const insertVariantSql = `
                  INSERT INTO product_variants 
                  (product_id, color_id, size_id, brand_id, category_id, material_id, target_id, price, quantity, image_url) 
                  VALUES ?
                `;

                connection.query(insertVariantSql, [variantValues], (err, result) => {
                  if (err) {
                    console.error(`❌ Error inserting variant batch:`, err);
                    return reject(err);
                  }

                  totalInserted += batchVariants.length;
                  console.log(`✅ Inserted variant batch: ${batchVariants.length} variants (${totalInserted}/${variants.length})`);

                  // Continue with next batch
                  setTimeout(() => insertVariantBatch(endIndex), 50);
                });
              };

              insertVariantBatch(0);
            } else {
              console.log('⚠️ No variants to add');
              resolve();
            }
          });
        };

        // Thực hiện các bước tuần tự với timeout protection
        Promise.race([
          Promise.all([addProductImages(), addVariants()]),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Operation timeout after 30s')), 30000)
          )
        ])
          .then(() => {
            // Commit transaction
            connection.commit((err) => {
              if (err) {
                console.error('❌ Commit error:', err);
                return connection.rollback(() => reject(err));
              }

              console.log(`🎉 Product creation completed successfully!`);
              resolve({
                product_id: productId,
                variants_count: variants?.length || 0,
                images_count: categorizedImages.productImages?.length || 0,
                message: 'Product created successfully with all variants and images'
              });
            });
          })
          .catch((err) => {
            console.error('❌ Error in product creation process:', err);
            connection.rollback(() => {
              console.log('🔄 Transaction rolled back');
              reject(err);
            });
          });
      });
    });
  });
};

// Cập nhật sản phẩm
export const updateProduct = async (productData) => {
  const {
    product_id, product_name, description, discount,
    brand_id, category_id, material_id, target_id,
    size_ids, color_ids, variants, productImages,
    newProductImages
  } = productData;

  console.log("🔍 updateProduct called with data:", {
    product_id,
    product_name,
    brand_id,
    category_id,
    material_id,
    target_id,
    variants_count: variants?.length || 0
  });

  return new Promise((resolve, reject) => {
    connection.beginTransaction(async (err) => {
      if (err) {
        console.error('❌ Error starting transaction:', err);
        return reject(err);
      }

      console.log('🔄 Starting product update transaction for ID:', product_id);

      // 1. Cập nhật thông tin sản phẩm cơ bản
      const updateProductSql = `
        UPDATE products 
        SET product_name = ?, description = ?, discount = ?
        WHERE product_id = ?
      `;

      connection.query(updateProductSql, [product_name, description, discount, product_id], (err, result) => {
        if (err) {
          console.error('❌ Error updating product:', err);
          return connection.rollback(() => reject(err));
        }

        // 2. Cập nhật product images nếu có
        if (productImages && productImages.length > 0) {
          // Kiểm tra xem đã có ảnh trong bảng product_images chưa
          const checkImagesSql = 'SELECT COUNT(*) AS count FROM product_images WHERE product_id = ?';
          connection.query(checkImagesSql, [product_id], (err, results) => {
            if (err) {
              console.error('❌ Error checking product images:', err);
              return connection.rollback(() => reject(err));
            }
            const hasImages = results[0].count > 0;
            if (hasImages) {
              // Nếu đã có ảnh, xóa và thêm lại như cũ
              const deleteImagesSql = 'DELETE FROM product_images WHERE product_id = ?';
              connection.query(deleteImagesSql, [product_id], (err) => {
                if (err) {
                  console.error('❌ Error deleting old product images:', err);
                  return connection.rollback(() => reject(err));
                }
                const insertImagesSql = 'INSERT INTO product_images (product_id, product_image_url) VALUES ?';
                const imageValues = productImages.map(url => [product_id, url]);
                connection.query(insertImagesSql, [imageValues], (err) => {
                  if (err) {
                    console.error('❌ Error inserting new product images:', err);
                    return connection.rollback(() => reject(err));
                  }
                  updateVariantsData();
                });
              });
            } else {
              // Nếu chưa có ảnh, chỉ cần insert
              const insertImagesSql = 'INSERT INTO product_images (product_id, product_image_url) VALUES ?';
              const imageValues = productImages.map(url => [product_id, url]);
              connection.query(insertImagesSql, [imageValues], (err) => {
                if (err) {
                  console.error('❌ Error inserting product images:', err);
                  return connection.rollback(() => reject(err));
                }
                updateVariantsData();
              });
            }
          });
        } else {
          updateVariantsData();
        }

        // 3. Hàm cập nhật variants
        async function updateVariantsData() {
          if (!variants || variants.length === 0) {
            return connection.commit((err) => {
              if (err) {
                return connection.rollback(() => reject(err));
              }
              resolve({
                product_id: product_id,
                affected_rows: result.affectedRows,
                variants_count: 0
              });
            });
          }

          // Lấy danh sách variant_id hiện tại trong DB
          connection.query(
            'SELECT variant_id FROM product_variants WHERE product_id = ?',
            [product_id],
            (err, dbVariants) => {
              if (err) {
                return connection.rollback(() => reject(err));
              }

              const dbVariantIds = dbVariants.map(v => v.variant_id);
              const incomingVariantIds = variants.filter(v => v.variant_id).map(v => Number(v.variant_id));
              const toDelete = dbVariantIds.filter(id => !incomingVariantIds.includes(id));

              // Xóa các variant không còn trong danh sách mới
              const deleteOldVariants = () => {
                return new Promise((resolveDelete, rejectDelete) => {
                  if (toDelete.length === 0) return resolveDelete();
                  connection.query(
                    'DELETE FROM product_variants WHERE variant_id IN (?)',
                    [toDelete],
                    (err) => {
                      if (err) return rejectDelete(err);
                      resolveDelete();
                    }
                  );
                });
              };

              // Update hoặc insert các variant mới
              const upsertVariants = () => {
                return Promise.all(
                  variants.map(variant => {
                    if (variant.variant_id) {
                      // UPDATE variant
                      return new Promise((resolveUpdate, rejectUpdate) => {
                        const updateSql = `
                          UPDATE product_variants SET
                            brand_id = ?, category_id = ?, material_id = ?, target_id = ?,
                            size_id = ?, color_id = ?, price = ?, quantity = ?, image_url = ?
                          WHERE variant_id = ? AND product_id = ?
                        `;
                        connection.query(
                          updateSql,
                          [
                            parseInt(brand_id),
                            parseInt(category_id),
                            parseInt(material_id),
                            parseInt(target_id),
                            parseInt(variant.size_id),
                            parseInt(variant.color_id),
                            parseFloat(variant.price) || 0,
                            parseInt(variant.quantity) || 0,
                            variant.variant_image_url || variant.image_url || null,
                            variant.variant_id,
                            product_id
                          ],
                          (err) => {
                            if (err) return rejectUpdate(err);
                            resolveUpdate();
                          }
                        );
                      });
                    } else {
                      // INSERT variant mới
                      return new Promise((resolveInsert, rejectInsert) => {
                        const insertSql = `
                          INSERT INTO product_variants
                          (product_id, brand_id, category_id, material_id, target_id, size_id, color_id, price, quantity, image_url)
                          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `;
                        connection.query(
                          insertSql,
                          [
                            product_id,
                            parseInt(brand_id),
                            parseInt(category_id),
                            parseInt(material_id),
                            parseInt(target_id),
                            parseInt(variant.size_id),
                            parseInt(variant.color_id),
                            parseFloat(variant.price) || 0,
                            parseInt(variant.quantity) || 0,
                            variant.variant_image_url || variant.image_url || null
                          ],
                          (err) => {
                            if (err) return rejectInsert(err);
                            resolveInsert();
                          }
                        );
                      });
                    }
                  })
                );
              };

              // Thực hiện xóa và upsert
              deleteOldVariants()
                .then(upsertVariants)
                .then(() => {
                  connection.commit((err) => {
                    if (err) {
                      return connection.rollback(() => reject(err));
                    }
                    resolve({
                      product_id: product_id,
                      affected_rows: result.affectedRows,
                      variants_count: variants.length
                    });
                  });
                })
                .catch((err) => {
                  connection.rollback(() => reject(err));
                });
            }
          );
        }
      });
    });
  });
};

export const updateVariant = async (variantData) => {
  const {
    variant_id, product_id, color_id, size_id, price, quantity, image_url
  } = variantData;

  return new Promise((resolve, reject) => {
    if (variant_id) {
      // Update existing variant
      const updateSql = `
        UPDATE product_variants 
        SET color_id = ?, size_id = ?, price = ?, quantity = ?, image_url = ?
        WHERE variant_id = ? AND product_id = ?
      `;

      connection.query(updateSql, [color_id, size_id, price, quantity, image_url, variant_id, product_id], (err, result) => {
        if (err) {
          console.error('❌ Error updating variant:', err);
          return reject(err);
        }

        resolve({
          variant_id,
          product_id,
          affected_rows: result.affectedRows,
          updated: true
        });
      });
    } else {
      // Create new variant
      const insertSql = `
        INSERT INTO product_variants (product_id, color_id, size_id, price, quantity, image_url)
        VALUES (?, ?, ?, ?, ?, ?)
      `;

      connection.query(insertSql, [product_id, color_id, size_id, price, quantity, image_url], (err, result) => {
        if (err) {
          console.error('❌ Error creating variant:', err);
          return reject(err);
        }

        resolve({
          variant_id: result.insertId,
          product_id,
          affected_rows: result.affectedRows,
          created: true
        });
      });
    }
  });
};

// lấy ảnh chung của sản phẩm
export const getProductImages = (productId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT product_image_url 
      FROM product_images 
      WHERE product_id = ?;
    `;
    connection.query(query, [productId], (err, results) => {
      if (err) {
        console.error('Error fetching product images:', err);
        reject(err);
      } else {
        // Trả về mảng các URL ảnh
        const imageUrls = results.map(row => row.product_image_url);
        resolve(imageUrls);
      }
    });
  });
};

// Xóa sản phẩm
export const deleteProduct = (productId) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM products WHERE product_id = ?`;
    connection.query(query, [productId], (err, result) => {
      if (err) {
        console.error('Error deleting product:', err);
        reject(err);
      } else {
        if (result.affectedRows > 0) {
          resolve({ message: 'Product deleted successfully' });
        } else {
          resolve({ message: 'No product found with the given ID' });
        }
      }
    });
  });
};

// Các hàm helper khác có thể thêm vào đây nếu cần
export const getProductVariants = (productId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        pv.variant_id,
        pv.price,
        pv.quantity,
        pv.image_url,
        s.size_id,
        s.size_name,
        c.color_id,
        c.color_name,
        c.color_code
      FROM product_variants pv
      LEFT JOIN sizes s ON pv.size_id = s.size_id
      LEFT JOIN colors c ON pv.color_id = c.color_id
      WHERE pv.product_id = ?
      ORDER BY s.size_name, c.color_name
    `;

    connection.query(query, [productId], (err, results) => {
      if (err) {
        console.error('Error fetching product variants:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

// Cập nhật số lượng tồn kho
export const updateProductStock = (variantId, quantity) => {
  return new Promise((resolve, reject) => {
    const query = `
      UPDATE product_variants 
      SET quantity = ? 
      WHERE variant_id = ?
    `;

    connection.query(query, [quantity, variantId], (err, result) => {
      if (err) {
        console.error('Error updating stock:', err);
        reject(err);
      } else {
        resolve({
          variant_id: variantId,
          new_quantity: quantity,
          affected_rows: result.affectedRows
        });
      }
    });
  });
};

// Lấy thống kê sản phẩm
export const getProductStatistics = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        COUNT(DISTINCT p.product_id) as total_products,
        COUNT(pv.variant_id) as total_variants,
        SUM(pv.quantity) as total_stock,
        AVG(pv.price) as average_price,
        MIN(pv.price) as min_price,
        MAX(pv.price) as max_price
      FROM products p
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id
    `;

    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching product statistics:', err);
        reject(err);
      } else {
        resolve(results[0]);
      }
    });
  });
};

//Lấy tất cả các sản phẩm theo danh mục
export const getProductsByCategory = (categoryId, excludeProductId) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.product_id,
        p.product_name,
        p.description,
        p.discount,
        pi.product_image_url,
        pv.price
      FROM products p
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      WHERE pv.category_id = ?
        AND p.product_id != ?
      GROUP BY p.product_id
    `;

    connection.query(query, [categoryId, excludeProductId], (err, results) => {
      if (err) {
        console.error('Error fetching products by category:', err);
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

//Lấy đánh giá sản phẩm
export const getProductReviews = (id) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        r.review_id, r.customer_id, r.product_id,
        cus.customer_fullname,
        c.color_name, s.size_name, rating, comment, r.created_at,
        GROUP_CONCAT(pvr.url) AS media,
        rr.reply_id IS NOT NULL AS replied,
        rr.content AS reply_content,
        rr.created_at AS reply_created_at
      FROM reviews r
      LEFT JOIN products p ON p.product_id = r.product_id
      LEFT JOIN customers cus ON cus.customer_id = r.customer_id
      LEFT JOIN product_variants pv ON pv.variant_id = r.pv_id
      LEFT JOIN colors c ON c.color_id = pv.color_id
      LEFT JOIN sizes s ON s.size_id = pv.size_id
      LEFT JOIN picture_video_reviews pvr ON pvr.review_id = r.review_id
      LEFT JOIN reply_reviews rr ON rr.review_id = r.review_id
      WHERE p.product_id = ?
      GROUP BY r.review_id
    `;

    connection.query(query, [id], (err, results) => {
      if (err) {
        console.error('Error fetching product reviews:', err);
        reject(err);
      } else {
        results.forEach(r => {
          r.media = r.media ? r.media.split(',') : [];
        });
        resolve(results);
      }
    });
  });
};

export const createReviewWithMedia = (reviewData, mediaUrls) => {
  return new Promise((resolve, reject) => {
    const {
      customer_id,
      product_id,
      pv_id,         // variant_id
      rating,
      comment
    } = reviewData;

    // 1. Thêm review
    const reviewQuery = `
      INSERT INTO reviews (customer_id, product_id, pv_id, rating, comment, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    connection.query(
      reviewQuery,
      [customer_id, product_id, pv_id, rating, comment],
      (err, result) => {
        if (err) return reject(err);

        const review_id = result.insertId;

        // 2. Nếu có media thì thêm vào bảng picture_video_reviews
        if (mediaUrls && mediaUrls.length > 0) {
          const values = mediaUrls.map(url => [review_id, url]);
          const mediaQuery = `
            INSERT INTO picture_video_reviews (review_id, url)
            VALUES ?
          `;
          connection.query(mediaQuery, [values], (err2) => {
            if (err2) return reject(err2);
            resolve(review_id);
          });
        } else {
          resolve(review_id);
        }
      }
    );
  });
};

export const deleteReview = (reviewId, userId) => {
  return new Promise((resolve, reject) => {
    const query = `DELETE FROM reviews WHERE review_id = ? AND customer_id = ?`;
    connection.query(query, [reviewId, userId], (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};

// Lấy tất cả đánh giá sản phẩm
export const getAllReviews = () => {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT 
            r.review_id, r.customer_id, r.product_id,
            cus.customer_fullname, r.rating,
            c.color_name, s.size_name,
            p.product_name,
            c.color_name, s.size_name, rating, comment, r.created_at,
            GROUP_CONCAT(pvr.url) AS media,
            rr.reply_id IS NOT NULL AS replied,
            rr.content AS reply_content,
            rr.created_at AS reply_created_at
        FROM reviews r
        LEFT JOIN products p ON p.product_id = r.product_id
        LEFT JOIN customers cus ON cus.customer_id = r.customer_id
        LEFT JOIN product_variants pv ON pv.variant_id = r.pv_id
        LEFT JOIN colors c ON c.color_id = pv.color_id
        LEFT JOIN sizes s ON s.size_id = pv.size_id
        LEFT JOIN picture_video_reviews pvr ON pvr.review_id = r.review_id
        LEFT JOIN reply_reviews rr ON rr.review_id = r.review_id
        GROUP BY r.review_id
    `;

    connection.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching all reviews:', err);
        reject(err);
      } else {
        results.forEach(r => {
          r.media = r.media ? r.media.split(',') : [];
        });
        resolve(results);
      }
    });
  });
};

//Trả lời đánh giá
export const replyReview = (reviewId, content, user_id) => {
  return new Promise((resolve, reject) => {
    const query = `
      INSERT INTO reply_reviews (review_id, admin_id, content, created_at)
      VALUES (?, ?, ?, NOW())
    `;

    connection.query(query, [reviewId, user_id, content], (err, result) => {
      if (err) {
        console.error('Error replying to review:', err);
        reject(err);
      } else {
        // Sửa dòng này:
        resolve({ reply_id: result.insertId, affectedRows: result.affectedRows });
      }
    });
  });
}

export const searchProducts = (keyword) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        p.product_id, 
        p.product_name, 
        p.description, 
        p.discount,
        ROUND(AVG(r.rating), 1) AS rating,
        MIN(pv.price) AS price,
        GROUP_CONCAT(DISTINCT c.color_name ORDER BY c.color_name SEPARATOR ', ') AS colors,
        GROUP_CONCAT(DISTINCT s.size_name ORDER BY s.size_name SEPARATOR ', ') AS sizes,
        GROUP_CONCAT(DISTINCT m.material_name ORDER BY m.material_name SEPARATOR ', ') AS materials,
        GROUP_CONCAT(DISTINCT b.brand_name ORDER BY b.brand_name SEPARATOR ', ') AS brands,
        GROUP_CONCAT(DISTINCT cat.category_name ORDER BY cat.category_name SEPARATOR ', ') AS categories,
        GROUP_CONCAT(DISTINCT cat.category_id ORDER BY cat.category_id SEPARATOR ', ') AS categoryId,
        MIN(pi.product_image_url) AS product_image
      FROM products p
      LEFT JOIN product_variants pv ON p.product_id = pv.product_id 
      LEFT JOIN colors c ON pv.color_id = c.color_id 
      LEFT JOIN sizes s ON pv.size_id = s.size_id 
      LEFT JOIN materials m ON pv.material_id = m.material_id 
      LEFT JOIN brands b ON pv.brand_id = b.brand_id 
      LEFT JOIN categories cat ON pv.category_id = cat.category_id 
      LEFT JOIN product_images pi ON p.product_id = pi.product_id
      LEFT JOIN reviews r ON r.product_id = p.product_id
      WHERE
        p.product_name LIKE ? OR
        p.description LIKE ? OR
        b.brand_name LIKE ? OR
        cat.category_name LIKE ? OR
        m.material_name LIKE ?
      GROUP BY p.product_id;
    `;
    const like = `%${keyword}%`;
    connection.query(query, [like, like, like, like, like], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

export const suggestProducts = (keyword) => {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        p.product_id, 
        p.product_name
      FROM products p
      WHERE p.product_name LIKE ?
      GROUP BY p.product_id
      ORDER BY p.product_id DESC
      LIMIT 8
    `;
    const searchKey = `%${keyword}%`;
    connection.query(sql, [searchKey], (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
};

// ...existing code...

// Cập nhật số lượng sản phẩm trong kho khi có đơn hàng
export const updateProductQuantity = (variantId, quantity) => {
  return new Promise((resolve, reject) => {
    console.log(`Updating quantity for variant ${variantId}: -${quantity}`);

    // Kiểm tra số lượng hiện tại trước khi cập nhật
    const checkQuery = 'SELECT quantity, product_id FROM product_variants WHERE variant_id = ?';

    connection.query(checkQuery, [variantId], (err, results) => {
      if (err) {
        console.error('Error checking current quantity:', err);
        return reject(err);
      }

      if (results.length === 0) {
        return reject(new Error(`Product variant ${variantId} not found`));
      }

      const currentQuantity = results[0].quantity;
      const productId = results[0].product_id;

      if (currentQuantity < quantity) {
        return reject(new Error(`Insufficient stock. Available: ${currentQuantity}, Requested: ${quantity}`));
      }

      // Cập nhật số lượng
      const updateQuery = 'UPDATE product_variants SET quantity = quantity - ? WHERE variant_id = ?';

      connection.query(updateQuery, [quantity, variantId], (err, updateResults) => {
        if (err) {
          console.error('Error updating product quantity:', err);
          reject(err);
        } else {
          console.log(`Successfully updated quantity for variant ${variantId}. New quantity: ${currentQuantity - quantity}`);
          resolve({
            success: true,
            variantId: variantId,
            productId: productId,
            previousQuantity: currentQuantity,
            newQuantity: currentQuantity - quantity,
            soldQuantity: quantity,
            affectedRows: updateResults.affectedRows
          });
        }
      });
    });
  });
};

export const getProductsForYou = (userId) => {
  return new Promise((resolve, reject) => {
    if (!userId) {
      // Nếu chưa có userId, trả về sản phẩm mới nhất
      const query = `
        SELECT p.product_id, p.product_name, p.discount,
            MIN(pv.price) AS price,
            MIN(pi.product_image_url) AS product_image_url,
            ROUND(AVG(r.rating), 1) AS rating
        FROM products p
        LEFT JOIN product_variants pv ON p.product_id = pv.product_id
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
        LEFT JOIN reviews r ON r.product_id = p.product_id
        GROUP BY p.product_id
        ORDER BY p.created_at DESC
        LIMIT 9
      `;
      connection.query(query, [], (err, results) => {
        if (err) return reject(err);
        resolve(results);
      });
    } else {
      // Lấy các category_id mà user đã từng mua
      const categoryQuery = `
        SELECT DISTINCT pv.category_id
        FROM orders o
        JOIN order_details od ON o.order_id = od.order_id
        JOIN product_variants pv ON od.variant_id = pv.variant_id
        WHERE o.customer_id = ?
      `;
      connection.query(categoryQuery, [userId], (err, categories) => {
        if (err) return reject(err);

        let categoryIds = categories.map(c => c.category_id);
        if (categoryIds.length === 0) {
          // Nếu user chưa mua gì, trả về sản phẩm mới nhất
          const query = `
            SELECT p.product_id, p.product_name, p.discount,
                MIN(pv.price) AS price,
                MIN(pi.product_image_url) AS product_image_url,
                ROUND(AVG(r.rating), 1) AS rating
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN product_images pi ON p.product_id = pi.product_id
            LEFT JOIN reviews r ON r.product_id = p.product_id
            GROUP BY p.product_id
            ORDER BY p.created_at DESC
            LIMIT 9
          `;
          connection.query(query, [], (err, results) => {
            if (err) return reject(err);
            resolve(results);
          });
        } else {
          // Lấy sản phẩm cùng danh mục
          const placeholders = categoryIds.map(() => '?').join(',');
          const query = `
            SELECT DISTINCT p.product_id, p.product_name, p.discount,
                MIN(pv.price) AS price,
                MIN(pi.product_image_url) AS product_image_url,
                ROUND(AVG(r.rating), 1) AS rating
            FROM products p
            LEFT JOIN product_variants pv ON p.product_id = pv.product_id
            LEFT JOIN product_images pi ON p.product_id = pi.product_id
            LEFT JOIN reviews r ON r.product_id = p.product_id
            WHERE pv.category_id IN (${placeholders})
            GROUP BY p.product_id
            ORDER BY p.created_at DESC
            LIMIT 9
          `;
          connection.query(query, categoryIds, (err, results) => {
            if (err) return reject(err);
            resolve(results);
          });
        }
      });
    }
  });
};

// // Cập nhật số lượng cho nhiều sản phẩm cùng lúc (batch update)
// export const updateMultipleProductQuantities = (items) => {
//   return new Promise(async (resolve, reject) => {
//     console.log('Updating quantities for multiple products:', items);

//     try {
//       const results = [];
//       const errors = [];

//       // Sử dụng Promise.all để cập nhật đồng thời nhưng an toàn
//       for (const item of items) {
//         try {
//           const result = await updateProductQuantity(item.variantId, item.quantity);
//           results.push(result);
//         } catch (error) {
//           console.error(`Error updating variant ${item.variantId}:`, error);
//           errors.push({
//             variantId: item.variantId,
//             error: error.message
//           });
//         }
//       }

//       if (errors.length > 0) {
//         // Nếu có lỗi, có thể cần rollback hoặc xử lý đặc biệt
//         console.warn('Some items failed to update:', errors);
//         resolve({
//           success: false,
//           results,
//           errors,
//           message: `${results.length} items updated successfully, ${errors.length} items failed`
//         });
//       } else {
//         resolve({
//           success: true,
//           results,
//           errors: [],
//           message: `Successfully updated ${results.length} items`
//         });
//       }

//     } catch (error) {
//       console.error('Error in batch quantity update:', error);
//       reject(error);
//     }
//   });
// };

// // Khôi phục số lượng sản phẩm (rollback) khi cần thiết
// export const restoreProductQuantity = (variantId, quantity) => {
//   return new Promise((resolve, reject) => {
//     console.log(`Restoring quantity for variant ${variantId}: +${quantity}`);

//     const updateQuery = 'UPDATE product_variants SET quantity = quantity + ? WHERE variant_id = ?';

//     connection.query(updateQuery, [quantity, variantId], (err, results) => {
//       if (err) {
//         console.error('Error restoring product quantity:', err);
//         reject(err);
//       } else {
//         console.log(`Successfully restored quantity for variant ${variantId}`);
//         resolve({
//           success: true,
//           variantId: variantId,
//           restoredQuantity: quantity,
//           affectedRows: results.affectedRows
//         });
//       }
//     });
//   });
// };

// // Kiểm tra tồn kho trước khi đặt hàng
// export const checkStockAvailability = (items) => {
//   return new Promise((resolve, reject) => {
//     if (!items || items.length === 0) {
//       return resolve({ available: true, items: [] });
//     }

//     const variantIds = items.map(item => item.variantId);
//     const placeholders = variantIds.map(() => '?').join(',');

//     const query = `
//             SELECT
//                 pv.variant_id,
//                 pv.quantity as available_quantity,
//                 p.product_name,
//                 c.color_name,
//                 s.size_name
//             FROM product_variants pv
//             JOIN products p ON pv.product_id = p.product_id
//             JOIN colors c ON pv.color_id = c.color_id
//             JOIN sizes s ON pv.size_id = s.size_id
//             WHERE pv.variant_id IN (${placeholders})
//         `;

//     connection.query(query, variantIds, (err, results) => {
//       if (err) {
//         console.error('Error checking stock availability:', err);
//         return reject(err);
//       }

//       const stockInfo = results.reduce((acc, row) => {
//         acc[row.variant_id] = row;
//         return acc;
//       }, {});

//       const unavailableItems = [];
//       const availableItems = [];

//       items.forEach(item => {
//         const stock = stockInfo[item.variantId];
//         if (!stock) {
//           unavailableItems.push({
//             ...item,
//             reason: 'Product variant not found'
//           });
//         } else if (stock.available_quantity < item.quantity) {
//           unavailableItems.push({
//             ...item,
//             available_quantity: stock.available_quantity,
//             requested_quantity: item.quantity,
//             product_name: stock.product_name,
//             color_name: stock.color_name,
//             size_name: stock.size_name,
//             reason: 'Insufficient stock'
//           });
//         } else {
//           availableItems.push({
//             ...item,
//             available_quantity: stock.available_quantity,
//             product_name: stock.product_name,
//             color_name: stock.color_name,
//             size_name: stock.size_name
//           });
//         }
//       });

//       resolve({
//         available: unavailableItems.length === 0,
//         availableItems,
//         unavailableItems,
//         totalItems: items.length,
//         availableCount: availableItems.length,
//         unavailableCount: unavailableItems.length
//       });
//     });
//   });
// };

