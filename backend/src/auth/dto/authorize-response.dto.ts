import { ApiProperty } from '@nestjs/swagger';

/** Shape `data` dari POST /auth/authorize (untuk Swagger / QA). */
export class AuthorizeDataDto {
  @ApiProperty({
    description:
      'JWT plaintext — salin ke tombol Authorize (Bearer) untuk Try it out',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token!: string;

  @ApiProperty({
    description: 'Profil user (tanpa password)',
    example: {
      uid_user_system: '00000000-0000-0000-0000-000000000001',
      username: 'super',
      nama: 'Super Admin',
      kd_role: 'R0001',
    },
  })
  user!: Record<string, unknown>;

  @ApiProperty({
    description: 'Tree menu untuk sidebar',
    type: 'array',
    items: { type: 'object' },
    example: [],
  })
  build_menu!: unknown[];

  @ApiProperty({
    description: 'Akses flat (menu + action) untuk session',
    type: 'array',
    items: { type: 'object' },
    example: [],
  })
  menu!: unknown[];
}
