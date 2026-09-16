import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { CreateMenuDto } from './dto/create-menu.dto';
import { DeleteMenuDto, UpdateAllMenuDto } from './dto/update-all-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuService } from './menu.service';

@ApiTags('system/menu')
@ApiProtected()
@Controller('system/menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('tree')
  @ApiOperation({ summary: 'Tree menu aktif (login / sidebar)' })
  @ApiOkResponse({ description: 'Tree menu aktif' })
  @ApiStandardErrorResponses()
  async tree() {
    return ok(await this.menuService.findTree(true));
  }

  @Get('flat')
  @ApiOperation({ summary: 'List flat menu aktif (login / sidebar)' })
  @ApiOkResponse({ description: 'List flat menu aktif' })
  @ApiStandardErrorResponses()
  async flat() {
    return ok(await this.menuService.findFlat(true));
  }

  @Get('all')
  @ApiQuery({
    name: 'flat',
    required: false,
    description: 'true/1 = flat list termasuk MN_MAIN',
    example: 'true',
  })
  @ApiOperation({
    summary:
      'Admin menu board (semua status); ?flat=true = flat termasuk MN_MAIN',
  })
  @ApiOkResponse({ description: 'Tree atau flat admin menu' })
  @ApiStandardErrorResponses()
  async findAll(@Query('flat') flat?: string) {
    if (flat === 'true' || flat === '1') {
      return ok(await this.menuService.findAllAdminFlat(false));
    }
    return ok(await this.menuService.findAllAdminTree());
  }

  @Post()
  @ApiOperation({
    summary: 'Buat menu di bawah MN_MAIN (atau kd_parent yang diberi)',
  })
  @ApiOkResponse({ description: 'Menu dibuat' })
  @ApiStandardErrorResponses()
  async create(@Body() dto: CreateMenuDto) {
    return ok(await this.menuService.create(dto));
  }

  @Put('all')
  @ApiOperation({ summary: 'Bulk reorder/update tree menu (base64 JSON)' })
  @ApiOkResponse({ description: 'Tree menu diupdate' })
  @ApiStandardErrorResponses()
  async updateAll(@Body() dto: UpdateAllMenuDto) {
    return ok(await this.menuService.updateAll(dto));
  }

  @Put()
  @ApiOperation({ summary: 'Update field satu menu' })
  @ApiOkResponse({ description: 'Menu diupdate' })
  @ApiStandardErrorResponses()
  async update(@Body() dto: UpdateMenuDto) {
    return ok(await this.menuService.update(dto));
  }

  @Delete()
  @ApiOperation({ summary: 'Hapus menu daun (leaf)' })
  @ApiOkResponse({ description: 'Menu dihapus' })
  @ApiStandardErrorResponses()
  async remove(@Body() dto: DeleteMenuDto) {
    await this.menuService.remove(dto.kd_menu);
    return ok({ kd_menu: dto.kd_menu });
  }
}
