import { scamAnalyzer } from '../services/scamAnalyzer.js';
import { sendSuccess } from '../utils/response.js';

export async function checkScam(req, res, next) {
  try {
    const { message } = req.body;
    const analysis = await scamAnalyzer.analyzeMessage(message);
    return sendSuccess(res, {
      analysis,
      ...analysis,
    });
  } catch (err) {
    next(err);
  }
}
