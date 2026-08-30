"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent multiple simultaneous login requests
    if (isLoading) return;

    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      addToast({
        type: "error",
        title: "Validation Error",
        description: "Please fill in both email and password.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      // Call Supabase Auth directly with normalized email and unmodified password
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password,
      });

      if (error) {
        const lowerMsg = error.message.toLowerCase();
        let toastTitle = "Authentication Failed";
        let toastDescription = "Invalid email or password.";
        let toastType: "error" | "warning" | "info" = "error";

        if (lowerMsg.includes("email not confirmed")) {
          toastTitle = "Email Verification Required";
          toastDescription = "Your account email has not been verified yet. Check your inbox or disable 'Confirm email' in Supabase Auth settings.";
          toastType = "warning";
        } else if (lowerMsg.includes("invalid login credentials") || lowerMsg.includes("invalid credentials")) {
          toastTitle = "Authentication Failed";
          toastDescription = "Invalid email or password.";
          toastType = "error";
        } else if (lowerMsg.includes("fetch") || lowerMsg.includes("network") || lowerMsg.includes("failed to fetch")) {
          toastTitle = "Connection Error";
          toastDescription = "Unable to connect to authentication service.";
          toastType = "error";
        } else {
          toastDescription = error.message;
        }

        addToast({
          type: toastType,
          title: toastTitle,
          description: toastDescription,
        });
      } else {
        addToast({
          type: "success",
          title: "Welcome Back",
          description: "Signed in successfully to Restro OS.",
        });
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      addToast({
        type: "error",
        title: "Authentication Unavailable",
        description: msg.includes("Missing Supabase")
          ? "Authentication service is temporarily unavailable due to missing server configuration."
          : "Unable to connect to authentication service.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand-500 text-white shadow-card">
            <UtensilsCrossed className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-restro-900 tracking-tight">
            RESTRO <span className="text-brand-500">OS</span>
          </h1>
          <p className="text-xs font-medium text-restro-500">
            Sign in to access your restaurant operating portal
          </p>
        </div>

        <Card className="bg-surface shadow-dialog border-restro-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Sign In</CardTitle>
            <CardDescription>
              Enter your corporate credentials to continue
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <Input
                label="Corporate Email"
                type="email"
                placeholder="operator@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
                Sign In to Platform <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="text-center text-xs text-restro-500">
                Don&apos;t have an organization account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Register Organization
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-[11px] text-restro-400">
          Secured by Supabase Auth with Row Level Security Policies
        </p>
      </div>
    </div>
  );
}
