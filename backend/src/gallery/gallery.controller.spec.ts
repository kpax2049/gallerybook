import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { JwtGuard } from 'src/auth/guard';
import { ListGalleriesDto } from './dto/list-galleries.dto';

describe('GalleryController', () => {
  let controller: GalleryController;
  const galleryService = {
    checkGalleryOwnershipOrAdmin: jest.fn(),
    getGalleryById: jest.fn(),
    verifyOwnership: jest.fn(),
    findById: jest.fn(),
    generatePresignedUrls: jest.fn(),
    createDraft: jest.fn(),
    createGallery: jest.fn(),
    updateContent: jest.fn(),
    editGalleryById: jest.fn(),
    deleteGalleryById: jest.fn(),
    deleteImagesFromS3: jest.fn(),
    list: jest.fn(),
    toggleReaction: jest.fn(),
    getMyReactions: jest.fn(),
    replaceTags: jest.fn(),
    getGalleryBySlug: jest.fn(),
  } as Record<string, jest.Mock>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [GalleryController],
      providers: [
        {
          provide: GalleryService,
          useValue: galleryService,
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(GalleryController);
    Object.values(galleryService).forEach((mock) => mock.mockReset());
  });

  describe('getGalleryById', () => {
    const user = { id: 1 } as any;

    it('allows view mode without ownership check', async () => {
      const gallery = { id: 1, content: {} };
      galleryService.getGalleryById.mockResolvedValue(gallery);

      await expect(
        controller.getGalleryById(user, 5, 'view'),
      ).resolves.toBe(gallery);
      expect(galleryService.checkGalleryOwnershipOrAdmin).not.toHaveBeenCalled();
    });

    it('requires authenticated owner/admin for edit mode', async () => {
      galleryService.checkGalleryOwnershipOrAdmin.mockResolvedValue(true);
      galleryService.getGalleryById.mockResolvedValue({ id: 1 });

      await controller.getGalleryById(user, 5, 'edit');
      expect(galleryService.checkGalleryOwnershipOrAdmin).toHaveBeenCalledWith(
        5,
        user,
      );

      await expect(
        controller.getGalleryById({ id: null } as any, 5, 'edit'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      galleryService.checkGalleryOwnershipOrAdmin.mockResolvedValue(false);
      await expect(controller.getGalleryById(user, 5, 'edit')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  it('verifies ownership before generating presigned URLs', async () => {
    galleryService.verifyOwnership.mockResolvedValue(undefined);
    galleryService.findById.mockResolvedValue({ id: 1, userId: 1 });
    galleryService.generatePresignedUrls.mockResolvedValue({
      'a.jpg': 'url',
    });

    const result = await controller.getPresignedUrls(
      1,
      { paths: ['a.jpg'] },
      { id: 1 } as any,
    );

    expect(galleryService.verifyOwnership).toHaveBeenCalledWith(1, 1);
    expect(galleryService.generatePresignedUrls).toHaveBeenCalledWith(['a.jpg']);
    expect(result).toEqual({ 'a.jpg': 'url' });
  });

  it('rejects presigned url requests when gallery belongs to another user', async () => {
    galleryService.verifyOwnership.mockResolvedValue(undefined);
    galleryService.findById.mockResolvedValue({ id: 1, userId: 99 });

    await expect(
      controller.getPresignedUrls(
        1,
        { paths: ['a.jpg'] },
        { id: 1 } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(galleryService.generatePresignedUrls).not.toHaveBeenCalled();
  });

  it('does not update content when ownership verification fails', async () => {
    galleryService.verifyOwnership.mockRejectedValue(new ForbiddenException());

    await expect(
      controller.updateGalleryContent(
        10,
        { content: {} } as any,
        { id: 2 } as any,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(galleryService.updateContent).not.toHaveBeenCalled();
  });

  it('creates a draft and returns only the id', async () => {
    galleryService.createDraft.mockResolvedValue({ id: 123 });
    await expect(
      controller.createDraftGallery({ title: 'Draft' } as any, { id: 1 } as any),
    ).resolves.toEqual({ id: 123 });
  });

  it('rejects deleting images that are not under the gallery prefix', async () => {
    const result = await controller.deleteUnusedImages(
      7,
      9,
      { keys: ['uploads/users/7/galleries/9/photo.jpg', 'evil/path'] },
    );

    expect(galleryService.deleteImagesFromS3).toHaveBeenCalledWith([
      'uploads/users/7/galleries/9/photo.jpg',
    ]);
    expect(result).toEqual({ deleted: 1 });

    await expect(
      controller.deleteUnusedImages(7, 9, { keys: ['evil/path'] }),
    ).resolves.toEqual({ deleted: 0 });
  });

  it('forwards list calls with authenticated user id (or null)', async () => {
    const dto = new ListGalleriesDto();
    galleryService.list.mockResolvedValue({ items: [] });

    await controller.list({ id: 5 } as any, dto);
    expect(galleryService.list).toHaveBeenCalledWith(5, dto);

    await controller.list({} as any, dto);
    expect(galleryService.list).toHaveBeenCalledWith(null, dto);
  });

  it('delegates reaction endpoints to the service', async () => {
    galleryService.toggleReaction.mockResolvedValue({ ok: true });
    galleryService.getMyReactions.mockResolvedValue({ like: true });
    galleryService.replaceTags.mockResolvedValue({ tags: [] });

    await controller.toggleReaction({ id: 1 } as any, 2, { type: 'LIKE' } as any);
    expect(galleryService.toggleReaction).toHaveBeenCalledWith(1, 2, 'LIKE');

    await controller.myReactions({ id: 3 } as any, 4);
    expect(galleryService.getMyReactions).toHaveBeenCalledWith(3, 4);

    await controller.replaceTags({ id: 5 } as any, 6, { tags: ['a'] });
    expect(galleryService.replaceTags).toHaveBeenCalledWith(5, 6, ['a']);
  });

  it('fetches galleries by slug using the provided mode', async () => {
    galleryService.getGalleryBySlug.mockResolvedValue({ id: 1 });
    await controller.getBySlug('test', 'edit');
    expect(galleryService.getGalleryBySlug).toHaveBeenCalledWith('test', 'edit');
  });
});
