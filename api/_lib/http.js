export function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
}

export function allowMethods(req, res, methods) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', methods.join(', '));
    res.status(204).end();
    return false;
  }

  if (!methods.includes(req.method)) {
    res.setHeader('Allow', methods.join(', '));
    sendJson(res, 405, { error: `Method ${req.method} not allowed` });
    return false;
  }

  return true;
}
