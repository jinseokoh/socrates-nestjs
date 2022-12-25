import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/domain/profiles/profile.entity';
import { User } from 'src/domain/users/user.entity';
import { UsersController } from 'src/domain/users/users.controller';
import { UsersService } from 'src/domain/users/users.service';
import { S3Module } from 'src/services/aws/s3.module';
import { CrawlerModule } from 'src/services/crawler/crawler.module';
import { IamportModule } from 'src/services/iamport/iamport.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Profile]),
    IamportModule,
    S3Module,
    CrawlerModule,
  ],
  exports: [UsersService],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
