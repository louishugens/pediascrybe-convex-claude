import { z } from 'zod';

// define a schema for the notifications
export const examsSchema = z.object({
  exam: z.string().describe('Name of a exam.'),
});