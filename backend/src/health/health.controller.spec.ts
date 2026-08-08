import { HealthController } from './health.controller';
import { PrismaService } from 'src/prisma/prisma.service';

describe('HealthController', () => {
  const queryRaw = jest.fn();
  const controller = new HealthController({
    $queryRaw: queryRaw,
  } as unknown as PrismaService);

  beforeEach(() => {
    queryRaw.mockReset();
  });

  it('reports readiness after the database responds', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('fails readiness when the database query fails', async () => {
    queryRaw.mockRejectedValue(new Error('database unavailable'));

    await expect(controller.check()).rejects.toThrow('database unavailable');
  });
});
