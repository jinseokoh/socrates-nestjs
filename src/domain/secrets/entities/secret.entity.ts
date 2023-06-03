import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity()
export class Secret {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  id: number;

  // apply unique constraint there
  @Column({ length: 64, unique: true })
  key: string;

  @Column({ length: 8, nullable: true })
  otp: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  //??--------------------------------------------------------------------------*/
  //?? constructor

  constructor(partial: Partial<Secret>) {
    Object.assign(this, partial);
  }
}
