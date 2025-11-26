# Migración de Departamentos

## Resumen

Esta migración normaliza el campo `department` de la tabla `users`, convirtiéndolo de un VARCHAR libre a una relación con una tabla `departments` normalizada.

## Problema Anterior

- **Campo VARCHAR libre**: Los usuarios podían escribir cualquier texto en el campo departamento
- **Inconsistencias**: "IT", "TI", "Tecnología", "Sistemas" todos representaban lo mismo
- **Dificulta reportes**: Sin normalización es difícil hacer análisis por departamento
- **Sin gestión**: No hay forma de gestionar departamentos centralizadamente
- **Pedido en registro**: Se pedía al usuario especificar su departamento al registrarse

## Solución Implementada

### 1. Nueva Tabla `departments`

```sql
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    manager_id INT NULL,  -- Responsable del departamento
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 2. Cambio en Tabla `users`

**Antes:**

```sql
department VARCHAR(100)
```

**Después:**

```sql
department_id INT NULL,
FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
```

### 3. Departamentos por Defecto

- Tecnología de la Información
- Recursos Humanos
- Finanzas
- Operaciones
- Marketing
- Ventas
- Administración
- Sin Asignar (para usuarios sin departamento)

## Pasos de Migración

### Paso 1: Ejecutar Script SQL

```bash
mysql -u root -p mesa_servicios < scripts/migrate-departments.sql
```

El script hace lo siguiente:

1. ✅ Crea tabla `departments` si no existe
2. ✅ Inserta departamentos por defecto
3. ✅ Migra departamentos existentes únicos de `users`
4. ✅ Agrega columna `department_id` a `users`
5. ✅ Mapea valores antiguos a nuevos IDs
6. ✅ Asigna "Sin Asignar" a usuarios sin departamento
7. ✅ Crea foreign key y índices
8. ⚠️ Mantiene columna antigua por seguridad (se puede eliminar después)

### Paso 2: Verificar Migración

El script muestra estadísticas al final:

```sql
SELECT
    'Migración completada' as status,
    (SELECT COUNT(*) FROM departments) as total_departments,
    (SELECT COUNT(*) FROM users WHERE department_id IS NOT NULL) as users_with_department;
```

### Paso 3: Actualizar Aplicación

Los siguientes archivos ya fueron actualizados:

#### Backend:

- ✅ `data/schema.sql` - Schema actualizado
- ✅ `models/Department.js` - Nuevo modelo
- ✅ `controllers/departmentController.js` - Nuevo controlador
- ✅ `routes/departments.js` - Nuevas rutas
- ✅ `routes/index.js` - Rutas registradas

#### Frontend Mobile:

- ✅ `mobile/screens/Auth/RegisterScreen.js` - Campo departamento removido

### Paso 4: Eliminar Columna Antigua (Opcional)

**⚠️ Solo hacer después de verificar que todo funciona:**

```sql
ALTER TABLE users DROP COLUMN department;
```

## Nuevos Endpoints API

### Obtener Todos los Departamentos

```http
GET /api/departments
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tecnología de la Información",
      "description": "Departamento de TI y soporte técnico",
      "manager_id": null,
      "is_active": true,
      "created_at": "2024-11-25T00:00:00.000Z"
    }
  ]
}
```

### Obtener Departamento por ID

```http
GET /api/departments/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tecnología de la Información",
    "description": "Departamento de TI y soporte técnico",
    "manager_id": 5,
    "manager_first_name": "Juan",
    "manager_last_name": "Pérez",
    "manager_email": "juan@empresa.com",
    "stats": {
      "total_users": 15,
      "open_tickets": 8,
      "closed_this_month": 23
    }
  }
}
```

### Crear Departamento (Admin)

```http
POST /api/departments
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Legal",
  "description": "Departamento Legal y Compliance",
  "manager_id": 10
}
```

### Actualizar Departamento (Admin)

```http
PUT /api/departments/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Tecnología e Innovación",
  "description": "TI, desarrollo y transformación digital",
  "manager_id": 5,
  "is_active": true
}
```

### Obtener Usuarios de un Departamento

```http
GET /api/departments/:id/users
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": {
    "department": { ... },
    "users": [
      {
        "id": 1,
        "email": "user@empresa.com",
        "first_name": "María",
        "last_name": "González",
        "role": "user",
        "phone": "1234567890"
      }
    ],
    "total": 15
  }
}
```

### Buscar Departamentos

```http
GET /api/departments/search?q=tecnologia
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tecnología de la Información",
      ...
    }
  ],
  "total": 1
}
```

### Eliminar Departamento (Admin)

```http
DELETE /api/departments/:id
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Departamento eliminado exitosamente"
}

