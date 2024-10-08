import { Exclude } from 'class-transformer';
import { User } from 'src/domain/users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
@Unique('provider_name_provider_id_key', ['providerName', 'providerId'])
export class Provider {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  @Column({ length: 16, nullable: true })
  providerName: string | null;

  @Column({ length: 128, nullable: true })
  providerId: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //**--------------------------------------------------------------------------*/
  //** many-to-1 belongsTo

  @Column({ type: 'int', unsigned: true })
  userId: number; // to make it available to Repository.

  @ManyToOne(() => User, (user) => user.providers, {
    onDelete: 'CASCADE', // delete this as well when user is being deleted
  })
  user: User;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Provider>) {
    Object.assign(this, partial);
  }
}
