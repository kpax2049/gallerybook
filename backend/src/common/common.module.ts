import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AssetUrlService } from './asset-url.service';

@Module({
  imports: [ConfigModule], // so AssetUrlService can read env
  providers: [AssetUrlService],
  exports: [AssetUrlService],
})
export class CommonModule {}
