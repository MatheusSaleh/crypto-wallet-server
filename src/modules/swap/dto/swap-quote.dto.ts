import { IsNumber, IsString } from "class-validator";

export class SwapQuoteDto {

    @IsString()
    fromToken: string

    @IsString()
    toToken: string 

    @IsNumber()
    amount: number 
}