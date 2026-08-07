import { z } from "zod";

export const UserAccountData = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name must be at least 2 characters")
    .regex(/^[A-Za-z]+$/, "First name can only contain letters."),
  lastName: z
    .string()
    .trim()
    .min(3, "Last name must be at least 3 characters")
    .regex(/^[A-Za-z]+$/, "Last name can only contain letters."),
  DOB: z.iso.date("Date must be in YYYY-MM-DD format").refine(
    (dateStr) => {
      const birthDate = new Date(dateStr);
      const today = new Date();
      return birthDate <= today;
    },
    { message: "Date of birth cannot be in the future" },
  ),
});

export type UserAccountData = z.infer<typeof UserAccountData>;
