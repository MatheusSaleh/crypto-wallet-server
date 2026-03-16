import { Controller, Get, Query } from '@nestjs/common';
import { LedgerService } from './ledger.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('ledger')
@ApiTags('ledger')
export class LedgerController {

    constructor(private ledgerService: LedgerService){}

    @Get()
    @ApiOperation({ summary: 'Listar Ledger'})
    getLedger(
        @CurrentUser() user,
        @Query() pagination: PaginationDto
    ){
        return this.ledgerService.getLedger(user.userId, pagination);
    }
}
