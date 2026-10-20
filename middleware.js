import { next, ipAddress } from '@vercel/functions';
import { createGate } from './lib/access.mjs';

export const config = { runtime: 'nodejs', matcher: '/:path*' };
export default createGate({ next, getIp: ipAddress });
