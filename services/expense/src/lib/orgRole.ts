import http from 'http';
import { Role } from '@app/types';

const USER_ORG_SERVICE_URL = process.env.USER_ORG_SERVICE_URL ?? 'http://user-org:3002';

export const getOrgRole = (authUserId: string, orgId: string): Promise<Role | null> => {
  return new Promise((resolve, reject) => {
    const url = new URL(`/internal/users/${authUserId}/role?orgId=${orgId}`, USER_ORG_SERVICE_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: `${url.pathname}${url.search}`,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 404) return resolve(null);
        try {
          const body = JSON.parse(data);
          resolve(body.role as Role ?? null);
        } catch {
          reject(new Error('Failed to parse role response'));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

export const requireOrgRole = async (
  authUserId: string,
  orgId: string,
  allowedRoles: Role[],
): Promise<Role> => {
  const role = await getOrgRole(authUserId, orgId);
  if (!role) throw new Error('NOT_MEMBER');
  if (!allowedRoles.includes(role)) throw new Error('INSUFFICIENT_ROLE');
  return role;
};
