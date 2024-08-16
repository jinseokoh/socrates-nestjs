import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

//? a User can bookmark Feed
//? 모델사용을 위해, many-to-many 대신 one-to-many 선호
//? https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_feed_id_key', ['userId', 'feedId'])
export class BookmarkUserFeed {
  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  feedId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.feedBookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => Feed, (feed) => feed.bookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public feed: Feed;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<BookmarkUserFeed>) {
    Object.assign(this, partial);
  }
}
