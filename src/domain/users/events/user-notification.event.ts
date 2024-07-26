import { IData } from 'src/common/interfaces';

export class UserNotificationEvent {
  name:
    | 'userBookmark'
    | 'meetupBookmark'
    | 'meetupComment'
    | 'meetupRequest'
    | 'meetupRequestApproval'
    | 'meetupInviteApproval'
    | 'chatOpen'
    | 'feedBookmark'
    | 'feedComment'
    | 'feedPlea'
    | 'feedPleaDenial'
    | 'inquiryComment'
    | 'friendRequest'
    | 'friendRequestApproval'
    | 'friendRequestDenial'
    | 'eventNotification';
  userId: number; // 수신 대상 사용자 아이디
  token: string | null; // 수신 대상 사용자 토큰
  options: object; // 보낼지 말지 결정하기 위한 사용자 profile options 상태 전달용
  body: string;
  data: IData;
}
