import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import { PaginateQueryOptions } from 'src/common/decorators/paginate-query-options.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { CreateLedgerDto } from 'src/domain/ledgers/dto/create-ledger.dto';
import { UpdateLedgerDto } from 'src/domain/ledgers/dto/update-ledger.dto';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { LedgersService } from 'src/domain/ledgers/ledgers.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('ledgers')
export class LedgersController {
  constructor(private readonly ledgersService: LedgersService) {}

  //? ----------------------------------------------------------------------- //
  //? CREATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Ledger 생성' })
  @Post()
  async create(
    @CurrentUserId() id: number,
    @Body() dto: CreateLedgerDto,
  ): Promise<Ledger> {
    const userId = dto.userId ? dto.userId : id;
    const createLedgerDto = { ...dto, userId };
    if (dto.debit) {
      return await this.ledgersService.debit(createLedgerDto);
    } else {
      return await this.ledgersService.credit(createLedgerDto);
    }
  }

  //? ----------------------------------------------------------------------- //
  //? READ
  //? ----------------------------------------------------------------------- //

  @Public()
  @ApiOperation({ description: 'Ledger 리스트 w/ Pagination' })
  @PaginateQueryOptions()
  @Get()
  async getLedgers(
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Ledger>> {
    return await this.ledgersService.findAll(query);
  }

  @ApiOperation({ description: 'Ledger 상세보기' })
  @Get(':id')
  async getLedgerById(@Param('id', ParseIntPipe) id: number): Promise<Ledger> {
    return await this.ledgersService.findById(id, ['user']);
  }

  //? ----------------------------------------------------------------------- //
  //? UPDATE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Ledger 갱신' })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLedgerDto,
  ): Promise<Ledger> {
    return await this.ledgersService.update(id, dto);
  }

  //? ----------------------------------------------------------------------- //
  //? DELETE
  //? ----------------------------------------------------------------------- //

  @ApiOperation({ description: 'Ledger soft 삭제' })
  @Delete(':id')
  async softRemove(@Param('id', ParseIntPipe) id: number): Promise<Ledger> {
    return await this.ledgersService.softRemove(id);
  }
}
