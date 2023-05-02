import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { MatchsController } from 'src/domain/meetups/meetup-users.controller';
import { MeetupsController } from 'src/domain/meetups/meetups.controller';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { ViewCountMiddleware } from 'src/domain/meetups/middlewares/view-count.middleware';
import { User } from 'src/domain/users/entities/user.entity';
import { Venue } from 'src/domain/venues/entities/venue.entity';
import { S3Module } from 'src/services/aws/s3.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Meetup, Venue, Category, User]),
    S3Module,
  ],
  exports: [MeetupsService],
  providers: [MeetupsService],
  controllers: [MeetupsController, MatchsController],
})
export class MeetupsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ViewCountMiddleware)
      .forRoutes({ path: 'meetups/*', method: RequestMethod.GET });
  }
}
