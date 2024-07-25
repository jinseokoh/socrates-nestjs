import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { CareersService } from 'src/domain/careers/careers.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('careers')
export class CareersController {
  constructor(private readonly careersService: CareersService) {}

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'return all trees' })
  @Get('')
  async getAllCareers(): Promise<any> {
    return await this.careersService.findAll();
  }

  @ApiOperation({ description: 'return sub-trees' })
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<any> {
    return await this.careersService.findBySlug(slug);
  }

  //? ----------------------------------------------------------------------- //
  //? SEED
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'seed careers' })
  @Post('seed')
  async career(): Promise<void> {
    return await this.careersService.seedCareer();
  }
}
