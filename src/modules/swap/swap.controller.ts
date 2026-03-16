import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SwapQuoteDto } from './dto/swap-quote.dto';
import { SwapService } from './swap.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SwapExecuteDto } from './dto/swap-execute.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@Controller('swap')
@ApiTags('swap')
@ApiBearerAuth('access-token')
export class SwapController {

    constructor(private swapService: SwapService) {
        
    }

    @Get('quote')
    @ApiOperation({ summary: 'Obter Cotação'})
    quote(@Query() query: SwapQuoteDto) {
        return this.swapService.getQuote(query);
    }

    @Post()
    @ApiOperation({ summary: 'Realizar Operação de Swap'})
    execute(
        @CurrentUser() user,
        @Body() data: SwapExecuteDto
    ){
        return this.swapService.executeSwap(user.userId, data)
    }
}
