import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { ApiProtected } from '../common/decorators/api-protected.decorator';
import { Public } from '../common/decorators/public.decorator';
import { aesEncrypt } from '../common/crypto.util';
import {
  ApiFailResponseDto,
  ApiStandardErrorResponses,
} from '../common/dto/api-response.dto';
import { ok } from '../common/response.util';
import { AuthService } from './auth.service';
import { AuthorizeDto } from './dto/authorize.dto';
import { AuthorizeDataDto } from './dto/authorize-response.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ChangeExpiredPasswordDto } from './dto/change-expired-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { JwtPayload } from './jwt.strategy';

const COOKIE_NAME = 'token';

@ApiTags('auth')
@ApiExtraModels(AuthorizeDataDto, ApiFailResponseDto)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @Public()
  @Post('authorize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login — set cookie AES + kembalikan access_token untuk Swagger',
    description:
      'Endpoint public. Sukses: set cookie httpOnly `token` (JWT dienkripsi AES) dan ' +
      'mengembalikan `data.access_token` (JWT plaintext) untuk tombol Authorize di Swagger.',
  })
  @ApiOkResponse({
    description: 'Login berhasil',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        error: { type: 'string', nullable: true, example: null },
        data: { $ref: getSchemaPath(AuthorizeDataDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ type: ApiFailResponseDto })
  @ApiBadRequestResponse({ type: ApiFailResponseDto })
  async authorize(
    @Body() dto: AuthorizeDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ) {
    const { token, user, build_menu, menu } =
      await this.authService.authorize(dto);
    const encrypted = aesEncrypt(token, this.config.get<string>('AES_KEY', ''));

    reply.setCookie(COOKIE_NAME, encrypted, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: this.config.get<string>('NODE_ENV') === 'production',
      maxAge: 60 * 60 * 8,
    });

    return ok({
      user,
      build_menu,
      menu,
      access_token: token,
    });
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Minta link reset password ke email user' })
  @ApiOkResponse({ description: 'Pesan generik (anti user-enumeration)' })
  @ApiBadRequestResponse({ type: ApiFailResponseDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return ok(await this.authService.forgotPassword(dto));
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password menggunakan token dari email' })
  @ApiOkResponse({ description: 'Password berhasil diubah' })
  @ApiBadRequestResponse({ type: ApiFailResponseDto })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return ok(await this.authService.resetPassword(dto));
  }

  @Public()
  @Post('password/expired')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ganti password kedaluwarsa (token dari login PASSWORD_EXPIRED)',
  })
  @ApiOkResponse({ description: 'Password expired berhasil diubah' })
  @ApiBadRequestResponse({ type: ApiFailResponseDto })
  async changeExpiredPassword(@Body() dto: ChangeExpiredPasswordDto) {
    return ok(await this.authService.changeExpiredPassword(dto));
  }

  @ApiProtected()
  @Get('menu')
  @ApiOperation({
    summary:
      'Rebuild sidebar menu + akses untuk JWT saat ini (private override role)',
  })
  @ApiStandardErrorResponses()
  async sessionMenu(@Req() req: FastifyRequest & { user?: JwtPayload }) {
    const payload = req.user;
    if (!payload?.sub) {
      return ok({ build_menu: [], menu: [] });
    }
    return ok(await this.authService.buildMenuPayloadForUid(payload.sub));
  }

  @ApiProtected()
  @Put('password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ganti password user yang sedang login' })
  @ApiStandardErrorResponses()
  async changePassword(
    @Req() req: FastifyRequest & { user?: JwtPayload },
    @Body() dto: ChangePasswordDto,
  ) {
    const uid = req.user?.sub;
    if (!uid) {
      throw new UnauthorizedException('Sesi tidak valid');
    }
    return ok(await this.authService.changePassword(uid, dto));
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Hapus cookie auth' })
  @ApiOkResponse({ description: 'Cookie dibersihkan' })
  logout(@Res({ passthrough: true }) reply: FastifyReply) {
    reply.clearCookie(COOKIE_NAME, { path: '/' });
    return ok({ message: 'Logged out' });
  }
}
