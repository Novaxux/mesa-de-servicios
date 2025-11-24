const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'mesa_servicios_db',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'rootpassword',
  database: process.env.DB_NAME || 'mesa_servicios',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a la base de datos establecida');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    return false;
  }
};

// Función para ejecutar queries
const query = async (sql, params) => {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
};

// Función para transacciones
const transaction = async (callback) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await callback(connection);
    await connection.commit();
    return result;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};

