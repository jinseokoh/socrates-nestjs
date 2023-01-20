import { Exclude } from 'class-transformer';
import { User } from 'src/domain/users/entities/user.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 사용자 소셜로그인 정보
@Unique('provider_name_provider_id_key', ['providerName', 'providerId'])
export class Provider extends BaseEntity {
  @Exclude()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 16, nullable: true })
  providerName: string | null;

  @Exclude()
  @Column({ length: 255, nullable: true })
  providerId: string | null;

  @Exclude()
  @CreateDateColumn()
  createdAt: Date;

  @Exclude()
  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Exclude()
  @Column({ type: 'uuid' })
  userId: string; // to make it available to Repository.
  @ManyToOne(() => User, (user) => user.providers, {
    // onDelete: 'SET NULL',
  })
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  // constructor(partial: Partial<Provider>) {
  //   Object.assign(this, partial);
  // }
}
