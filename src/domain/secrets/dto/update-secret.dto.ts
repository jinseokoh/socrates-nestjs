import { PartialType } from '@nestjs/swagger';
import { CreateSecretDto } from 'src/domain/secrets/dto/create-secret.dto';
export class UpdateSecretDto extends PartialType(CreateSecretDto) {}
