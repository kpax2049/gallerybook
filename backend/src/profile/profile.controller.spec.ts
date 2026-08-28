import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

jest.mock('src/cloudinary/cloudinary.config', () => {
  const upload = jest.fn();
  const destroy = jest.fn();
  return {
    cloudinary: { uploader: { upload, destroy } },
    __uploadMock: upload,
    __destroyMock: destroy,
  };
});

jest.mock('fs', () => {
  const actual = jest.requireActual('fs');
  const unlink = jest.fn();
  const readFile = jest.fn();
  const mkdirSync = jest.fn();
  return {
    ...actual,
    mkdirSync,
    promises: { ...actual.promises, readFile, unlink },
    __unlinkMock: unlink,
    __readFileMock: readFile,
  };
});

const mockUpload = jest.requireMock('src/cloudinary/cloudinary.config')
  .__uploadMock as jest.Mock;
const mockUnlink = jest.requireMock('fs').__unlinkMock as jest.Mock;
const mockReadFile = jest.requireMock('fs').__readFileMock as jest.Mock;
const mockDestroy = jest.requireMock('src/cloudinary/cloudinary.config')
  .__destroyMock as jest.Mock;

const pngData = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe('ProfileController', () => {
  let controller: ProfileController;
  const profileService = {
    replaceAvatar: jest.fn(),
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
    mockDestroy.mockReset();
    mockReadFile.mockReset();
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
    profileService.replaceAvatar.mockResolvedValue({
      previousAvatarPublicId: 'old-pid',
    });
    mockReadFile.mockResolvedValue(pngData);
    mockUnlink.mockResolvedValue(undefined);
    mockDestroy.mockResolvedValue({ result: 'ok' });

    const file = { path: '/tmp/avatar.jpg', originalname: 'avatar.jpg' } as any;
    const result = await controller.uploadAvatar(5, file);

    expect(mockUpload).toHaveBeenCalledWith(file.path, expect.any(Object));
    expect(profileService.replaceAvatar).toHaveBeenCalledWith(
      5,
      'https://cdn/avatar.jpg',
      'pid',
    );
    expect(mockDestroy).toHaveBeenCalledWith('old-pid', {
      resource_type: 'image',
    });
    expect(result).toEqual({ url: 'https://cdn/avatar.jpg', public_id: 'pid' });
    expect(mockUnlink).toHaveBeenCalledWith(file.path);
  });

  it('throws internal error when upload fails but still cleans up', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockUpload.mockRejectedValue(new Error('cloudinary down'));
    mockReadFile.mockResolvedValue(pngData);
    mockUnlink.mockResolvedValue(undefined);

    const file = { path: '/tmp/avatar.jpg', originalname: 'avatar.jpg' } as any;

    await expect(controller.uploadAvatar(2, file)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(profileService.replaceAvatar).not.toHaveBeenCalled();
    expect(mockUnlink).toHaveBeenCalledWith(file.path);
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('rejects content that is not a supported image before uploading', async () => {
    mockReadFile.mockResolvedValue(Buffer.from('not an image'));
    mockUnlink.mockResolvedValue(undefined);
    const file = { path: '/tmp/avatar', originalname: 'avatar.png' } as any;

    await expect(controller.uploadAvatar(2, file)).rejects.toBeInstanceOf(
      BadRequestException,
    );

    expect(mockUpload).not.toHaveBeenCalled();
    expect(mockUnlink).toHaveBeenCalledWith(file.path);
  });

  it('deletes the newly uploaded asset if profile persistence fails', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    mockReadFile.mockResolvedValue(pngData);
    mockUpload.mockResolvedValue({
      secure_url: 'https://cdn/avatar.jpg',
      public_id: 'pid',
    });
    profileService.replaceAvatar.mockRejectedValue(new Error('database down'));
    mockDestroy.mockResolvedValue({ result: 'ok' });
    mockUnlink.mockResolvedValue(undefined);
    const file = { path: '/tmp/avatar', originalname: 'avatar.png' } as any;

    await expect(controller.uploadAvatar(2, file)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );

    expect(mockDestroy).toHaveBeenCalledWith('pid', { resource_type: 'image' });
    consoleError.mockRestore();
  });
});
