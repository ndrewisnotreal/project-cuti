import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpsertBalanceDto {
  @ApiProperty({ example: '10000000-0000-0000-0000-000000000001' })
  @IsString()
  uid_user_system!: string;

  @ApiProperty({ example: 2026 })
  @IsInt()
  @Min(2020)
  year!: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @IsInt()
  @Min(0)
  annual_quota?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  carry_over_days?: number;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsString()
  carry_over_expiry_date?: string;
}
