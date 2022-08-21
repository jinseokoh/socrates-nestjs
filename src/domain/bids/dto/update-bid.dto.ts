import { PartialType } from '@nestjs/swagger';
import { CreateBidDto } from 'src/domain/bids/dto/create-bid.dto';
export class UpdateBidDto extends PartialType(CreateBidDto) {}
