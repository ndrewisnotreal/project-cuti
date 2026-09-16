import { Body, Controller, Delete, Get, Post, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { CreateActionDto } from './dto/create-action.dto';
import { DeleteActionDto, UpdateActionDto } from './dto/update-action.dto';
import { ActionService } from './action.service';

@ApiTags('system/action')
@ApiProtected()
@Controller('system/action')
export class ActionController {
  constructor(private readonly actionService: ActionService) {}

  @Get()
  @ApiOperation({ summary: 'List action beserta menu yang ter-assign' })
  @ApiOkResponse({ description: 'Daftar action' })
  @ApiStandardErrorResponses()
  async findAll() {
    return ok(await this.actionService.findAll());
  }

  @Post()
  @ApiOperation({ summary: 'Buat action dan sync d_action_menu' })
  @ApiOkResponse({ description: 'Action dibuat' })
  @ApiStandardErrorResponses()
  async create(@Body() dto: CreateActionDto) {
    return ok(await this.actionService.create(dto));
  }

  @Put()
  @ApiOperation({ summary: 'Update action; menus opsional (replace)' })
  @ApiOkResponse({ description: 'Action diupdate' })
  @ApiStandardErrorResponses()
  async update(@Body() dto: UpdateActionDto) {
    return ok(await this.actionService.update(dto));
  }

  @Delete()
  @ApiOperation({ summary: 'Hapus action' })
  @ApiOkResponse({ description: 'Action dihapus' })
  @ApiStandardErrorResponses()
  async remove(@Body() dto: DeleteActionDto) {
    await this.actionService.remove(dto.kd_action);
    return ok({ kd_action: dto.kd_action });
  }
}
