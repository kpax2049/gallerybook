import { Controller, Get } from '@nestjs/common';
import { Request } from 'express';

@Controller('sample')
export class SampleController {
  //   @Get()
  //   getHello(@Request() req) {
  //     return {
  //       message: 'This is a protected route',
  //       user: req.user,
  //     };
  //   }
}
