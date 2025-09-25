import {
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Param,
  UseGuards,
  Req,
  ParseIntPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtGuard } from 'src/auth/guard';
import { FollowingQueryDto } from './dto';

@Controller()
@UseGuards(JwtGuard)
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post('users/:userId/follow')
  async follow(@Param('userId', ParseIntPipe) userId: number, @Req() req: any) {
    const meId = req.user?.id;
    if (!meId) throw new UnauthorizedException();
    return this.followService.follow(meId, userId);
  }

  @Delete('users/:userId/follow')
  async unfollow(
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: any,
  ) {
    const meId = req.user?.id;
    if (!meId) throw new UnauthorizedException();
    return this.followService.unfollow(meId, userId);
  }

  @Get('me/following')
  async listFollowing(@Query() dto: FollowingQueryDto, @Req() req: any) {
    const meId = req.user?.id;
    if (!meId) throw new UnauthorizedException();
    return this.followService.listFollowing(meId, dto.q, dto.skip, dto.take);
  }

  @Get('me/following/ids')
  async followingIds(@Req() req: any) {
    const meId = req.user.id;
    return this.followService.followingIds(meId);
  }
}
