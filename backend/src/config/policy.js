import { POLICY_ACTION, RISK_LEVEL } from './constants.js';

export const POLICY_RULES = [
  {
    minScore: 0,
    maxScore: 29,
    level: RISK_LEVEL.LOW,
    action: POLICY_ACTION.ALLOW,
    description: 'Low threat evaluation; instant dual-entry settlement authorized.',
  },
  {
    minScore: 30,
    maxScore: 59,
    level: RISK_LEVEL.MEDIUM,
    action: POLICY_ACTION.STEP_UP,
    description: 'Elevated anomaly signature; requires step-up PIN authorization.',
  },
  {
    minScore: 60,
    maxScore: 84,
    level: RISK_LEVEL.HIGH,
    action: POLICY_ACTION.HOLD,
    description: 'Substantial fraud probability; transaction held in quarantine for SecOps review.',
  },
  {
    minScore: 85,
    maxScore: 100,
    level: RISK_LEVEL.CRITICAL,
    action: POLICY_ACTION.BLOCK,
    description: 'Critical malicious pattern intercepted; transaction blocked to preserve capital.',
  },
];

export function getPolicyForScore(score) {
  const normalized = Math.max(0, Math.min(100, Math.round(score)));
  for (const rule of POLICY_RULES) {
    if (normalized >= rule.minScore && normalized <= rule.maxScore) {
      return {
        score: normalized,
        level: rule.level,
        action: rule.action,
        description: rule.description,
      };
    }
  }
  return {
    score: normalized,
    level: RISK_LEVEL.CRITICAL,
    action: POLICY_ACTION.BLOCK,
    description: 'Maximum risk boundary exceeded; transfer blocked.',
  };
}
