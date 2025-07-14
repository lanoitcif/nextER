import { z } from 'zod';

export const analyzeRequestSchema = z.object({
  transcript: z.string().min(1),
  companyId: z.string().uuid(),
  companyTypeId: z.string(),
  keySource: z.enum(['owner', 'user_saved', 'user_temporary']),
  userApiKeyId: z.string().uuid().optional(),
  temporaryApiKey: z.string().optional(),
  provider: z.enum(['openai', 'anthropic', 'google', 'cohere']),
  model: z.string().optional(),
});

export const addApiKeyRequestSchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google', 'cohere']),
  apiKey: z.string().min(1),
  nickname: z.string().optional(),
  preferredModel: z.string().optional(),
});

export const updateApiKeyRequestSchema = z.object({
  nickname: z.string().optional(),
  preferredModel: z.string().optional(),
});
