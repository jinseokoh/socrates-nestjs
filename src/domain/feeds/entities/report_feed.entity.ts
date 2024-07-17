import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';

// a user can abhor feed
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class ReportFeed {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public feedId: number;

  @Column({ length: 32, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.feedsReported)
  public user: User;

  @ManyToOne(() => Feed, (feed) => feed.userReports)
  public feed: Feed;
}
