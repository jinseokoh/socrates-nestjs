import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

// a User can report Feed
// 모델사용을 위해, many-to-many 대신 one-to-many 선호
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class UserFeedReport {
  @PrimaryGeneratedColumn('increment', { type: 'int', unsigned: true })
  id: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  userId: number;

  //? unsigned int 로 사용하기 위해 명시적인 정의가 필요.
  @Column({ type: 'int', unsigned: true })
  feedId: number;

  @Column({ length: 80, nullable: true })
  message: string | null;

  @ManyToOne(() => User, (user) => user.feedReports, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => Feed, (feed) => feed.reportedByUsers, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public feed: Feed;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<UserFeedReport>) {
    Object.assign(this, partial);
  }
}
