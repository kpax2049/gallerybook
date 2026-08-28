import { ProfileService } from './profile.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ProfileService', () => {
  const findUnique = jest.fn();
  const upsert = jest.fn();
  const transaction = jest.fn();
  const prisma = {
    profile: {
      findUnique,
      upsert,
    },
    $transaction: transaction,
  };

  const service = new ProfileService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    transaction.mockImplementation((callback) => callback(prisma));
  });

  it('upserts avatar metadata and returns the prior provider asset id', async () => {
    const profile = {
      id: 1,
      userId: 1,
      avatarUrl: 'avatar.png',
      avatarPublicId: 'new-avatar',
    };
    findUnique.mockResolvedValue({ avatarPublicId: 'old-avatar' });
    upsert.mockResolvedValue(profile);

    await expect(
      service.replaceAvatar(1, 'avatar.png', 'new-avatar'),
    ).resolves.toEqual({ profile, previousAvatarPublicId: 'old-avatar' });

    expect(findUnique).toHaveBeenCalledWith({
      where: { userId: 1 },
      select: { avatarPublicId: true },
    });
    expect(upsert).toHaveBeenCalledWith({
      where: { userId: 1 },
      update: { avatarUrl: 'avatar.png', avatarPublicId: 'new-avatar' },
      create: {
        userId: 1,
        avatarUrl: 'avatar.png',
        avatarPublicId: 'new-avatar',
      },
    });
  });
});
