// pages/api/pro-data.js

import mysql from 'mysql2/promise';

export default async function handler(req, res) {
  try {
    const connection = await mysql.createConnection({
      host: '102.210.149.248',
      user: 'laraveluser',
      password: 'Ferroh@2024',
      database: 'laravel', // 🔁 Replace with your actual DB name
      port: 3306,
    });

    const [rows] = await connection.execute('SELECT * FROM users'); // 🔁 Replace with your table

    await connection.end();

    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
}
