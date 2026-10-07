import { z } from "zod";

export const createGroupSchema = z.object({
  name: z.string().min(2, "Group name must be at least 2 characters").max(100),
  description: z.string().max(255).optional(),
  currency: z.string().length(3, "Currency must be 3-letter code (e.g., NPR)"),
  group_type: z.enum(["TRIP", "HOME", "COUPLE", "PROJECT", "OTHER"]),
});

export type CreateGroupFormData = z.infer<typeof createGroupSchema>;

export const joinGroupByCodeSchema = z.object({
  invite_code: z
    .string()
    .min(6, "Invite code is too short")
    .max(12, "Invite code is too long")
    .toUpperCase(),
});

export type JoinGroupByCodeFormData = z.infer<typeof joinGroupByCodeSchema>;

export const addMemberSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["ADMIN", "MEMBER"]),
});

export type AddMemberFormData = z.infer<typeof addMemberSchema>;

