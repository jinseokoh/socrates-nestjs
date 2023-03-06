import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  Post,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { VenuesService } from 'src/domain/venues/venues.service';

@UseInterceptors(ClassSerializerInterceptor)
@Controller('venues')
export class VenuesController {
  constructor(private readonly venuesService: VenuesService) {}

  //?-------------------------------------------------------------------------//
  //? CREATE
  //?-------------------------------------------------------------------------//

  async create(dto: CreateVenueDto): Promise<Meetup> {
    const user = await this.userRepository.findOneOrFail({
      where: { id: dto.userId },
    });
    if (user.isBanned) {
      throw new BadRequestException(`not allowed to use`);
    }

    const meetup = await this.repository.save(this.repository.create(dto));
    await this._linkWithCategory(dto.category, meetup.id);
    await this._linkWithRegion(dto.category, meetup.id);

    return meetup;
  }

  //?-------------------------------------------------------------------------//
  //? READ
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'return all trees' })
  @Get('')
  async getAllVenues(): Promise<any> {
    return await this.venuesService.findAll();
  }

  @ApiOperation({ description: 'return sub-trees' })
  @Get(':slug')
  async getBySlug(@Param('slug') slug: string): Promise<any> {
    return await this.venuesService.findBySlug(slug);
  }

  //?-------------------------------------------------------------------------//
  //? SEED
  //?-------------------------------------------------------------------------//

  @ApiOperation({ description: 'seed venues' })
  @Post('seed')
  async category(): Promise<void> {
    return await this.venuesService.seedCategory();
  }
}
