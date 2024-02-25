import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { Paginate, PaginateQuery, Paginated } from 'nestjs-paginate';
import { Ledger } from 'src/domain/ledgers/entities/ledger.entity';
import { UsersLedgerService } from 'src/domain/users/users-ledger.service';

@UseInterceptors(ClassSerializerInterceptor)
@SkipThrottle()
@Controller('users')
export class UserLedgersController {
  constructor(private readonly usersService: UsersLedgerService) {}

  //?-------------------------------------------------------------------------//
  //? Create
  //?-------------------------------------------------------------------------//

  // @ApiOperation({ description: '나의 관심사 리스트에 추가' })
  // @Post(':userId/categories')
  // async create(
  //   @Param('userId') userId: number,
  //   @Body() dto: CreateLedgerDto,
  // ): Promise<Ledger> {
  //   return new Ledger();
  // }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: '나의 ledger 리스트' })
  @Get(':userId/ledgers')
  async getLedgers(
    @Param('userId', ParseIntPipe) userId: number,
    @Paginate() query: PaginateQuery,
  ): Promise<Paginated<Ledger>> {
    return await this.usersService.getUserLedgers(userId, query);
  }

  //?-------------------------------------------------------------------------//
  //? Delete
  //?-------------------------------------------------------------------------//

  // @ApiOperation({ description: '나의 관심사 리스트에서 삭제' })
  // @PaginateQueryOptions()
  // @Delete(':userId/categories')
  // async delete(
  //   @Param('userId') userId: number,
  //   @Body('ids') ids: number[],
  // ): Promise<Array<Interest>> {
  //   try {
  //     return await this.usersService.removeLedger(userId, ids);
  //   } catch (e) {
  //     throw new BadRequestException();
  //   }
  // }
}
