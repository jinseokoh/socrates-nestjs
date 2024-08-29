import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/domain/users/entities/user.entity';
import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';

//? 모델사용을 위해, many-to-many 대신 one-to-many 선호
//? https://github.com/typeorm/typeorm/issues/4653
@Entity()
@Unique('user_id_entity_type_entity_id_key', [
  'userId',
  'entityType',
  'entityId',
])
export class Bookmark {
  @PrimaryColumn({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository

  @PrimaryColumn({ length: 32, nullable: false })
  entityType: string;

  @PrimaryColumn({ type: 'int', unsigned: true })
  entityId: number;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.bookmarks, {
    nullable: false,
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user?: User;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Bookmark>) {
    Object.assign(this, partial);
  }
}
