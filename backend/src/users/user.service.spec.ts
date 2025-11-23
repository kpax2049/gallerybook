import { UserService } from './user.service';
import { PrismaService } from 'src/prisma/prisma.service';

type MockedPrisma = {
  user: {
    findUnique: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
  };
};

describe('UserService', () => {
  let service: UserService;
  let prisma: MockedPrisma;

  beforeEach(() => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
      },
    };

    service = new UserService(prisma as unknown as PrismaService);
  });

  it('fetches a user profile with avatar when calling getUser', async () => {
    const user = {
      id: 1,
      email: 'a@example.com',
      profile: { avatarUrl: 'avatar.png' },
    };
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.getUser(1)).resolves.toBe(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      include: { profile: { select: { avatarUrl: true } } },
    });
  });

  it('updates the user and strips the hash when calling editUser', async () => {
    const updatedUser = { id: 1, email: 'new@example.com', hash: 'secret' };
    prisma.user.update.mockResolvedValue(updatedUser);

    const result = await service.editUser(1, { email: 'new@example.com' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: { email: 'new@example.com' },
    });
    expect(result).toEqual({ id: 1, email: 'new@example.com' });
    expect(result.hash).toBeUndefined();
  });

  it('returns all users from getUsers', async () => {
    prisma.user.findMany.mockResolvedValue([{ id: 1 }]);

    await expect(service.getUsers()).resolves.toEqual([{ id: 1 }]);
    expect(prisma.user.findMany).toHaveBeenCalledWith();
  });

  it('returns id and hash when finding by id', async () => {
    const user = { id: 1, hash: 'hash' };
    prisma.user.findUnique.mockResolvedValue(user);

    await expect(service.findByIdWithPasswordHash(1)).resolves.toBe(user);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, hash: true },
    });
  });

  it('updates password metadata and increments tokenVersion', async () => {
    prisma.user.update.mockResolvedValue({ id: 1 });

    await service.updatePasswordAfterChange(1, 'newHash');

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 1 },
      data: {
        hash: 'newHash',
        passwordUpdatedAt: expect.any(Date),
        tokenVersion: { increment: 1 },
      },
      select: { id: true },
    });
  });

  it('fetches passwordUpdatedAt timestamp', async () => {
    const row = { id: 1, passwordUpdatedAt: new Date('2020-01-01') };
    prisma.user.findUnique.mockResolvedValue(row);

    await expect(service.getPasswordUpdatedAt(1)).resolves.toBe(row);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, passwordUpdatedAt: true },
    });
  });

  it('fetches token version', async () => {
    const row = { id: 1, tokenVersion: 3 };
    prisma.user.findUnique.mockResolvedValue(row);

    await expect(service.getTokenVersion(1)).resolves.toBe(row);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true, tokenVersion: true },
    });
  });
});
