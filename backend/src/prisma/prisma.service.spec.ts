import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

// Mock PrismaClient so we don't hit a real database
jest.mock('@prisma/client', () => {
  const deleteMany = jest.fn();
  const transaction = jest.fn();
  class PrismaClient {
    gallery: { deleteMany: jest.Mock };
    user: { deleteMany: jest.Mock };
    $transaction: jest.Mock;
    constructor(options) {
      (PrismaClient as any).__options = options;
      this.gallery = { deleteMany };
      this.user = { deleteMany };
      this.$transaction = transaction;
    }
  }
  (PrismaClient as any).__deleteMany = deleteMany;
  (PrismaClient as any).__transaction = transaction;
  return { PrismaClient };
});

describe('PrismaService', () => {
  let service: PrismaService;
  let config: ConfigService;
  const dbUrl = 'postgres://user:pass@localhost:5432/db';
  let mockDeleteMany: jest.Mock;
  let mockTransaction: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    config = { get: jest.fn().mockReturnValue(dbUrl) } as any;
    service = new PrismaService(config);
    const prismaModule = require('@prisma/client');
    const ctor = prismaModule.PrismaClient as any;
    mockDeleteMany = ctor.__deleteMany;
    mockTransaction = ctor.__transaction;
  });

  it('passes database url from ConfigService into PrismaClient', () => {
    const prismaModule = require('@prisma/client');
    const ctor = prismaModule.PrismaClient as any;
    expect(ctor.__options).toEqual({
      datasources: { db: { url: dbUrl } },
    });
    expect(ctor.__options).toEqual({
      datasources: { db: { url: dbUrl } },
    });
  });

  it('cleanDb issues deleteMany calls inside a transaction', async () => {
    mockTransaction.mockResolvedValue('ok');
    mockDeleteMany.mockReturnValue('deleted');

    await expect(service.cleanDb()).resolves.toBe('ok');
    expect(mockDeleteMany).toHaveBeenCalledTimes(2);
    expect(mockTransaction).toHaveBeenCalledWith(['deleted', 'deleted']);
  });
});
