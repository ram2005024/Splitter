import { z } from "zod";

export const splitParticipantInputSchema = z.object({
  user_id: z.string().min(1, "Participant is required"),
  amount_owed: z.coerce.number().optional().nullable(),
  percentage: z.coerce.number().optional().nullable(),
  shares: z.coerce.number().int().optional().nullable(),
});

export const createExpenseSchema = z
  .object({
    title: z.string().min(1, "Expense title is required").max(150),
    amount: z.coerce.number().positive("Amount must be greater than zero"),
    currency: z.string().length(3),
    payer_id: z.string().optional().nullable(),
    split_type: z.enum(["EQUAL", "EXACT", "PERCENTAGE", "SHARES"]),
    category: z.enum([
      "GENERAL",
      "FOOD_AND_DRINK",
      "TRANSPORTATION",
      "ENTERTAINMENT",
      "UTILITIES",
      "RENT",
      "TRAVEL",
      "GROCERIES",
      "SHOPPING",
      "HEALTH",
    ]),
    notes: z.string().max(500).optional().nullable(),
    date: z.string().optional().nullable(),
    splits: z.array(splitParticipantInputSchema).min(1, "Select at least one participant"),
  })
  .superRefine((val, ctx) => {
    if (val.split_type === "EXACT") {
      const sum = val.splits.reduce((acc, s) => acc + (Number(s.amount_owed) || 0), 0);
      if (Math.abs(sum - val.amount) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Exact split amounts sum to $${sum.toFixed(2)}, which must equal total expense of $${val.amount.toFixed(2)}`,
          path: ["splits"],
        });
      }
    } else if (val.split_type === "PERCENTAGE") {
      const sum = val.splits.reduce((acc, s) => acc + (Number(s.percentage) || 0), 0);
      if (Math.abs(sum - 100) > 0.01) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Split percentages sum to ${sum.toFixed(1)}%, which must equal 100%`,
          path: ["splits"],
        });
      }
    } else if (val.split_type === "SHARES") {
      const sum = val.splits.reduce((acc, s) => acc + (Number(s.shares) || 0), 0);
      if (sum <= 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Total shares must be at least 1`,
          path: ["splits"],
        });
      }
    }
  });

export type CreateExpenseFormData = z.infer<typeof createExpenseSchema>;

export const expenseFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Expense title is required")
    .max(150, "Title cannot exceed 150 characters"),
  amount: z.coerce
    .number({ invalid_type_error: "Amount must be a valid number" })
    .positive("Amount must be greater than zero"),
  category: z.enum([
    "GENERAL",
    "FOOD_AND_DRINK",
    "TRANSPORTATION",
    "ENTERTAINMENT",
    "UTILITIES",
    "RENT",
    "TRAVEL",
    "GROCERIES",
    "SHOPPING",
    "HEALTH",
  ]),
  payer_id: z.string().min(1, "Please select who paid"),
  notes: z
    .string()
    .trim()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
