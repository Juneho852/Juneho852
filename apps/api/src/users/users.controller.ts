import { Controller, Get, Patch, Post, Param, Body, Query } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { UsersService } from './users.service';
import { UpdateHelperProfileDto } from './dto/update-helper-profile.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Get('helpers/:id')
  getHelperProfile(@Param('id') id: string) {
    return this.users.getHelperProfile(id);
  }

  @Patch('helper/profile')
  @Roles(UserRole.HELPER)
  updateHelperProfile(@CurrentUser() user: any, @Body() dto: UpdateHelperProfileDto) {
    return this.users.updateHelperProfile(user.userId, dto);
  }

  @Post('broker/helpers/bulk')
  @Roles(UserRole.BROKER)
  bulkUpload(@CurrentUser() user: any, @Body() body: { helpers: any[] }) {
    return this.users.bulkUploadHelpers(user.userId, body.helpers);
  }

  @Get('broker/helpers')
  @Roles(UserRole.BROKER)
  getBrokerHelpers(@CurrentUser() user: any) {
    return this.users.getBrokerHelpers(user.userId);
  }

  @Get('admin/all')
  @Roles(UserRole.ADMIN)
  getAllUsers(@Query('role') role?: UserRole) {
    return this.users.getAdminUsers(role);
  }

  @Patch('admin/:id/status')
  @Roles(UserRole.ADMIN)
  toggleStatus(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.users.toggleUserActive(id, isActive);
  }
}
