import { IsNumber, IsString } from "class-validator";

export class SwapExecuteDto{

    @IsString()
    fromToken: string;

    @IsString()
    toToken: string;

    @IsNumber()
    amount: number;
}