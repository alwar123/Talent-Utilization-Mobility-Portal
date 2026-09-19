const jwt = require("jsonwebtoken");

/**
 * Auth middleware factory.
 * Usage:
 *   auth()          → just verifies token, no role check
 *   auth("hr")      → verifies token AND enforces role === "hr"
 *   auth("employee")→ verifies token AND enforces role === "employee"
 */
module.exports = (requiredRole) => (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (requiredRole && decoded.role !== requiredRole) {
      return res.status(403).json({ error: "Access denied: insufficient role" });
    }

    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
};
