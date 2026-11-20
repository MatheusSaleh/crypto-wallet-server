import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNumber, IsPositive, IsString } from "class-validator";

export class SwapQuoteDto {

    @IsString()
    @ApiProperty()
    fromToken: string

    @IsString()
    @ApiProperty()
    toToken: string 

    // Query string chega como texto: converte para number antes de validar
    @Type(() => Number)
    @IsNumber()
    @IsPositive()
    @ApiProperty()
    amount: number 
}
