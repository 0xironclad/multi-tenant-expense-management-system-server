import { Request, Response, NextFunction } from 'express';
import http from 'http';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL

const PUBLIC_ROUTES: { method: string; pattern: RegExp | string }[] = [
  { method: 'POST', pattern: '/api/auth/register' },
  { method: 'POST', pattern: '/api/auth/login' },
  { method: 'POST', pattern: '/api/auth/refresh' },
  { method: 'GET',  pattern: /^\/api\/invitations\/[^/]+$/ },
];

const isPublicRoute = (method: string, path: string): boolean =>
  PUBLIC_ROUTES.some((r) =>
    r.method === method &&
    (typeof r.pattern === 'string' ? r.pattern === path : r.pattern.test(path)),
  );

const stripUserHeaders = (req: Request): void => {
  Object.keys(req.headers).forEach((key) => {
    if (key.toLowerCase().startsWith('x-user-')) {
      delete req.headers[key];
    }
  });
};

const verifyToken = (token: string): Promise<{ userId: string; email: string }> => {
  return new Promise((resolve, reject) => {
    const url = new URL('/auth/verify', AUTH_SERVICE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    };

    const reqHttp = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const body = JSON.parse(data);
          if (res.statusCode === 200 && body.valid) {
            resolve({ userId: body.userId, email: body.email });
          } else {
            reject(new Error('INVALID_TOKEN'));
          }
        } catch {
          reject(new Error('PARSE_ERROR'));
        }
      });
    });

    reqHttp.on('error', reject);
    reqHttp.end();
  });
};

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  stripUserHeaders(req);

  if (isPublicRoute(req.method, req.path)) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const { userId, email } = await verifyToken(token);
    req.userId = userId;
    req.userEmail = email;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};
