import { auth, signIn } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe } from "lucide-react";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const { callbackUrl } = await searchParams;

  if (session) {
    redirect(callbackUrl || "/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Globe className="h-10 w-10" />
          </div>
          <CardTitle className="text-2xl">Domain Monitor</CardTitle>
          <CardDescription>
            Sign in to monitor your domain expiration dates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", {
                redirectTo: callbackUrl || "/",
              });
            }}
          >
            <Button variant="outline" className="w-full" type="submit">
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 23 23"
                fill="none"
              >
                <rect width="11" height="11" fill="#F25022" />
                <rect x="12" width="11" height="11" fill="#7FBA00" />
                <rect y="12" width="11" height="11" fill="#00A4EF" />
                <rect x="12" y="12" width="11" height="11" fill="#FFB900" />
              </svg>
              Continue with Microsoft
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
