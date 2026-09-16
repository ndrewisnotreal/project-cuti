import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { JwtPayload } from '../../auth/jwt.strategy';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { actorRoleFromRequest } from '../../common/role-hierarchy.util';
import { ok } from '../../common/response.util';
import {
  CreateRolePermissionDto,
  DeletePermissionDto,
  UpdateRolePermissionDto,
} from './dto/upsert-permission.dto';
import {
  DeletePermissionPrivateDto,
  UpsertPermissionPrivateDto,
} from './dto/upsert-permission-private.dto';
import { PermissionService } from './permission.service';

@ApiTags('master/permission')
@ApiProtected()
@Controller('master/permission')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Get()
  @ApiQuery({
    name: 'kd_role',
    required: false,
    description: 'Filter permission untuk satu role',
    example: 'R0001',
  })
  @ApiQuery({
    name: 'grouped',
    required: false,
    description: 'true/1 = matrix dikelompokkan per role',
    example: 'true',
  })
  @ApiOperation({
    summary:
      'List permissions: flat, per role (?kd_role=), atau matrix (?grouped=true)',
  })
  @ApiOkResponse({ description: 'Daftar / matrix permission' })
  @ApiStandardErrorResponses()
  async findAll(
    @Req() req: FastifyRequest & { user?: JwtPayload },
    @Query('kd_role') kdRole?: string,
    @Query('grouped') grouped?: string,
  ) {
    const actor = actorRoleFromRequest(req.user);
    if (grouped === 'true' || grouped === '1') {
      return ok(await this.permissionService.findGroupedByRole(actor));
    }
    if (kdRole) {
      return ok(await this.permissionService.findByRole(kdRole, actor));
    }
    return ok(await this.permissionService.findAll(actor));
  }

  @Get('role')
  @ApiOperation({ summary: 'Role yang belum punya permission public' })
  @ApiOkResponse({ description: 'Daftar role tanpa permission' })
  @ApiStandardErrorResponses()
  async rolesWithout(@Req() req: FastifyRequest & { user?: JwtPayload }) {
    return ok(
      await this.permissionService.findRolesWithoutPermission(
        actorRoleFromRequest(req.user),
      ),
    );
  }

  @Get('action_edit')
  @ApiQuery({
    name: 'kd_role',
    required: true,
    description: 'Kode role untuk form edit',
    example: 'R0001',
  })
  @ApiOperation({ summary: 'Map menu→actions untuk role (form edit)' })
  @ApiOkResponse({ description: 'Matrix edit permission role' })
  @ApiStandardErrorResponses()
  async actionEdit(
    @Req() req: FastifyRequest & { user?: JwtPayload },
    @Query('kd_role') kdRole: string,
  ) {
    return ok(
      await this.permissionService.getActionEdit(
        kdRole,
        actorRoleFromRequest(req.user),
      ),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Buat role baru + permissions (Role & Permission)' })
  @ApiOkResponse({ description: 'Role + permission dibuat' })
  @ApiStandardErrorResponses()
  async create(@Body() dto: CreateRolePermissionDto) {
    return ok(await this.permissionService.createRoleWithPermissions(dto));
  }

  @Put()
  @ApiOperation({
    summary: 'Update nama role (opsional) + replace-all permissions',
  })
  @ApiOkResponse({ description: 'Permission role diupdate' })
  @ApiStandardErrorResponses()
  async update(
    @Req() req: FastifyRequest & { user?: JwtPayload },
    @Body() dto: UpdateRolePermissionDto,
  ) {
    return ok(
      await this.permissionService.updateRoleWithPermissions(
        dto,
        actorRoleFromRequest(req.user),
      ),
    );
  }

  @Delete()
  @ApiOperation({ summary: 'Hapus permissions + soft-delete role' })
  @ApiOkResponse({ description: 'Role di-soft-delete' })
  @ApiStandardErrorResponses()
  async remove(
    @Req() req: FastifyRequest & { user?: JwtPayload },
    @Body() dto: DeletePermissionDto,
  ) {
    await this.permissionService.removeRoleAndPermissions(
      dto.kd_role,
      actorRoleFromRequest(req.user),
    );
    return ok({ kd_role: dto.kd_role });
  }

  // ---- Private -----------------------------------------------------------

  @Get('private')
  @ApiQuery({
    name: 'uid_user_system',
    required: false,
    description: 'Filter private permission per user',
    example: '00000000-0000-0000-0000-000000000001',
  })
  @ApiQuery({
    name: 'grouped',
    required: false,
    description: 'true/1 = dikelompokkan per user',
    example: 'true',
  })
  @ApiOperation({
    summary: 'Private permissions: flat, per user, atau grouped',
  })
  @ApiOkResponse({ description: 'Daftar private permission' })
  @ApiStandardErrorResponses()
  async findPrivate(
    @Req() req: FastifyRequest & { user?: JwtPayload },
    @Query('uid_user_system') uid?: string,
    @Query('grouped') grouped?: string,
  ) {
    const actor = actorRoleFromRequest(req.user);
    if (grouped === 'true' || grouped === '1') {
      return ok(await this.permissionService.findGroupedPrivate(actor));
    }
    if (uid) {
      return ok(await this.permissionService.findByUser(uid));
    }
    return ok(await this.permissionService.findGroupedPrivate(actor));
  }

  @Get('user_no_private')
  @ApiOperation({ summary: 'User tanpa override private permission' })
  @ApiOkResponse({ description: 'Daftar user tanpa private' })
  @ApiStandardErrorResponses()
  async usersWithoutPrivate(
    @Req() req: FastifyRequest & { user?: JwtPayload },
  ) {
    return ok(
      await this.permissionService.findUsersWithoutPrivate(
        actorRoleFromRequest(req.user),
      ),
    );
  }

  @Get('action_edit_private')
  @ApiQuery({
    name: 'uid_user_system',
    required: true,
    description: 'UID user untuk form edit private',
    example: '00000000-0000-0000-0000-000000000001',
  })
  @ApiOperation({
    summary: 'Map menu→actions private untuk user (form edit)',
  })
  @ApiOkResponse({ description: 'Matrix edit private permission' })
  @ApiStandardErrorResponses()
  async actionEditPrivate(@Query('uid_user_system') uid: string) {
    return ok(await this.permissionService.getActionEditPrivate(uid));
  }

  @Get('action_edit_role_private')
  @ApiQuery({
    name: 'uid_user_system',
    required: true,
    description: 'UID user — seed dari permission role public',
    example: '00000000-0000-0000-0000-000000000001',
  })
  @ApiOperation({
    summary: 'Seed matrix dari permission public role user',
  })
  @ApiOkResponse({ description: 'Matrix seed dari role' })
  @ApiStandardErrorResponses()
  async actionEditRolePrivate(@Query('uid_user_system') uid: string) {
    return ok(await this.permissionService.getActionEditRolePrivate(uid));
  }

  @Post('private')
  @ApiOperation({ summary: 'Buat / upsert private permission untuk user' })
  @ApiOkResponse({ description: 'Private permission disimpan' })
  @ApiStandardErrorResponses()
  async createPrivate(@Body() dto: UpsertPermissionPrivateDto) {
    return ok(await this.permissionService.upsertPrivate(dto, false));
  }

  @Put('private')
  @ApiOperation({ summary: 'Update private permission user (replace)' })
  @ApiOkResponse({ description: 'Private permission diupdate' })
  @ApiStandardErrorResponses()
  async updatePrivate(@Body() dto: UpsertPermissionPrivateDto) {
    return ok(await this.permissionService.upsertPrivate(dto, true));
  }

  @Delete('private')
  @ApiOperation({ summary: 'Hapus semua private permission user' })
  @ApiOkResponse({ description: 'Private permission dihapus' })
  @ApiStandardErrorResponses()
  async removePrivate(@Body() dto: DeletePermissionPrivateDto) {
    await this.permissionService.removePrivateByUser(dto.uid_user_system);
    return ok({ uid_user_system: dto.uid_user_system });
  }
}
