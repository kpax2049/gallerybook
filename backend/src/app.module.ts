import { Module } from '@nestjs/common';
import { UserModule } from './users/user.module';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { GalleryModule } from './gallery/gallery.module';
import { CommentModule } from './comment/comment.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UserModule,
    GalleryModule,
    AuthModule,
    PrismaModule,
    CommentModule,
    ProfileModule,
  ],
})
export class AppModule {}
