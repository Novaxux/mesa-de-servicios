const bcrypt = require("bcryptjs");
const { query } = require("../config/database");
require("dotenv").config();

async function initAdmin() {
  try {
    const email = "admin@mesaservicios.com";
    const password = "Admin123!";
    const hashedPassword = await bcrypt.hash(password, 10);

    // Verificar si el usuario ya existe
    const existingUsers = await query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    const existing = existingUsers.length > 0 ? existingUsers[0] : null;

    if (existing) {
      // Actualizar contraseña
      await query("UPDATE users SET password = ? WHERE email = ?", [
        hashedPassword,
        email,
      ]);
      console.log("✅ Contraseña de administrador actualizada");
    } else {
      // Obtener ID del departamento "Administración" o "Sin Asignar"
      const deptResult = await query(
        "SELECT id FROM departments WHERE name IN ('Administración', 'Sin Asignar') ORDER BY name LIMIT 1"
      );
      const departmentId = deptResult.length > 0 ? deptResult[0].id : null;

      // Crear usuario administrador
      await query(
        `INSERT INTO users (email, password, first_name, last_name, role, department_id, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          email,
          hashedPassword,
          "Administrador",
          "Sistema",
          "admin",
          departmentId,
          true,
        ]
      );
      console.log("✅ Usuario administrador creado");
    }

    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log(
      "⚠️  IMPORTANTE: Cambia la contraseña después del primer inicio de sesión"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error al inicializar administrador:", error);
    process.exit(1);
  }
}

initAdmin();
