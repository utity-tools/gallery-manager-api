// The mock.fn() itself lives in the test file (referenced by a jest.mock()
// factory there) rather than here, to avoid a Jest hoisting/ordering
// edge case: bcryptjs internally requires "crypto" as a side effect of
// being auto-mocked, which fires before a cross-file import of the mock
// would have finished initializing. These helpers just operate on
// whichever jest.fn() is passed in.
export function resetCryptoMock(mock: jest.Mock): void {
  mock.mockReset();
}

// authService does `randomBytes(3).toString("hex")` — this stubs a
// Buffer-shaped value whose toString(...) always returns the given hex,
// so slug-collision suffixes are deterministic in tests.
export function setDeterministicSuffix(mock: jest.Mock, hex: string): void {
  mock.mockReturnValue({ toString: () => hex });
}
