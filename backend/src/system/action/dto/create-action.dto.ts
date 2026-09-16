import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Contoh: Buffer.from(JSON.stringify(['MN0001'])).toString('base64') */
const MENUS_B64_EXAMPLE = 'WyJNTjAwMDEiXQ==';

export class CreateActionDto {
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
    description: 'Base64 JSON string[] of kd_menu, mis. ["MN0001"]',
    example: MENUS_B64_EXAMPLE,
  })
  @IsOptional()
  @IsString()
  menus?: string;
}
