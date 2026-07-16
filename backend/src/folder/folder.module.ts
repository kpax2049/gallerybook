import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { FolderController, PublicFolderController } from './folder.controller';
import { FolderService } from './folder.service';

@Module({
  imports: [CommonModule],
  controllers: [FolderController, PublicFolderController],
  providers: [FolderService],
  exports: [FolderService],
})
export class FolderModule {}
