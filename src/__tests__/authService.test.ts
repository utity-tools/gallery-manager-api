import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import { mockPrisma, resetPrismaMocks } from "./mocks/prisma";
import { resetCryptoMock, setDeterministicSuffix } from "./mocks/crypto";
import { SignUpInput, LoginInput } from "../schemas/auth";

jest.mock("../db/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
}));

jest.mock("bcryptjs");
jest.mock("jsonwebtoken");
// Self-contained factory (no outer-scope reference) — jest.mock("bcryptjs")
// eagerly loads the real bcryptjs module to build its automock shape, which
// transitively requires "crypto" before this file's own top-level `const`s
// would have run, so a factory closing over an external mock.fn() throws
// "Cannot access before initialization". Grabbing the reference back out
// via the normal import below (same pattern as bcrypt/jwt) sidesteps that.
jest.mock("node:crypto", () => ({ randomBytes: jest.fn() }));

// Imported after the jest.mock() calls above (which Jest hoists anyway) so
// this always binds to the mocked dependencies.
import {
  signUp,
  login,
  generateToken,
  hashPassword,
  validatePassword,
} from "../services/authService";

const mockBcryptHash = bcrypt.hash as unknown as jest.Mock;
const mockBcryptCompare = bcrypt.compare as unknown as jest.Mock;
const mockJwtSign = jwt.sign as unknown as jest.Mock;
const mockRandomBytes = randomBytes as unknown as jest.Mock;

// Prisma create() calls in authService only read back what they were given
// (id + timestamps + whatever `data` held), so echoing `data` back keeps
// these fixtures honest without hardcoding duplicate literals per test.
function mockUserCreate(): void {
  mockPrisma.user.create.mockImplementation(
    async ({ data }: { data: Record<string, unknown> }) => ({
      id: "user-1",
      avatarUrl: null,
      googleId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }),
  );
}

function mockGalleryCreate(): void {
  mockPrisma.gallery.create.mockImplementation(
    async ({ data }: { data: Record<string, unknown> }) => ({
      id: "gallery-1",
      isPublic: true,
      theme: "light",
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    }),
  );
}

