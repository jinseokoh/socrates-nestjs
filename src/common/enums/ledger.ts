export enum Ledger {
  // DEBIT (차변: 코인증가, 증가원인)
  DEBIT_GIFT = 'debitGift', // 코인선물수신
  DEBIT_PURCHASE = 'debitPurchase', // 코인구매
  DEBIT_REWARD = 'debitReward', // 코인보너스지급
  // CREDIT (대변: 코인감소, 사용원인)
  CREDIT_GIFT = 'creditGift', // 코인선물전송(기부금)
  CREDIT_REVOKE = 'creditRevoke', // 코인구매취소
  CREDIT_SPEND = 'creditSpend', // 서비스 이용
}
