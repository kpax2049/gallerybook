import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';

@Module({
  imports: [CommonModule],
  controllers: [FolderController],
  providers: [FolderService],
  exports: [FolderService],
})
export class FolderModule {}