describe("authService", () => {
  beforeEach(() => {
    resetPrismaMocks();
    resetCryptoMock(mockRandomBytes);
    mockBcryptHash.mockReset().mockResolvedValue("hashed-password");
    mockBcryptCompare.mockReset().mockResolvedValue(true);
    mockJwtSign.mockReset().mockReturnValue("fake-jwt-token");
    setDeterministicSuffix(mockRandomBytes, "abc123");
  });

  describe("signUp", () => {
    it("crea user + gallery y retorna SignupResponse", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockUserCreate();
      mockGalleryCreate();

      const input: SignUpInput = {
        email: "jane@example.com",
        password: "password123",
        name: "Jane Doe",
        type: "individual",
      };

      const result = await signUp(input);

      expect(result.user).toEqual({
        id: "user-1",
        email: "jane@example.com",
        name: "Jane Doe",
        slug: "jane-doe",
      });
      expect(result.gallery).toEqual({ id: "gallery-1", title: "Jane Doe" });
    });

    it("rechaza email duplicado con USER_EXISTS 409", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: "existing",
        email: "jane@example.com",
      });

      const input: SignUpInput = {
        email: "jane@example.com",
        password: "password123",
        name: "Jane Doe",
      };

      await expect(signUp(input)).rejects.toMatchObject({
        code: "USER_EXISTS",
        statusCode: 409,
      });
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });

    it("genera slug único agregando sufijo si el slug base ya existe", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce(null) // email check: free
        .mockResolvedValueOnce({ id: "other-user", slug: "jane-doe" }) // slug check #1: taken
        .mockResolvedValueOnce(null); // slug check #2: free after suffix
      mockUserCreate();
      mockGalleryCreate();

      await signUp({
        email: "jane2@example.com",
        password: "password123",
        name: "Jane Doe",
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: "jane-doe-abc123" }),
        }),
      );
      expect(mockRandomBytes).toHaveBeenCalledWith(3);
    });

    it("hashea el password con bcrypt antes de guardarlo", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockUserCreate();
      mockGalleryCreate();

      await signUp({
        email: "jane@example.com",
        password: "plain-password",
        name: "Jane Doe",
      });

      expect(mockBcryptHash).toHaveBeenCalledWith("plain-password", 10);
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ passwordHash: "hashed-password" }),
        }),
      );
    });

    it("usa 'user' como slug base si el nombre no produce caracteres válidos", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockUserCreate();
      mockGalleryCreate();

      await signUp({
        email: "weird@example.com",
        password: "password123",
        name: "!!!",
      });

      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ slug: "user" }),
        }),
      );
    });

    it("usa el prefijo del email como nombre si no se provee 'name'", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockUserCreate();
      mockGalleryCreate();

      const result = await signUp({
        email: "carla@example.com",
        password: "password123",
      });

      expect(result.user.name).toBe("carla");
      expect(mockPrisma.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ name: "carla", slug: "carla" }),
        }),
      );
    });

    it("crea una gallery automáticamente para el nuevo usuario", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockUserCreate();
      mockGalleryCreate();

      await signUp({
        email: "jane@example.com",
        password: "password123",
        name: "Jane Doe",
      });

      expect(mockPrisma.gallery.create).toHaveBeenCalledWith({
        data: { userId: "user-1", title: "Jane Doe", description: "" },
      });
    });
  });

  describe("login", () => {
    it("retorna user, gallery y accessToken válidos", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "jane@example.com",
        name: "Jane Doe",
        slug: "jane-doe",
        passwordHash: "hashed-password",
        galleries: [{ id: "gallery-1", title: "Jane Doe" }],
      });

      const input: LoginInput = {
        email: "jane@example.com",
        password: "password123",
      };
      const result = await login(input);

      expect(result.user).toEqual({
        id: "user-1",
        email: "jane@example.com",
        name: "Jane Doe",
        slug: "jane-doe",
      });
      expect(result.gallery).toEqual({ id: "gallery-1", title: "Jane Doe" });
      expect(result.accessToken).toBe("fake-jwt-token");
    });

    it("rechaza con INVALID_CREDENTIALS 401 si el email no existe", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        login({ email: "nope@example.com", password: "x" }),
      ).rejects.toMatchObject({
        code: "INVALID_CREDENTIALS",
        statusCode: 401,
      });
    });

    it("rechaza con INVALID_CREDENTIALS si la password no coincide", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "jane@example.com",
        passwordHash: "hashed",
        galleries: [{ id: "gallery-1", title: "x" }],
      });
      mockBcryptCompare.mockResolvedValue(false);

      await expect(
        login({ email: "jane@example.com", password: "wrong" }),
      ).rejects.toMatchObject({
        code: "INVALID_CREDENTIALS",
        statusCode: 401,
      });
    });

    it("rechaza con INVALID_CREDENTIALS si el usuario no tiene passwordHash", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "jane@example.com",
        passwordHash: null,
        galleries: [],
      });

      await expect(
        login({ email: "jane@example.com", password: "x" }),
      ).rejects.toMatchObject({
        code: "INVALID_CREDENTIALS",
      });
      expect(mockBcryptCompare).not.toHaveBeenCalled();
    });

    it("lanza INTERNAL_ERROR si el usuario no tiene gallery", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "jane@example.com",
        passwordHash: "hashed",
        galleries: [],
      });

      await expect(
        login({ email: "jane@example.com", password: "x" }),
      ).rejects.toMatchObject({
        code: "INTERNAL_ERROR",
        statusCode: 500,
      });
    });

    it("firma el token con id, email y slug del usuario", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "jane@example.com",
        name: "Jane Doe",
        slug: "jane-doe",
        passwordHash: "hashed",
        galleries: [{ id: "gallery-1", title: "x" }],
      });

      await login({ email: "jane@example.com", password: "x" });

      expect(mockJwtSign).toHaveBeenCalledWith(
        { id: "user-1", email: "jane@example.com", slug: "jane-doe" },
        expect.any(String),
        { expiresIn: "24h" },
      );
    });
  });

  describe("hashPassword", () => {
    it("retorna un hash distinto al password original", async () => {
      mockBcryptHash.mockResolvedValue("$2a$10$totally-different-value");

      const result = await hashPassword("my-plain-password");

      expect(result).not.toBe("my-plain-password");
      expect(mockBcryptHash).toHaveBeenCalledWith("my-plain-password", 10);
    });
  });

  describe("validatePassword", () => {
    it("compara la password candidata contra el hash en el orden correcto", async () => {
      mockBcryptCompare.mockResolvedValue(true);

      const result = await validatePassword(
        "stored-hash",
        "candidate-password",
      );

      expect(mockBcryptCompare).toHaveBeenCalledWith(
        "candidate-password",
        "stored-hash",
      );
      expect(result).toBe(true);
    });
  });

  describe("generateToken", () => {
    it("firma con expiresIn '24h'", () => {
      generateToken("user-1", "jane@example.com", "jane-doe");

      expect(mockJwtSign).toHaveBeenCalledWith(
        { id: "user-1", email: "jane@example.com", slug: "jane-doe" },
        expect.any(String),
        { expiresIn: "24h" },
      );
    });

    it("lanza error si JWT_SECRET no está configurado", () => {
      const original = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      // JWT_SECRET is captured as a module-level const at import time, so
      // changing process.env alone wouldn't affect the already-imported
      // authService above. jest.resetModules() forces a fresh module
      // instance on the next require() (jest.mock() registrations survive
      // resetModules(), so the mocked deps still apply).
      jest.resetModules();
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const freshAuthService =
        require("../services/authService") as typeof import("../services/authService");

      expect(() =>
        freshAuthService.generateToken("id", "email", "slug"),
      ).toThrow();

      process.env.JWT_SECRET = original;
      jest.resetModules();
    });
  });
});
