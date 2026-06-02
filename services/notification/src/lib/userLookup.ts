import http from 'http';

const USER_ORG_SERVICE_URL = process.env.USER_ORG_SERVICE_URL ?? 'http://user-org:3002';

export interface ResolvedUser {
  authUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

// Resolve a user's email (and name) from user-org's internal endpoint.
export const resolveUser = (authUserId: string): Promise<ResolvedUser> => {
  return new Promise((resolve, reject) => {
    const url = new URL(`/internal/users/${authUserId}`, USER_ORG_SERVICE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`user-org lookup failed (${res.statusCode}) for ${authUserId}`));
        }
        try {
          resolve(JSON.parse(data) as ResolvedUser);
        } catch {
          reject(new Error('Failed to parse user-org response'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};
