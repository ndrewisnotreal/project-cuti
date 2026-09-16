import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** Contoh: [{"menu":"MN0001","akses":"AC0001"}] → base64 */
const PERM_MENU_B64_EXAMPLE =
  'W3sibWVudSI6Ik1OMDAwMSIsImFrc2VzIjoiQUMwMDAxIn1d';

/** POST: buat role baru + permissions. */
export class CreateRolePermissionDto {
  @ApiProperty({ example: 'Operator', description: 'Nama role baru' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nm_role!: string;

  @ApiProperty({
    description:
      'Base64 JSON of [{ menu: kd_menu, akses: kd_action }, ...] — contoh decode: [{"menu":"MN0001","akses":"AC0001"}]',
    example: PERM_MENU_B64_EXAMPLE,
  })
  @IsString()
  menu!: string;
}

/** PUT: update nama role (opsional) + replace permissions. */
export class UpdateRolePermissionDto {
  @ApiProperty({ example: 'R0002' })
  @IsString()
  kd_role!: string;

  @ApiPropertyOptional({
    example: 'Operator Updated',
    description: 'Nama role (jika diubah)',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  nm_role?: string;

  @ApiProperty({
    description:
      'Base64 JSON of [{ menu: kd_menu, akses: kd_action }, ...] — contoh decode: [{"menu":"MN0001","akses":"AC0001"}]',
    example: PERM_MENU_B64_EXAMPLE,
  })
  @IsString()
  menu!: string;
}

/** @deprecated Use CreateRolePermissionDto / UpdateRolePermissionDto */
export class UpsertPermissionDto {
  @ApiProperty({ example: 'R0002' })
  @IsString()
  kd_role!: string;

  @ApiProperty({
    description: 'Base64 JSON of [{ menu: kd_menu, akses: kd_action }, ...]',
    example: PERM_MENU_B64_EXAMPLE,
  })
  @IsString()
  menu!: string;
}

export class DeletePermissionDto {
  @ApiProperty({ example: 'R0002' })
  @IsString()
  kd_role!: string;
}
