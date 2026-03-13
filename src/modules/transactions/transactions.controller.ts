import { Controller, Get, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Controller('transactions')
export class TransactionsController {

    constructor(private transactionsService: TransactionsService){}

    @Get()
    getTransactions(
        @CurrentUser() user,
        @Query() pagination: PaginationDto
    ){
        return this.transactionsService.getTransactions(
            user.userId, pagination
        )
    };
}
