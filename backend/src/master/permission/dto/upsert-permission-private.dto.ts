import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

const PERM_MENU_B64_EXAMPLE =
  'W3sibWVudSI6Ik1OMDAwMSIsImFrc2VzIjoiQUMwMDAxIn1d';

export class UpsertPermissionPrivateDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000002',
  })
  @IsString()
  uid_user_system!: string;

  @ApiProperty({
    description:
      'Base64 JSON of [{ menu: kd_menu, akses: kd_action }, ...] — contoh decode: [{"menu":"MN0001","akses":"AC0001"}]',
    example: PERM_MENU_B64_EXAMPLE,
  })
  @IsString()
  menu!: string;
}

export class DeletePermissionPrivateDto {
  @ApiProperty({
    example: '00000000-0000-0000-0000-000000000002',
  })
  @IsString()
  uid_user_system!: string;
}
