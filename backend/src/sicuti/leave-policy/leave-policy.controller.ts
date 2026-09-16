import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiProtected } from '../../common/decorators/api-protected.decorator';
import { ApiStandardErrorResponses } from '../../common/dto/api-response.dto';
import { ok } from '../../common/response.util';
import { UpdatePolicyDto } from './dto/policy.dto';
import { LeavePolicyService } from './leave-policy.service';

@ApiTags('sicuti/policy')
@ApiProtected()
@Controller('sicuti/policy')
export class LeavePolicyController {
  constructor(private readonly svc: LeavePolicyService) {}

  @Get()
  @ApiOperation({ summary: 'Baca kebijakan cuti aktif' })
  @ApiOkResponse({ description: 'Kebijakan cuti' })
  @ApiStandardErrorResponses()
  async get() {
    return ok(await this.svc.getActive());
  }

  @Put()
  @ApiOperation({ summary: 'Update kebijakan cuti' })
  @ApiOkResponse({ description: 'Kebijakan diperbarui' })
  @ApiStandardErrorResponses()
  async update(@Body() dto: UpdatePolicyDto) {
    return ok(await this.svc.update(dto));
  }
}
