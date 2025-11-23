import { ProfileService } from './profile.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ProfileService', () => {
  const upsert = jest.fn();
  const prisma = {
    profile: {
      upsert,
    },
  };

  const service = new ProfileService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('upserts the avatar url for the given user', async () => {
    const profile = { id: 1, userId: 1, avatarUrl: 'avatar.png' };
    upsert.mockResolvedValue(profile);

    await expect(service.updateAvatarUrl(1, 'avatar.png')).resolves.toBe(
      profile,
    );

    expect(upsert).toHaveBeenCalledWith({
      where: { userId: 1 },
      update: { avatarUrl: 'avatar.png' },
      create: { userId: 1, avatarUrl: 'avatar.png' },
    });
  });
});
