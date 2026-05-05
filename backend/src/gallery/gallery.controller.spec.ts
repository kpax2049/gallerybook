import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';
import { JwtGuard } from 'src/auth/guard';
import { ListGalleriesDto } from './dto/list-galleries.dto';

describe('GalleryController', () => {
  let controller: GalleryController;
  const galleryService = {
    checkGalleryOwnershipOrAdmin: jest.fn(),
    verifyManageAccess: jest.fn(),
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
    const user = { id: 1, role: 'USER' } as any;
    const admin = { id: 1, role: 'ADMIN' } as any;

    it('allows view mode without ownership check', async () => {
      const gallery = { id: 1, content: {} };
      galleryService.getGalleryById.mockResolvedValue(gallery);

      await expect(controller.getGalleryById(user, 5, 'view')).resolves.toBe(
        gallery,
      );
      expect(
        galleryService.checkGalleryOwnershipOrAdmin,
      ).not.toHaveBeenCalled();
      expect(galleryService.getGalleryById).toHaveBeenCalledWith(
        5,
        'view',
        user,
      );
    });

    it('requires admin for edit mode', async () => {
      galleryService.getGalleryById.mockResolvedValue({ id: 1 });

      await controller.getGalleryById(admin, 5, 'edit');
      expect(galleryService.getGalleryById).toHaveBeenCalledWith(
        5,
        'edit',
        admin,
      );

      await expect(
        controller.getGalleryById({ id: null } as any, 5, 'edit'),
      ).rejects.toBeInstanceOf(UnauthorizedException);

      await expect(
        controller.getGalleryById(user, 5, 'edit'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  it('verifies ownership before generating presigned URLs', async () => {
    const admin = { id: 1, role: 'ADMIN' } as any;
    galleryService.verifyManageAccess.mockResolvedValue(undefined);
    galleryService.generatePresignedUrls.mockResolvedValue({
      'a.jpg': 'url',
    });

    const result = await controller.getPresignedUrls(
      1,
      { paths: ['a.jpg'] },
      admin,
    );

    expect(galleryService.verifyManageAccess).toHaveBeenCalledWith(1, admin);
    expect(galleryService.generatePresignedUrls).toHaveBeenCalledWith([
      'a.jpg',
    ]);
    expect(result).toEqual({ 'a.jpg': 'url' });
  });

  it('rejects presigned url requests for non-admin users', async () => {
    const user = { id: 1, role: 'USER' } as any;

    await expect(
      controller.getPresignedUrls(1, { paths: ['a.jpg'] }, user),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(galleryService.verifyManageAccess).not.toHaveBeenCalled();
    expect(galleryService.generatePresignedUrls).not.toHaveBeenCalled();
  });

  it('does not update content when ownership verification fails', async () => {
    const admin = { id: 2, role: 'ADMIN' } as any;
    galleryService.verifyManageAccess.mockRejectedValue(
      new ForbiddenException(),
    );

    await expect(
      controller.updateGalleryContent(10, { content: {} } as any, admin),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(galleryService.updateContent).not.toHaveBeenCalled();
  });

  it('creates a draft and returns only the id', async () => {
    const admin = { id: 1, role: 'ADMIN' } as any;
    galleryService.createDraft.mockResolvedValue({ id: 123 });
    await expect(
      controller.createDraftGallery({ title: 'Draft' } as any, admin),
    ).resolves.toEqual({ id: 123 });
  });

  it('rejects deleting images that are not under the gallery prefix', async () => {
    const admin = { id: 1, role: 'ADMIN' } as any;
    galleryService.findById.mockResolvedValue({ id: 9, userId: 7 });

    const result = await controller.deleteUnusedImages(admin, 9, {
      keys: ['uploads/users/7/galleries/9/photo.jpg', 'evil/path'],
    });

    expect(galleryService.deleteImagesFromS3).toHaveBeenCalledWith([
      'uploads/users/7/galleries/9/photo.jpg',
    ]);
    expect(result).toEqual({ deleted: 1 });

    await expect(
      controller.deleteUnusedImages(admin, 9, { keys: ['evil/path'] }),
    ).resolves.toEqual({ deleted: 0 });
  });

  it('forwards list calls with authenticated user id (or null)', async () => {
    const dto = new ListGalleriesDto();
    galleryService.list.mockResolvedValue({ items: [] });

    await controller.list({ id: 5, role: 'USER' } as any, dto);
    expect(galleryService.list).toHaveBeenCalledWith(5, dto, 'USER');

    await controller.list({} as any, dto);
    expect(galleryService.list).toHaveBeenCalledWith(null, dto, undefined);
  });

  it('delegates reaction endpoints to the service', async () => {
    galleryService.toggleReaction.mockResolvedValue({ ok: true });
    galleryService.getMyReactions.mockResolvedValue({ like: true });
    galleryService.replaceTags.mockResolvedValue({ tags: [] });

    await controller.toggleReaction({ id: 1 } as any, 2, {
      type: 'LIKE',
    } as any);
    expect(galleryService.toggleReaction).toHaveBeenCalledWith(1, 2, 'LIKE');

    await controller.myReactions({ id: 3 } as any, 4);
    expect(galleryService.getMyReactions).toHaveBeenCalledWith(3, 4);

    await controller.replaceTags({ id: 5, role: 'ADMIN' } as any, 6, {
      tags: ['a'],
    });
    expect(galleryService.replaceTags).toHaveBeenCalledWith(5, 6, ['a']);
  });

  it('fetches galleries by slug using the provided mode', async () => {
    const admin = { id: 1, role: 'ADMIN' } as any;
    galleryService.getGalleryBySlug.mockResolvedValue({ id: 1 });
    await controller.getBySlug(admin, 'test', 'edit');
    expect(galleryService.getGalleryBySlug).toHaveBeenCalledWith(
      'test',
      'edit',
      admin,
    );
  });
});
