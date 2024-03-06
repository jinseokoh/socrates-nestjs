export enum PleaStatus {
  INIT = 'init', // 요청보냄
  PENDING = 'pending', // 요청답변작성 > friendship 발송 (from recipient to sender)
  DENIED = 'denied', // 요청답변거절 > sender 에게 reward - 1 환불
  ACCEPTED = 'accepted', // recipient 에게 reward 지급
  CANCELED = 'canceled', // sender 에게 reward - 1 환불
}
