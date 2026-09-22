export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}

export const success = <T>(data: T): ApiResponse<T> => ({
  success: true,
  data,
});

export const failure = (code: string, message: string): ApiResponse<never> => ({
  success: false,
  error: { code, message },
});
