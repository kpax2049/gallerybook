import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FolderService } from './folder.service';

describe('FolderService', () => {
  let service: FolderService;
  let prisma: {
    folder: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(() => {
    prisma = {
      folder: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    service = new FolderService(prisma as unknown as PrismaService);
  });

  it('lists owner folders with gallery counts', async () => {
    const now = new Date();
    prisma.folder.findMany.mockResolvedValue([
      {
        id: 1,
        createdAt: now,
        updatedAt: now,
        name: 'Travel',
        slug: 'travel',
        description: 'Trips',
        color: '#14b8a6',
        userId: 7,
        _count: { galleries: 3 },
      },
    ]);

    await expect(service.listForUser(7)).resolves.toEqual([
      {
        id: 1,
        createdAt: now,
        updatedAt: now,
        name: 'Travel',
        slug: 'travel',
        description: 'Trips',
        color: '#14b8a6',
        userId: 7,
        galleriesCount: 3,
      },
    ]);
    expect(prisma.folder.findMany).toHaveBeenCalledWith({
      where: { userId: 7 },
      orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
      include: { _count: { select: { galleries: true } } },
    });
  });

  it('creates folders with trimmed names and unique slugs', async () => {
    prisma.folder.findFirst
      .mockResolvedValueOnce({ id: 1 })
      .mockResolvedValueOnce(null);
    prisma.folder.create.mockResolvedValue({ id: 2, slug: 'travel-2' });

    await expect(
      service.create(7, {
        name: '  Travel  ',
        description: 'Trips',
        color: '#14b8a6',
      }),
    ).resolves.toEqual({ id: 2, slug: 'travel-2' });

    expect(prisma.folder.findFirst).toHaveBeenNthCalledWith(1, {
      where: { userId: 7, slug: 'travel' },
      select: { id: true },
    });
    expect(prisma.folder.findFirst).toHaveBeenNthCalledWith(2, {
      where: { userId: 7, slug: 'travel-2' },
      select: { id: true },
    });
    expect(prisma.folder.create).toHaveBeenCalledWith({
      data: {
        userId: 7,
        name: 'Travel',
        slug: 'travel-2',
        description: 'Trips',
        color: '#14b8a6',
      },
    });
  });

  it('updates owned folders and clears optional fields', async () => {
    prisma.folder.findUnique.mockResolvedValue({
      id: 3,
      userId: 7,
      name: 'Old',
    });
    prisma.folder.findFirst.mockResolvedValue(null);
    prisma.folder.update.mockResolvedValue({ id: 3, name: 'New' });

    await expect(
      service.update(7, 3, {
        name: ' New ',
        description: undefined,
        color: undefined,
      }),
    ).resolves.toEqual({ id: 3, name: 'New' });

    expect(prisma.folder.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { name: 'New', slug: 'new' },
    });

    await service.update(7, 3, { description: null as any, color: null as any });
    expect(prisma.folder.update).toHaveBeenLastCalledWith({
      where: { id: 3 },
      data: { description: null, color: null },
    });
  });

  it('deletes only owned folders', async () => {
    prisma.folder.findUnique.mockResolvedValue({ id: 4, userId: 7 });
    prisma.folder.delete.mockResolvedValue({ id: 4 });

    await expect(service.delete(7, 4)).resolves.toEqual({ ok: true });
    expect(prisma.folder.delete).toHaveBeenCalledWith({ where: { id: 4 } });
  });

  it('rejects missing or foreign folders', async () => {
    prisma.folder.findUnique.mockResolvedValueOnce(null);
    await expect(service.getOwnedFolder(7, 1)).rejects.toBeInstanceOf(
      NotFoundException,
    );

    prisma.folder.findUnique.mockResolvedValueOnce({ id: 1, userId: 99 });
    await expect(service.getOwnedFolder(7, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });
});
