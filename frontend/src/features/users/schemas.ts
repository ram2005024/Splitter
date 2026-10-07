import { z } from "zod";

export const profileSchema = z.object({
  phone_number: z
    .string()
    .trim()
    .max(20, "Phone number cannot exceed 20 characters")
    .optional()
    .or(z.literal("")),
  default_currency: z
    .string()
    .length(3, "Currency code must be 3 characters")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(300, "Bio cannot exceed 300 characters")
    .optional()
    .or(z.literal("")),
  payment_handle: z
    .string()
    .trim()
    .max(100, "Payment handle cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  avatar_url: z
    .string()
    .trim()
    .refine((val) => !val || val === "" || /^https?:\/\/.+/.test(val), {
      message: "Avatar must be a valid URL starting with http:// or https://",
    })
    .optional()
    .or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
