import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsString } from "class-validator";

export class SwapQuoteDto {

    @IsString()
    @ApiProperty()
    fromToken: string

    @IsString()
    @ApiProperty()
    toToken: string 

    @IsNumber()
    @ApiProperty()
    amount: number 
}