export enum Ledger {
  // DEBIT (차변: 코인증가, 증가원인)
  DEBIT_PRESENT = 'debitPresent', // 코인선물수신
  DEBIT_REWARD = 'debitReward', // 코인보너스지급
  DEBIT_PURCHASE = 'debitPurchase', // 코인구매
  // CREDIT (대변: 코인감소, 사용원인)
  CREDIT_PRESENT = 'creditPresent', // 코인선물전송(기부금)
  CREDIT_SPEND = 'creditSpend', // 서비스 이용
  CREDIT_REVOKE = 'creditRevoke', // 코인구매취소
}
