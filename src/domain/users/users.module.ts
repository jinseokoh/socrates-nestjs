import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from 'src/domain/users/entities/profile.entity';
import { User } from 'src/domain/users/entities/user.entity';
import { UsersController } from 'src/domain/users/users.controller';
import { UsersService } from 'src/domain/users/users.service';
import { S3Module } from 'src/services/aws/s3.module';
import { CrawlerModule } from 'src/services/crawler/crawler.module';
@Module({
  imports: [TypeOrmModule.forFeature([User, Profile]), S3Module, CrawlerModule],
  exports: [UsersService],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
