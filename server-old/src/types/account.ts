/**
 * Types related to user accounts
 */

export interface Account {
  id: number;
  name: string;
  charname: string;
  sharedplat: number;
  password: string;
  status: number;
  lsaccount_id: number | null;
  gmspeed: number;
  revoked: number;
  karma: number;
  minilogin_ip: string;
  hideme: number;
  rulesflag: number;
  suspendeduntil: string;
  time_creation: number;
  expansion: number;
  ban_reason: string | null;
  suspend_reason: string | null;
  active: number;
  ip_exemption_multiplier: number;
  gminvul: number;
  flymode: number;
  ignore_tells: number;
  mule: number;
}

export interface AccountFlags {
  account_id: number;
  flag: string;
  value: string;
}

export interface AccountIP {
  account_id: number;
  ip: string;
  count: number;
  lastused: string;
}

export interface AccountRewards {
  account_id: number;
  reward_id: number;
  amount: number;
  claim_count: number;
}
