// Named `mockPrisma` (not just `prisma`) so it can be referenced inside a
// jest.mock() factory in test files — Jest's hoisting allows references to
// out-of-scope identifiers prefixed with "mock".
export const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  gallery: {
    create: jest.fn(),
  },
};

export function resetPrismaMocks(): void {
  mockPrisma.user.findUnique.mockReset();
  mockPrisma.user.create.mockReset();
  mockPrisma.gallery.create.mockReset();
}
