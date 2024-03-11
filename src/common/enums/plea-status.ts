export enum PleaStatus {
  INIT = 'init', // 요청접수 > sender 에게 reward 차감
  // DENIED = 'denied', // 요청거절 > sender 에게 reward - 1 환불, 이 부분은 상태변경하지 않고 init 에서 바로 삭제하기로
  PENDING = 'pending', // 요청수락 > friendship 발송 (from recipient to sender)
  // CANCELED = 'canceled', // 친구거절 > sender 에게 reward - 1 환불, 이 부분은 상태변경 하지않고 pending 에서 바로 삭제하기로
  ACCEPTED = 'accepted', // 친구등록 > recipient 에게 reward 지급
}
