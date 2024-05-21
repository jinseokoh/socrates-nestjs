import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { HttpCacheInterceptor } from 'src/common/interceptors/http-cache.interceptor';
import { LanguagesService } from 'src/domain/languages/languages.service';

@UseInterceptors(ClassSerializerInterceptor, HttpCacheInterceptor)
@Controller('languages')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'return all trees' })
  @Get('')
  async getAllLanguages(): Promise<any> {
    return await this.languagesService.findAll();
  }

  @ApiOperation({ description: 'return sub-trees' })
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<any> {
    return await this.languagesService.findBySlug(slug);
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'seed languages' })
  @Post('seed')
  async category(): Promise<void> {
    return await this.languagesService.seedLanguages();
  }
}