Error si tiene usuarios:
{
  "success": false,
  "message": "No se puede eliminar el departamento. Tiene 15 usuarios asignados"
}
```

## Cambios en Flujo de Usuario

### Antes:

1. Usuario se registra
2. **Usuario escribe manualmente su departamento** ❌
3. Valor almacenado sin validación

### Ahora:

1. Usuario se registra (sin especificar departamento)
2. Usuario obtiene `department_id = "Sin Asignar"` automáticamente
3. **Admin asigna departamento correcto** desde panel de administración ✅
4. Valor normalizado y consistente en toda la base de datos

## Gestión de Departamentos (Admin)

Los administradores ahora pueden:

- ✅ Ver todos los departamentos
- ✅ Crear nuevos departamentos
- ✅ Editar nombre, descripción, manager
- ✅ Desactivar departamentos (soft delete)
- ✅ Ver estadísticas por departamento
- ✅ Ver usuarios asignados a cada departamento
- ✅ Asignar/cambiar departamento de usuarios

## Actualización de Usuarios

Para cambiar el departamento de un usuario, actualizar el endpoint de usuarios:

```http
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "department_id": 1
}
```

## Modelo Department

### Métodos Disponibles:

```javascript
// Obtener todos los departamentos activos
await Department.getAll();

// Obtener por ID
await Department.getById(id);

// Obtener por nombre
await Department.getByName("Tecnología de la Información");

// Crear
await Department.create({ name, description, manager_id });

// Actualizar
await Department.update(id, { name, description, manager_id, is_active });

// Eliminar (soft delete)
await Department.delete(id);

// Obtener usuarios del departamento
await Department.getUsers(departmentId);

// Obtener estadísticas
await Department.getStats(departmentId);

// Buscar
await Department.search("tecnologia");
```

## Reportes y Analytics

Ahora es posible hacer análisis precisos:

```sql
-- Tickets por departamento
SELECT
    d.name as departamento,
    COUNT(t.id) as total_tickets,
    SUM(CASE WHEN t.status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as abiertos,
    SUM(CASE WHEN t.status = 'closed' THEN 1 ELSE 0 END) as cerrados
FROM departments d
LEFT JOIN users u ON d.id = u.department_id
LEFT JOIN tickets t ON u.id = t.created_by
GROUP BY d.id, d.name;

-- Promedio de resolución por departamento
SELECT
    d.name as departamento,
    AVG(TIMESTAMPDIFF(HOUR, t.created_at, t.resolution_time)) as promedio_horas
FROM departments d
INNER JOIN users u ON d.id = u.department_id
INNER JOIN tickets t ON u.id = t.created_by
WHERE t.resolution_time IS NOT NULL
GROUP BY d.id, d.name;
```

## Rollback (Si es Necesario)

Si algo sale mal, puedes revertir:

```sql
-- 1. Restaurar valores desde department_id a department
UPDATE users u
INNER JOIN departments d ON u.department_id = d.id
SET u.department = d.name;

-- 2. Eliminar foreign key
ALTER TABLE users DROP FOREIGN KEY users_ibfk_department;

-- 3. Eliminar columna department_id
ALTER TABLE users DROP COLUMN department_id;

-- 4. Opcional: Eliminar tabla departments
DROP TABLE departments;
```

## Testing

### Pruebas a Realizar:

1. ✅ Registro de nuevos usuarios (sin campo departamento)
2. ✅ Usuarios obtienen "Sin Asignar" por defecto
3. ✅ Admin puede listar departamentos
4. ✅ Admin puede crear nuevos departamentos
5. ✅ Admin puede editar departamentos
6. ✅ Admin puede asignar usuarios a departamentos
7. ✅ No se pueden eliminar departamentos con usuarios
8. ✅ Búsqueda de departamentos funciona
9. ✅ Estadísticas de departamentos correctas
10. ✅ Reportes por departamento funcionan

## Beneficios

### ✅ Datos Normalizados

- Consistencia en nombres de departamentos
- No más variaciones ("IT" vs "TI" vs "Tecnología")

### ✅ Mejor UX en Registro

- Usuarios no tienen que adivinar su departamento
- Proceso de registro más rápido y simple

### ✅ Gestión Centralizada

- Admin puede gestionar departamentos desde un solo lugar
- Fácil agregar/modificar/desactivar departamentos

### ✅ Reportes Precisos

- Analytics por departamento confiables
- Comparaciones entre departamentos exactas

### ✅ Escalabilidad

- Fácil agregar campos (budget, location, etc.)
- Posible implementar jerarquías (sub-departamentos)

### ✅ Auditoría

- Se puede rastrear cambios de departamento
- Historial de managers

## Próximos Pasos Recomendados

1. **Frontend Admin Panel** - Crear UI para gestión de departamentos
2. **Jerarquías** - Agregar parent_id para sub-departamentos
3. **Campos Adicionales** - budget, location, office
4. **Reportes Avanzados** - Dashboard por departamento
5. **Notificaciones** - Alertar a manager cuando se crea ticket en su departamento
6. **Auto-asignación** - Asignar técnicos del mismo departamento

## Notas Importantes

⚠️ **Backup**: Siempre hacer backup antes de ejecutar la migración
⚠️ **Testing**: Probar en ambiente de desarrollo primero
⚠️ **Comunicación**: Informar a los usuarios del cambio
⚠️ **Columna Antigua**: La columna `department` VARCHAR se mantiene por seguridad, eliminar después de verificar

## Soporte

Si encuentras problemas durante la migración:

1. Revisa los logs de MySQL
2. Verifica que el script se ejecutó completamente
3. Consulta las estadísticas de migración
4. Si es necesario, ejecuta el rollback
