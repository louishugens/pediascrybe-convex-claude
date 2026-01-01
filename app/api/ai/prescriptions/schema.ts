import { z } from 'zod';

export const prescriptionsSchema = z.object({
    drug: z.string().describe('Name of a drug.'),
    count: z.number().describe('Quantity of the drug.'),
    unit: z.string().describe('Unit of the drug.'),
    posology: z.string().describe('Posology of the drug. How to take the drug.'),
});