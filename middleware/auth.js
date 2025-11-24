const jwt = require("jsonwebtoken");
const jwtConfig = require("../config/jwt");
const { query } = require("../config/database");

// Middleware de autenticación
const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token de autenticación requerido",
      });
    }

    const decoded = jwt.verify(token, jwtConfig.secret);

    // Verificar que el usuario existe y está activo
    const users = await query(
      "SELECT id, email, role, is_active FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Usuario no encontrado",
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: "Usuario inactivo",
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Token inválido",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expirado",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error en autenticación",
      error: error.message,
    });
  }
};

// Middleware para verificar roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Usuario no autenticado",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "No tiene permisos para realizar esta acción",
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorize,
};
