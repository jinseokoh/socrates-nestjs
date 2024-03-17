export class UserNotificationEvent {
  name:
    | 'meetupLike'
    | 'meetupThread'
    | 'friendRequest'
    | 'meetupRequest'
    | 'meetupChatOpen'
    | 'connectionRemark'
    | 'connectionReaction'
    | 'friendMeetupSubmit'
    | 'meetupInviteApproval'
    | 'friendRequestApproval'
    | 'friendRequestPlea'
    | 'meetupRequestApproval'
    | 'friendConnectionSubmit';
  token: string | null;
  options: object;
  body: string;
}
