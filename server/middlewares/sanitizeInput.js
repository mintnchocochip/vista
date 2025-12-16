/**
 * Sanitize user input to prevent injection attacks
 */
export default function sanitizeInput(req, res, next) {
  // ✅ Sanitize body (works because body is writable)
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  // ✅ Sanitize query (replace properties, not the object itself)
  if (req.query && typeof req.query === "object") {
    Object.keys(req.query).forEach((key) => {
      const value = req.query[key];
      if (typeof value === "string") {
        req.query[key] = value.trim();
      }
    });
  }

  // ✅ Sanitize params (replace properties, not the object itself)
  if (req.params && typeof req.params === "object") {
    Object.keys(req.params).forEach((key) => {
      const value = req.params[key];
      if (typeof value === "string") {
        req.params[key] = value.trim();
      }
    });
  }

  next();
}

function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") return obj;

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = value.trim();
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "object" ? sanitizeObject(item) : item,
      );
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}
