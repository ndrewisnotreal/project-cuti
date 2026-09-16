import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString, IsInt, IsOptional, IsString, Max, MaxLength, Min,
} from 'class-validator';

export class CreateLeaveRequestDto {
  @ApiPropertyOptional({ example: 'USR001' })
  @IsOptional()
  @IsString()
  uid_user_system?: string;

  @ApiProperty({ example: 'CT_TAHUNAN' })
  @IsString()
  @MaxLength(10)
  kd_leave_type!: string;

  @ApiPropertyOptional({ example: '10000000-0000-0000-0000-000000000005' })
  @IsOptional()
  @IsString()
  substitute_id?: string;

  @ApiProperty({ example: '2026-10-01' })
  @IsDateString()
  start_date!: string;

  @ApiProperty({ example: '2026-10-03' })
  @IsDateString()
  end_date!: string;

  @ApiPropertyOptional({ example: 'Keperluan keluarga' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class ApproveLeaveRequestDto {
  @ApiProperty({ example: 'LR20260001' })
  @IsString()
  id_request!: string;

  @ApiPropertyOptional({ description: 'UID approver (diambil otomatis dari JWT jika kosong)' })
  @IsOptional()
  @IsString()
  approver_id?: string;

  @ApiProperty({ enum: ['approve', 'reject', 'return'] })
  @IsString()
  action!: 'approve' | 'reject' | 'return';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  signature?: string;
}

export class CancelLeaveRequestDto {
  @ApiProperty({ example: 'LR20260001' })
  @IsString()
  id_request!: string;

  @ApiPropertyOptional({ description: 'UID requester (diambil otomatis dari JWT jika kosong)' })
  @IsOptional()
  @IsString()
  uid_user_system?: string;
}

export class ListLeaveRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  uid_user_system?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  kd_dept?: string;

  @ApiPropertyOptional({ example: 2026 })
  @IsOptional()
  @IsInt()
  @Min(2020)
  @Max(2099)
  year?: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
