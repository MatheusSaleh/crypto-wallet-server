import { Controller, Get, Query } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('ledger')
export class LedgerController {

    constructor(private ledgerService: LedgerService){}

    @Get()
    getLedger(
        @CurrentUser() user,
        @Query() pagination: PaginationDto
    ){
        return this.ledgerService.getLedger(user.userId, pagination);
    }
}
