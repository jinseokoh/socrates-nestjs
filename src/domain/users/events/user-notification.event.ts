export class UserNotificationEvent {
  name:
    | 'meetupLike'
    | 'meetupThread'
    | 'friendRequest'
    | 'meetupRequest'
    | 'meetupRequestApproval'
    | 'meetupInviteApproval'
    | 'meetupChatOpen'
    | 'connectionReaction'
    | 'connectionRemark'
    | 'friendRequest'
    | 'friendRequestApproval'
    | 'friendRequestPlea';
  token: string | null; // 누구에게 보낼지
  options: object; // 보낼지 말지 결정하기 위한 사용자 profile options 상태 전달용
  body: string;
  data: { [key: string]: string };
}
