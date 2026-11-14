import { sendSuccess } from '../utils/response.js';

export function getHealth(req, res) {
  return sendSuccess(res, {
    status: 'ok',
    service: 'guardianpay-backend',
    timestamp: new Date().toISOString(),
  });
}
