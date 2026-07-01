import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtGuard } from 'src/auth/guard';
import { FolderController } from './folder.controller';
import { FolderService } from './folder.service';

describe('FolderController', () => {
  let controller: FolderController;
  const folderService = {
    listForUser: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  } as Record<string, jest.Mock>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [FolderController],
      providers: [{ provide: FolderService, useValue: folderService }],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(FolderController);
    Object.values(folderService).forEach((mock) => mock.mockReset());
  });

  it('lists folders for the authenticated user', async () => {
    folderService.listForUser.mockResolvedValue([{ id: 1 }]);

    await expect(controller.list({ id: 7 } as any)).resolves.toEqual([
      { id: 1 },
    ]);
    expect(folderService.listForUser).toHaveBeenCalledWith(7);
  });

  it('requires an authenticated user for reads', async () => {
    expect(() => controller.list({} as any)).toThrow(UnauthorizedException);
  });

  it('allows admins to create, update, and delete folders', async () => {
    const admin = { id: 7, role: 'ADMIN' } as any;
    folderService.create.mockResolvedValue({ id: 1 });
    folderService.update.mockResolvedValue({ id: 1, name: 'Travel' });
    folderService.delete.mockResolvedValue({ ok: true });

    await expect(
      controller.create(admin, { name: 'Travel' } as any),
    ).resolves.toEqual({ id: 1 });
    expect(folderService.create).toHaveBeenCalledWith(7, { name: 'Travel' });

    await expect(
      controller.update(admin, 1, { name: 'Trips' } as any),
    ).resolves.toEqual({ id: 1, name: 'Travel' });
    expect(folderService.update).toHaveBeenCalledWith(7, 1, { name: 'Trips' });

    await expect(controller.delete(admin, 1)).resolves.toBeUndefined();
    expect(folderService.delete).toHaveBeenCalledWith(7, 1);
  });

  it('rejects folder mutations for non-admin users', async () => {
    const user = { id: 7, role: 'USER' } as any;

    expect(() => controller.create(user, { name: 'Travel' } as any)).toThrow(
      ForbiddenException,
    );
    expect(() => controller.update(user, 1, { name: 'Trips' } as any)).toThrow(
      ForbiddenException,
    );
    await expect(controller.delete(user, 1)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(folderService.create).not.toHaveBeenCalled();
    expect(folderService.update).not.toHaveBeenCalled();
    expect(folderService.delete).not.toHaveBeenCalled();
  });
});
