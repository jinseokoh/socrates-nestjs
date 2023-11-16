import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Content } from './entities/content.entity';
import { ContentsController } from 'src/domain/contents/contents.controller';
import { ContentsService } from 'src/domain/contents/contents.service';
import { ViewCountMiddleware } from 'src/domain/contents/middlewares/view-count.middleware';
@Module({
  imports: [TypeOrmModule.forFeature([Content])],
  providers: [ContentsService],
  controllers: [ContentsController],
})
export class ContentsModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(ViewCountMiddleware)
  //     .forRoutes({ path: 'contents/*', method: RequestMethod.GET });
  // }
}
