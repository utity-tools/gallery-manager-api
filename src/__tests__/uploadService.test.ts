import { Readable } from "node:stream";
import { uploadImage } from "../services/uploadService";
import { getSupabaseClient } from "../db/supabase";
import { assertGalleryOwnership } from "../utils/ownership";
import { createError, ERRORS } from "../errors/AppErrors";
import {
  mockSupabaseClient,
  resetSupabaseMocks,
  setupSuccessfulUpload,
  setupUploadError,
} from "./mocks/supabase";

// uploadService talks to Supabase Storage via getSupabaseClient() (not a
// `supabase` export — the module has no such export) and enforces gallery
// ownership via assertGalleryOwnership() (a real Prisma query). Both are
// mocked here so these are true unit tests with no network/DB calls.
jest.mock("../db/supabase", () => ({
  getSupabaseClient: jest.fn(),
}));

jest.mock("../utils/ownership", () => ({
  assertGalleryOwnership: jest.fn(),
}));

// `uuid` ships as pure ESM in node_modules; Jest's CJS runtime can't
// require() it directly, and we don't need the real implementation here.
jest.mock("uuid", () => ({ v4: () => "test-uuid" }));

const mockGetSupabaseClient = getSupabaseClient as jest.Mock;
const mockAssertGalleryOwnership = assertGalleryOwnership as jest.Mock;

const USER_ID = "user-123";
const GALLERY_ID = "gallery-123";

function createMockFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  return {
    fieldname: "file",
    originalname: "test.jpg",
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 1024,
    buffer: Buffer.from("file-content"),
    destination: "",
    filename: "",
    path: "",
    stream: undefined as unknown as Readable,
    ...overrides,
  };
}

describe("uploadService", () => {
  beforeEach(() => {
    resetSupabaseMocks();
    mockGetSupabaseClient.mockReset().mockReturnValue(mockSupabaseClient);
    mockAssertGalleryOwnership
      .mockReset()
      .mockResolvedValue({ id: GALLERY_ID, userId: USER_ID });
  });

  describe("uploadImage", () => {
    it("debería subir imagen exitosamente y retornar URL pública", async () => {
      const publicUrl = "https://example.com/artworks/test.jpg";
      setupSuccessfulUpload(publicUrl);

      const result = await uploadImage(USER_ID, GALLERY_ID, createMockFile());

      expect(result).toEqual({ url: publicUrl });
    });

    it("debería validar que el archivo sea imagen", async () => {
      const file = createMockFile({
        mimetype: "application/pdf",
        originalname: "test.pdf",
      });

      await expect(uploadImage(USER_ID, GALLERY_ID, file)).rejects.toThrow(
        "Only image files allowed",
      );
      await expect(
        uploadImage(USER_ID, GALLERY_ID, file),
      ).rejects.toMatchObject({
        code: "INVALID_FILE_TYPE",
        statusCode: 400,
      });
    });

    it("debería validar tamaño máximo de 10MB", async () => {
      const file = createMockFile({ size: 11 * 1024 * 1024 });

      await expect(uploadImage(USER_ID, GALLERY_ID, file)).rejects.toThrow(
        "File too large",
      );
      await expect(
        uploadImage(USER_ID, GALLERY_ID, file),
      ).rejects.toMatchObject({
        code: "FILE_TOO_LARGE",
        statusCode: 413,
      });
    });

    it("debería requerir que se provea un archivo", async () => {
      await expect(
        uploadImage(USER_ID, GALLERY_ID, undefined),
      ).rejects.toMatchObject({
        code: "NO_FILE",
      });
    });

    it("debería requerir galleryId", async () => {
      await expect(
        uploadImage(USER_ID, undefined, createMockFile()),
      ).rejects.toMatchObject({
        code: "MISSING_GALLERY_ID",
      });
    });

    it("debería rechazar el upload si el usuario no es dueño de la galería", async () => {
      mockAssertGalleryOwnership.mockRejectedValue(
        createError(ERRORS.FORBIDDEN, {
          message: "You do not have permission to access this gallery",
        }),
      );

      await expect(
        uploadImage(USER_ID, GALLERY_ID, createMockFile()),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        statusCode: 403,
      });
    });

    it("debería propagar 404 si la galería no existe", async () => {
      mockAssertGalleryOwnership.mockRejectedValue(
        createError(ERRORS.GALLERY_NOT_FOUND),
      );

      await expect(
        uploadImage(USER_ID, GALLERY_ID, createMockFile()),
      ).rejects.toMatchObject({
        code: "GALLERY_NOT_FOUND",
        statusCode: 404,
      });
    });

    it("debería manejar errores de Supabase correctamente", async () => {
      setupUploadError("Storage error");

      await expect(
        uploadImage(USER_ID, GALLERY_ID, createMockFile()),
      ).rejects.toMatchObject({
        code: "UPLOAD_FAILED",
        message: "Storage error",
      });
    });

    it("debería aceptar múltiples formatos de imagen", async () => {
      const formatos = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      const publicUrl = "https://example.com/test.jpg";

      for (const tipo of formatos) {
        setupSuccessfulUpload(publicUrl);
        const file = createMockFile({ mimetype: tipo });

        const result = await uploadImage(USER_ID, GALLERY_ID, file);

        expect(result).toEqual({ url: publicUrl });
        resetSupabaseMocks();
      }
    });
  });
});
