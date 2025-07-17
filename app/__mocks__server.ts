
const mock = {
  auth: {
    getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } }, error: null })
  },
  from: jest.fn(() => mock),
  update: jest.fn(() => mock),
  eq: jest.fn(() => mock),
  select: jest.fn(() => mock),
  single: jest.fn(() => mock),
  delete: jest.fn(() => mock),
  maybeSingle: jest.fn(() => mock),
  insert: jest.fn(() => mock),
  order: jest.fn(() => mock),
};

export const createClient = jest.fn(() => mock);
