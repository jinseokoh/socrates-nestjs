export enum LedgerType {
  // DEBIT (차변: 코인증가, 증가원인)
  DEBIT_GIFT = 'debitGift', // 코인 선물 수신후 증가
  DEBIT_PURCHASE = 'debitPurchase', // 코인 구매후 증가
  DEBIT_REWARD = 'debitReward', // 코인 격려금 수신후 증가
  DEBIT_EVENT = 'debitEvent', // 코인 이벤트 보너스 수신후 증가
  // CREDIT (대변: 코인감소, 사용원인)
  CREDIT_GIFT = 'creditGift', // 코인 선물 전송후 감소
  CREDIT_CANCEL = 'creditCancel', // 코인 구매취소후 감소 (cancel purchase)
  CREDIT_REVOKE = 'creditRevoke', // 코인 요청격려금 박탈후 감소 (early frienship removal)
  CREDIT_ESCROW = 'creditEscrow', // 서비스 요청격려금 감소
  CREDIT_SPEND = 'creditSpend', // 서비스 이용후 감소
}
