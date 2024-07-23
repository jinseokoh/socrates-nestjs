import { INITIAL_BONUS_COIN } from 'src/common/constants';
import { LedgerType } from 'src/common/enums';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Withdrawal } from 'src/domain/users/entities/widthdrawal.entity';
import {
  DataSource,
  EntitySubscriberInterface,
  EventSubscriber,
  InsertEvent,
} from 'typeorm';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
  constructor(dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  listenTo(): any {
    return User;
  }

  //! https://github.com/typeorm/typeorm/issues/3563
  //! you need to use the same entityManager instance because of transactions.
  //! which means event.manager. not event.connection.manager.
  async afterInsert(event: InsertEvent<User>) {
    await event.manager
      .createQueryBuilder()
      .insert()
      .into(Profile)
      .values([
        {
          userId: event.entity.id,
          options: {
            meetupBookmark: false, // 모임 찜
            meetupMeetupComment: false, // 모임 댓글
            meetupRequest: false, // 모임신청
            meetupRequestApproval: false, // 모임신청 승인
            meetupInviteApproval: false, // 모임초대 승인
            meetupChatOpen: false, // 모임 채팅방 오픈
            feedBookmark: false, // 발견 공감
            feedFeedComment: false, // 발견 댓글
            feedPlea: false, // 친구신청 발견글 요청
            feedPleaDenial: false, // 친구신청 발견글 요청 거절
            friendRequest: false, // 친구 신청
            friendRequestApproval: false, // 친구신청 승인
            friendRequestDenial: false, // 친구신청 거절
            eventNotification: false,
          },
        },
      ])
      .execute();

    const row = await event.manager
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from(Withdrawal, 'withdrawal')
      .where('withdrawal.providerId = :providerId', {
        providerId: event.entity.pushToken,
      })
      .getRawOne();
    const isRejoinedUserAfterWithdrawal = parseInt(row.count) > 0;

    if (!isRejoinedUserAfterWithdrawal) {
      await event.manager
        .createQueryBuilder()
        .insert()
        .into(Ledger)
        .values([
          {
            debit: INITIAL_BONUS_COIN,
            balance: INITIAL_BONUS_COIN,
            ledgerType: LedgerType.DEBIT_EVENT,
            note: `가입축하 ${INITIAL_BONUS_COIN}코인 지급`,
            userId: event.entity.id,
          },
        ])
        .execute();
    } else {
      // welcome back. but no apples this time.
    }
  }
}
