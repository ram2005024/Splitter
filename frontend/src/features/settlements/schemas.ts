import { z } from "zod";

export const recordSettlementSchema = z.object({
  receiver_id: z.string().min(1, "Receiver is required"),
  amount: z.coerce.number().positive("Settlement amount must be positive"),
  payment_method: z.string().max(50).optional().nullable(),
  reference_note: z.string().max(255).optional().nullable(),
});

export type RecordSettlementFormData = z.infer<typeof recordSettlementSchema>;
