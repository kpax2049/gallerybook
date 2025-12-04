import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

const mockUpload = jest.fn();
const mockUnlink = jest.fn();

jest.mock('src/cloudinary/cloudinary.config', () => ({
  cloudinary: { uploader: { upload: mockUpload } },
}));

jest.mock('fs/promises', () => ({
  unlink: mockUnlink,
}));

describe('ProfileController', () => {
  let controller: ProfileController;
  const profileService = {
    updateAvatarUrl: jest.fn(),
  } as Record<string, jest.Mock>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: profileService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ProfileController);
    Object.values(profileService).forEach((mock) => mock.mockReset());
    mockUpload.mockReset();
    mockUnlink.mockReset();
  });

  it('rejects when no file is provided', async () => {
    await expect(
      controller.uploadAvatar(1, undefined as any),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it('uploads avatar, updates profile, and cleans up temp file', async () => {
    mockUpload.mockResolvedValue({
      secure_url: 'https://cdn/avatar.jpg',
      public_id: 'pid',
    });
    profileService.updateAvatarUrl.mockResolvedValue(undefined);
    mockUnlink.mockResolvedValue(undefined);

    const file = { path: '/tmp/avatar.jpg', originalname: 'avatar.jpg' } as any;
    const result = await controller.uploadAvatar(5, file);

    expect(mockUpload).toHaveBeenCalledWith(file.path, expect.any(Object));
    expect(profileService.updateAvatarUrl).toHaveBeenCalledWith(
      5,
      'https://cdn/avatar.jpg',
    );
    expect(result).toEqual({ url: 'https://cdn/avatar.jpg', public_id: 'pid' });
    expect(mockUnlink).toHaveBeenCalledWith(file.path);
  });

  it('throws internal error when upload fails but still cleans up', async () => {
    mockUpload.mockRejectedValue(new Error('cloudinary down'));
    mockUnlink.mockResolvedValue(undefined);

    const file = { path: '/tmp/avatar.jpg', originalname: 'avatar.jpg' } as any;

    await expect(controller.uploadAvatar(2, file)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(profileService.updateAvatarUrl).not.toHaveBeenCalled();
    expect(mockUnlink).toHaveBeenCalledWith(file.path);
  });
});
