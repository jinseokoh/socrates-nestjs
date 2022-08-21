import { PartialType } from '@nestjs/swagger';
import { CreateProviderDto } from 'src/domain/providers/dto/create-provider.dto';
export class UpdateProviderDto extends PartialType(CreateProviderDto) {}
