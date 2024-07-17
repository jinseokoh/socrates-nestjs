import { Feed } from 'src/domain/feeds/entities/feed.entity';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';

// a user can bookmark feed
//? Like 모델 사용을 위해서, many to many 대신 이 방식으로 사용하는 것 추천
// https://github.com/typeorm/typeorm/issues/4653
@Entity()
export class Link {
  @PrimaryColumn({ type: 'int', unsigned: true })
  public feedId: number;

  @PrimaryColumn({ type: 'int', unsigned: true })
  public linkContentId: number;

  @Column({ length: 16, nullable: false })
  entity: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.meetupsLiked, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public user: User;

  @ManyToOne(() => Feed, (feed) => feed.usersBookmarked, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  public feed: Feed;
}
