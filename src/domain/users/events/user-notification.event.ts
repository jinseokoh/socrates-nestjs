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
  token: string | null;
  options: object;
  body: string;
}
