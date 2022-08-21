import { PartialType } from '@nestjs/swagger';
import { CreateAuctionDto } from 'src/domain/auctions/dto/create-auction.dto';
export class UpdateAuctionDto extends PartialType(CreateAuctionDto) {}
