import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, Paginated, PaginateQuery } from 'nestjs-paginate';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { CreateSecretDto } from 'src/domain/secrets/dto/create-secret.dto';
import { UpdateSecretDto } from 'src/domain/secrets/dto/update-secret.dto';
import { Secret } from 'src/domain/secrets/entities/secret.entity';
import { SecretsService } from 'src/domain/secrets/secrets.service';

//! @deprecated
//! 직접 호출하는 사용하는 곳 없고 대신 users/{id}/otp 이런식으로 사용
@Controller('secrets')
export class SecretsController {
  constructor(private readonly secretsService: SecretsService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'OTP 생성' })
  @Post()
  async create(@Body() dto: CreateSecretDto): Promise<Secret> {
    return await this.secretsService.create(dto);
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'OTP 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getSecrets(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Secret>> {
    return await this.secretsService.findAll(query);
  }

  @ApiOperation({ description: 'OTP 상세보기' })
  @Get(':id')
  async getSecretsById(@Param('id') id: string): Promise<Secret> {
    return await this.secretsService.findByKey(id);
  }

  //?-------------------------------------------------------------------------//
  //? UPDATE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'OTP 수정' })
  @Patch(':id')
  async update(
    @Param('id') id: number,
    @Body() dto: UpdateSecretDto,
  ): Promise<Secret> {
    return await this.secretsService.update(id, dto);
  }

  //?-------------------------------------------------------------------------//
  //? DELETE
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'OTP 삭제' })
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<Secret> {
    return await this.secretsService.remove(id);
  }
}
