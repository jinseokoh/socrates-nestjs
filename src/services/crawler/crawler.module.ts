import { Module } from '@nestjs/common';
import { CrawlerService } from 'src/services/crawler/crawler.service';

@Module({
  providers: [CrawlerService],
  exports: [CrawlerService],
})
export class CrawlerModule {}
