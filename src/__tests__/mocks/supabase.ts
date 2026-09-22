import { SupabaseClient } from "@supabase/supabase-js";

// The upload/getPublicUrl mocks are created once, outside the `from()`
// factory. The original sample created a fresh jest.fn() inside `from()`,
// so configuring the mock via one `.from()` call had no effect on the
// `.from()` call the real code makes later — this fixes that.
const uploadMock = jest.fn();
const getPublicUrlMock = jest.fn();
const fromMock = jest.fn(() => ({
  upload: uploadMock,
  getPublicUrl: getPublicUrlMock,
}));

export const mockSupabaseClient = {
  storage: { from: fromMock },
} as unknown as SupabaseClient;

export function resetSupabaseMocks(): void {
  uploadMock.mockReset();
  getPublicUrlMock.mockReset();
  fromMock.mockClear();
}

export function setupSuccessfulUpload(url: string): void {
  uploadMock.mockResolvedValue({ data: { path: "test-path" }, error: null });
  getPublicUrlMock.mockReturnValue({ data: { publicUrl: url } });
}

export function setupUploadError(message: string): void {
  uploadMock.mockResolvedValue({ data: null, error: { message } });
}
