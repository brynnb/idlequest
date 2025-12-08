/**
 * Types related to account rewards
 * Based on the account_rewards table in the database
 */

/**
 * Represents an account reward from the database
 */
export interface AccountRewards {
  account_id: number;
  reward_id: number;
  amount: number;
  claim_count: number;
}

/**
 * Represents a simplified view of account rewards
 */
export interface SimpleAccountReward {
  rewardId: number;
  amount: number;
  claimCount: number;
}

/**
 * Converts an AccountRewards object to a SimpleAccountReward object
 */
export function toSimpleAccountReward(
  accountRewards: AccountRewards
): SimpleAccountReward {
  return {
    rewardId: accountRewards.reward_id,
    amount: accountRewards.amount,
    claimCount: accountRewards.claim_count,
  };
}
