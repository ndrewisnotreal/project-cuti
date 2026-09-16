import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateDepartmentDto {
  @ApiPropertyOptional({ example: 'SIT', description: 'Kode dept (auto-generate jika kosong)' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  kd_dept?: string;

  @ApiProperty({ example: 'Sistem Informasi & Teknologi' })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nm_dept!: string;
}

export class UpdateDepartmentDto {
  @ApiProperty({ example: 'SIT' })
  @IsString()
  @MinLength(1)
  @MaxLength(10)
  kd_dept!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  nm_dept?: string;
}
