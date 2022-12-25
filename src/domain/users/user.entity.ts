import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Role } from 'src/common/enums';
import { Game } from 'src/domain/games/game.entity';
import { Profile } from 'src/domain/profiles/profile.entity';
import { Provider } from 'src/domain/providers/provider.entity';
import { Survey } from 'src/domain/surveys/survey.entity';
import {
  BaseEntity,
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
@Entity() //? 사용자
export class User extends BaseEntity {
  @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
  @ApiProperty({ description: 'id' })
  id: number;

  @Column({ length: 32, unique: true, nullable: true })
  @ApiProperty({ description: 'username' })
  username: string | null;

  @Column({ length: 32, unique: true, nullable: true })
  @ApiProperty({ description: 'phone' })
  phone: string | null;

  @Column({ length: 64, unique: true })
  @ApiProperty({ description: 'email' })
  email: string;

  @Exclude()
  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'password' })
  password: string | null;

  @Column({ length: 32, nullable: true })
  @ApiProperty({ description: 'realname' })
  realname: string | null;

  @Column({ length: 1, nullable: true })
  @ApiProperty({ description: 'gender' })
  gender: string | null;

  @Column({ nullable: true })
  @ApiProperty({ description: 'dob' })
  dob: Date;

  @Column({
    length: 255,
    nullable: true,
    default: 'https://cdn.fleaauction.world/images/user.png',
  })
  @ApiProperty({ description: 'avatar' })
  avatar: string | null;

  @Column({ length: 255, nullable: true })
  @ApiProperty({ description: 'pushToken' })
  pushToken: string | null;

  @Exclude()
  @Column({ length: 64, nullable: true })
  @ApiProperty({ description: 'refreshTokenHash' })
  refreshTokenHash: string | null;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  @ApiProperty({ description: 'role' })
  role: Role;

  @Column({ default: false })
  @ApiProperty({ description: 'isActive' })
  isActive: boolean;

  @Column({ default: false })
  @ApiProperty({ description: 'isBanned' })
  isBanned: boolean;

  @Column({ type: 'datetime', nullable: true })
  @ApiProperty({ description: 'usernamedAt' })
  usernamedAt: Date | null;

  @CreateDateColumn()
  @ApiProperty({ description: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn()
  @ApiProperty({ description: 'updatedAt' })
  updatedAt: Date;

  @DeleteDateColumn()
  @ApiProperty({ description: 'deletedAt' })
  deletedAt: Date | null;

  //**--------------------------------------------------------------------------*/
  //** 1-to-1 hasOne

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: ['insert', 'update'],
  })
  profile: Profile;

  //**--------------------------------------------------------------------------*/
  //** 1-to-many hasMany

  @OneToMany(() => Survey, (survey) => survey.user, {
    // cascade: ['insert', 'update'],
  })
  surveys: Survey[];

  @OneToMany(() => Provider, (provider) => provider.user, {
    // cascade: ['insert', 'update'],
  })
  providers: Provider[];

  @OneToMany(() => Game, (game) => game.user, {
    // cascade: ['insert', 'update'],
  })
  games: Game[];

  //**--------------------------------------------------------------------------*/
  //** many-to-many
}
