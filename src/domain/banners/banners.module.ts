import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BannersController } from 'src/domain/banners/banners.controller';
import { BannersService } from 'src/domain/banners/banners.service';
import { S3Module } from 'src/services/aws/s3.module';
import { Banner } from './entities/banner.entity';
@Module({
  imports: [TypeOrmModule.forFeature([Banner]), S3Module],
  exports: [BannersService],
  providers: [BannersService],
  controllers: [BannersController],
})
export class BannersModule {}
