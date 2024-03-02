export enum PleaStatus {
  INIT = 'init', // 친구신청 보류
  RECIPIENT_DENIED = 'recipientDenied', // sender reward-1 환불
  RECIPIENT_ACCEPTED = 'recipientAccepted', // from recipient to sender friendship 발송
  SENDER_DENIED = 'senderDenied', // sender reward-1 환불
  SENDER_ACCEPTED = 'senderAccepted', // recipient 에게 reward 지급
  RECIPIENT_EARLY_CANCELED = 'recipientEarlyCanceled', // friendship 1주일 이내 단절 => recipient 로부터 reward 삭제
}
