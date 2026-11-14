import { getPolicyForScore } from '../config/policy.js';
import { POLICY_ACTION } from '../config/constants.js';

export class PolicyService {
  determineAction(score) {
    const policy = getPolicyForScore(score);

    let userFacingMessage = '';
    switch (policy.action) {
      case POLICY_ACTION.ALLOW:
        userFacingMessage = 'Payment cleared instantly through automated verification.';
        break;
      case POLICY_ACTION.STEP_UP:
        userFacingMessage = 'Elevated transaction anomaly detected. Please confirm your PIN within 5 minutes to authorize settlement.';
        break;
      case POLICY_ACTION.HOLD:
        userFacingMessage = 'Transfer held in security quarantine for analyst verification. Funds are reserved safely.';
        break;
      case POLICY_ACTION.BLOCK:
        userFacingMessage = 'High-severity fraud pattern detected. Transfer has been rejected to protect account security.';
        break;
    }

    return {
      ...policy,
      userFacingMessage,
    };
  }
}

export const policyService = new PolicyService();
