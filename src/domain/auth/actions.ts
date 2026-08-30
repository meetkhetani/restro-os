"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  AuthSignupSchema,
  type AuthSignupInput,
  AuthLoginSchema,
  type AuthLoginInput,
} from "@/lib/validations";
import { User } from "@supabase/supabase-js";

export async function signInWithCredentials(input: AuthLoginInput) {
  try {
    const validated = AuthLoginSchema.parse(input);
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email,
      password: validated.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message.includes("Invalid login credentials")
          ? "Invalid email or password."
          : error.message,
      };
    }

    return {
      success: true,
      user: data.user,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Authentication failed.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export async function signUpWithOrganization(input: AuthSignupInput) {
  try {
    const validated = AuthSignupSchema.parse(input);
    const supabase = await createClient();

    let user: User | null = null;
    let isAutoConfirmed = false;

    // Try Admin user creation first if service role key is available to auto-confirm email for frictionless onboarding
    try {
      const adminClient = createAdminClient();
      const { data: adminAuthData, error: adminAuthError } =
        await adminClient.auth.admin.createUser({
          email: validated.email,
          password: validated.password,
          email_confirm: true,
          user_metadata: {
            full_name: validated.full_name,
            org_name: validated.org_name,
          },
        });

      if (!adminAuthError && adminAuthData?.user) {
        user = adminAuthData.user;
        isAutoConfirmed = true;
      }
    } catch {
      // Admin creation unavailable, fallback to standard signup
    }

    // Standard user signup fallback if admin creation wasn't used
    if (!user) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: validated.email,
        password: validated.password,
        options: {
          data: {
            full_name: validated.full_name,
            org_name: validated.org_name,
          },
        },
      });

      if (authError) {
        return {
          success: false,
          error: authError.message,
        };
      }
      user = authData.user;
    }

    if (!user) {
      return {
        success: false,
        error: "Failed to create user account.",
      };
    }

    // Generate clean URL slug from org_name
    const baseSlug = validated.org_name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || `org-${Date.now()}`;
    const slug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

    let dbClient = supabase;
    try {
      dbClient = createAdminClient() as unknown as typeof supabase;
    } catch {
      // Fall back to server client
    }

    // 2. Create Organization
    const { data: org, error: orgError } = await dbClient
      .from("organizations")
      .insert({
        name: validated.org_name,
        slug: slug,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Org creation log:", orgError);
    }

    if (org) {
      // 3. Create Owner Role for Organization
      const { data: ownerRole } = await dbClient
        .from("roles")
        .insert({
          org_id: org.id,
          name: "Owner",
          description: "Full organization governance and administrative control",
          is_system: true,
        })
        .select()
        .single();

      // 4. Create Owner Membership
      if (ownerRole) {
        await dbClient.from("memberships").insert({
          org_id: org.id,
          user_id: user.id,
          role_id: ownerRole.id,
          status: "active",
        });
      }
    }

    return {
      success: true,
      user,
      org,
      isAutoConfirmed,
      message: isAutoConfirmed
        ? "Account & Organization created! Email confirmed automatically."
        : "Registration complete! Please check your email inbox to confirm your account before signing in.",
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "An unexpected registration error occurred.";
    return {
      success: false,
      error: errorMsg,
    };
  }
}
