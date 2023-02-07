import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { MeetupsController } from 'src/domain/meetups/meetups.controller';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { User } from 'src/domain/users/entities/user.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Meetup, User])],
  exports: [MeetupsService],
  providers: [MeetupsService],
  controllers: [MeetupsController],
})
export class MeetupsModule {}
