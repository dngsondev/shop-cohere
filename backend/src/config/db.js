// import mysql from 'mysql2';
// import dotenv from 'dotenv';

// dotenv.config();

// const connection = mysql.createConnection({
//     host: process.env.DB_HOST,
//     user: process.env.DB_USER,
//     password: process.env.DB_PASSWORD,
//     database: process.env.DB_NAME,
//     // Thêm cấu hình tối ưu cho xử lý nhiều files
//     //   acquireTimeout: 60000,
//     //   timeout: 60000,
//     //   reconnect: true,
//     //   maxReconnects: 3
// });

// connection.connect((err) => {
//     if (err) {
//         console.error('❌ Error connecting to the database:', err);
//     } else {
//         console.log('✅ Connected to the MySQL database!');
//     }
// });

// export default connection;
import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export default connection;