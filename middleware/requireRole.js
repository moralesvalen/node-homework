const { StatusCodes } = require("http-status-codes");

const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Not authenticated" });
    }

    const userRole = req.user.role;

    if (!userRole) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Access denied: no role assigned" });
    }

    if (!allowedRoles.includes(userRole)) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Access denied: insufficient role" });
    }

    next();
  };
};

module.exports = requireRole;
