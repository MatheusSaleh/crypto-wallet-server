import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SwapQuoteDto } from './dto/swap-quote.dto';
import { SwapService } from './swap.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SwapExecuteDto } from './dto/swap-execute.dto';

@Controller('swap')
export class SwapController {

    constructor(private swapService: SwapService) {
        
    }

    @Get('quote')
    quote(@Query() query: SwapQuoteDto) {
        return this.swapService.getQuote(query);
    }

    @Post()
    execute(
        @CurrentUser() user,
        @Body() data: SwapExecuteDto
    ){
        return this.swapService.executeSwap(user.userId, data)
    }
}
