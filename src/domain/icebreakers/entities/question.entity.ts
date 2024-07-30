import { ApiProperty } from '@nestjs/swagger';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Question {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: false })
  category: string;

  @Column({ length: 255, nullable: false })
  @ApiProperty({ description: 'body' })
  body: string;

  @Column({ default: false })
  @ApiProperty({ description: 'is anonymous' })
  isAnonymous: boolean;

  @Column({ type: 'int', unsigned: true, default: 0 })
  answerCount: number;

  @Column({ type: 'int', unsigned: true, default: 0 })
  @ApiProperty({ description: 'flag count' })
  flagCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date | null;

  //? ----------------------------------------------------------------------- //
  //? many-to-many (belongsToMany) using 1-to-many (hasMany)

  // @OneToMany(() => Answer, (answer) => answer.question)
  // public answers: Answer[];

  //? ----------------------------------------------------------------------- //
  //? many-to-1 (belongsTo)

  @Column({ type: 'int', unsigned: true, default: null })
  userId: number | null; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.questions, {})
  user: User | null;

  //? ----------------------------------------------------------------------- //
  //? constructor

  constructor(partial: Partial<Question>) {
    Object.assign(this, partial);
  }
}

/*
update `question` set help='선호' where slug='love';
update `question` set help='가치관' where slug='wow';
update `question` set help='경험' where slug='cool';
update `question` set help='최근' where slug='saint';
update `question` set help='일상' where slug='yes';
update `question` set help='가설' where slug='pirate';
update `question` set help='논란' where slug='devil';
*/
