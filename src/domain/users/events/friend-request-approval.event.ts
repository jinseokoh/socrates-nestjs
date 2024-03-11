export class FriendRequestApprovalEvent {
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
    | 'friendRequestFeedback'
    | 'meetupRequestApproval'
    | 'friendConnectionSubmit';
  token: string | null;
  options: object;
  body: string;
}
