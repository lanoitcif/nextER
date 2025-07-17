import '@testing-library/jest-dom';

// Provide required env vars for tests
process.env.USER_API_KEY_ENCRYPTION_SECRET =
  process.env.USER_API_KEY_ENCRYPTION_SECRET ||
  '12345678901234567890123456789012';
