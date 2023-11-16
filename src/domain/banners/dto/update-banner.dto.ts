import { PartialType } from '@nestjs/swagger';
import { CreateBannerDto } from 'src/domain/banners/dto/create-banner.dto';
export class UpdateBannerDto extends PartialType(CreateBannerDto) {}
