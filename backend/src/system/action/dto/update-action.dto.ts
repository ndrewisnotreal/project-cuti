import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const MENUS_B64_EXAMPLE = 'WyJNTjAwMDEiXQ==';

export class UpdateActionDto {
  @ApiProperty({ example: 'AC0001' })
  @IsString()
  kd_action!: string;

  @ApiProperty({ example: 'EX' })
  @IsString()
  @MinLength(1)
  @MaxLength(25)
  kode!: string;

  @ApiProperty({ example: 'Export' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nm_action!: string;

  @ApiPropertyOptional({ example: 'Export data ke Excel' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  deskripsi?: string;

  @ApiPropertyOptional({
    description:
      'Base64 JSON string[] of kd_menu; omit untuk pertahankan mapping saat ini',
    example: MENUS_B64_EXAMPLE,
  })
  @IsOptional()
  @IsString()
  menus?: string;
}

export class DeleteActionDto {
  @ApiProperty({ example: 'AC0001' })
  @IsString()
  kd_action!: string;
}
