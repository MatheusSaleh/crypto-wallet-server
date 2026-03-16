import { Controller, Get, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('transactions')
@ApiTags('transactions')
export class TransactionsController {

    constructor(private transactionsService: TransactionsService){}

    @Get()
    @ApiOperation({summary: 'Listar Transações'})
    getTransactions(
        @CurrentUser() user,
        @Query() pagination: PaginationDto
    ){
        return this.transactionsService.getTransactions(
            user.userId, pagination
        )
    };
}
