"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { signUpWithOrganization } from "@/domain/auth/actions";

export default function SignupPage() {
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [orgName, setOrgName] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();
  const { addToast } = useToast();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await signUpWithOrganization({
        full_name: fullName,
        org_name: orgName,
        email,
        password,
      });

      if (!res.success) {
        addToast({
          type: "error",
          title: "Registration Failed",
          description: res.error || "Failed to provision organization account.",
        });
        return;
      }

      addToast({
        type: "success",
        title: "Organization Provisioned",
        description: res.message,
      });
      router.push("/dashboard");
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Failed to provision organization account.";
      addToast({
        type: "error",
        title: "Registration Failed",
        description: errorMsg,
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
            Register new Multi-Tenant Organization Account
          </p>
        </div>

        <Card className="bg-surface shadow-dialog border-restro-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-lg">Create Account</CardTitle>
            <CardDescription>
              Set up your organization tenant root
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSignup}>
            <CardContent className="space-y-4">
              <Input
                label="Full Name"
                placeholder="Jane Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
              <Input
                label="Organization / Company Name"
                placeholder="Grand Hospitality Group"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
              <Input
                label="Corporate Email"
                type="email"
                placeholder="jane@grandhospitality.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </CardContent>
            <CardFooter className="flex flex-col space-y-3">
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Provision Organization <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <div className="text-center text-xs text-restro-500">
                Already registered?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-brand-600 hover:underline"
                >
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
