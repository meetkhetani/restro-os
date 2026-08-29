import { z } from "zod";

export const OrganizationSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  logo_url: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export type CreateOrganizationInput = z.infer<typeof OrganizationSchema>;

export const RestaurantSchema = z.object({
  name: z.string().min(2, "Restaurant brand name must be at least 2 characters"),
  code: z
    .string()
    .min(2, "Brand code must be at least 2 characters")
    .regex(/^[A-Z0-9_-]+$/i, "Code must be alphanumeric"),
});

export type CreateRestaurantInput = z.infer<typeof RestaurantSchema>;

export const LocationSchema = z.object({
  restaurant_id: z.string().uuid("Invalid restaurant ID"),
  name: z.string().min(2, "Location name must be at least 2 characters"),
  timezone: z.string().min(1, "Timezone is required"),
  phone: z.string().optional(),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  status: z.enum(["active", "inactive", "maintenance"]).default("active"),
});

export type CreateLocationInput = z.infer<typeof LocationSchema>;

export const AuthLoginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type AuthLoginInput = z.infer<typeof AuthLoginSchema>;

export const AuthSignupSchema = z.object({
  full_name: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  org_name: z.string().min(2, "Organization name is required"),
});

export type AuthSignupInput = z.infer<typeof AuthSignupSchema>;
