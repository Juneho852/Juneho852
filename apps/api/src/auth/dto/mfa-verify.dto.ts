import { IsOptional, IsString } from 'class-validator';

export class MfaVerifyDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  token: string;
}
