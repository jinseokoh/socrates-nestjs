import { PartialType } from '@nestjs/swagger';
import { CreateLedgerDto } from 'src/domain/ledgers/dto/create-ledger.dto';
export class UpdateLedgerDto extends PartialType(CreateLedgerDto) {}
