-- Migración: Normalizar departamentos
-- Fecha: 2024-11-25
-- Descripción: Convierte el campo VARCHAR department a una relación con tabla departments

USE mesa_servicios;

-- Paso 1: Crear tabla de departamentos si no existe
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    manager_id INT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Paso 2: Insertar departamentos por defecto
INSERT IGNORE INTO departments (name, description, is_active) VALUES
('Tecnología de la Información', 'Departamento de TI y soporte técnico', TRUE),
('Recursos Humanos', 'Gestión de personal y nómina', TRUE),
('Finanzas', 'Contabilidad y gestión financiera', TRUE),
('Operaciones', 'Operaciones y logística', TRUE),
('Marketing', 'Marketing y comunicaciones', TRUE),
('Ventas', 'Equipo comercial y ventas', TRUE),
('Administración', 'Administración general', TRUE),
('Sin Asignar', 'Usuarios sin departamento asignado', TRUE);

-- Paso 3: Ya no es necesario migrar departamentos antiguos de VARCHAR
-- porque la columna department ya fue reemplazada por department_id

-- Paso 4: Verificar si la columna department_id ya existe
SET @col_exists = (
    SELECT COUNT(*)
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = 'mesa_servicios'
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'department_id'
);

-- Agregar columna solo si no existe
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE users ADD COLUMN department_id INT NULL AFTER phone',
    'SELECT "Column department_id already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Paso 5: Ya no es necesario migrar datos desde la columna antigua

-- Paso 6: Asignar "Sin Asignar" a usuarios sin departamento
UPDATE users u
SET u.department_id = (SELECT id FROM departments WHERE name = 'Sin Asignar')
WHERE u.department_id IS NULL;

-- Paso 7: Agregar foreign key si no existe
-- Primero verificamos si existe la constraint
SET @constraint_exists = (
    SELECT COUNT(*)
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = 'mesa_servicios'
    AND TABLE_NAME = 'users'
    AND CONSTRAINT_NAME = 'users_ibfk_department'
);

-- Solo agregamos la constraint si no existe
SET @sql = IF(@constraint_exists = 0,
    'ALTER TABLE users ADD CONSTRAINT users_ibfk_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL',
    'SELECT "Foreign key already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Paso 8: Agregar índice si no existe
SET @index_exists = (
    SELECT COUNT(*)
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = 'mesa_servicios'
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'idx_department'
);

SET @sql = IF(@index_exists = 0,
    'ALTER TABLE users ADD INDEX idx_department (department_id)',
    'SELECT "Index idx_department already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Paso 9: Columna antigua ya fue eliminada en el schema

-- Verificación de la migración
SELECT 
    'Migración completada' as status,
    (SELECT COUNT(*) FROM departments) as total_departments,
    (SELECT COUNT(*) FROM users WHERE department_id IS NOT NULL) as users_with_department,
    (SELECT COUNT(*) FROM users WHERE department_id IS NULL) as users_without_department;

-- Ver distribución por departamento
SELECT 
    d.name as departamento,
    COUNT(u.id) as total_usuarios
FROM departments d
LEFT JOIN users u ON d.id = u.department_id
GROUP BY d.id, d.name
ORDER BY total_usuarios DESC;
