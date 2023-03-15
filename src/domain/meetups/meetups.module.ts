import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from 'src/domain/categories/entities/category.entity';
import { Meetup } from 'src/domain/meetups/entities/meetup.entity';
import { MeetupsController } from 'src/domain/meetups/meetups.controller';
import { MeetupsService } from 'src/domain/meetups/meetups.service';
import { ViewCountMiddleware } from 'src/domain/meetups/middlewares/view-count.middleware';
import { User } from 'src/domain/users/entities/user.entity';
import { VenuesModule } from 'src/domain/venues/venues.module';
@Module({
  imports: [TypeOrmModule.forFeature([Meetup, Category, User]), VenuesModule],
  exports: [MeetupsService],
  providers: [MeetupsService],
  controllers: [MeetupsController],
})
export class MeetupsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ViewCountMiddleware)
      .forRoutes({ path: 'meetups/*', method: RequestMethod.GET });
  }
}
