// Runs before any test file's modules load. authService captures JWT_SECRET
// as a module-level constant at import time, and tests don't load .env
// (that only happens via src/index.ts), so it must be set here — before
// that first static import — rather than inside a test body.
process.env.JWT_SECRET =
  process.env.JWT_SECRET ?? "test-jwt-secret-for-unit-tests";
