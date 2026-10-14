"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#EA4335"
        d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
      />
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.4 7.5 23 12 23z"
      />
    </svg>
  );
}

interface GoogleSignInButtonProps {
  isLoading?: boolean;
  onSuccess?: () => void;
  className?: string;
}

export function GoogleSignInButton({
  isLoading: externalLoading,
  onSuccess,
  className,
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const [internalLoading, setInternalLoading] = React.useState(false);
  const [gisLoaded, setGisLoaded] = React.useState(false);
  const googleBtnContainerRef = React.useRef<HTMLDivElement>(null);

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Load Google Identity Services script
  React.useEffect(() => {
    if (!clientId) return;

    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      setGisLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setGisLoaded(true);
    };
    document.body.appendChild(script);
  }, [clientId]);

  // Initialize and render native Google Identity button
  React.useEffect(() => {
    if (!gisLoaded || !clientId || !googleBtnContainerRef.current) return;

    try {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (!response?.credential) return;

          setInternalLoading(true);
          try {
            const { error } = await supabase.auth.signInWithIdToken({
              provider: "google",
              token: response.credential,
            });

            if (error) {
              toast.error("Google sign in failed", { description: error.message });
              return;
            }

            toast.success("Welcome back!", {
              description: "Signed in securely with Google.",
            });

            if (onSuccess) {
              onSuccess();
            } else {
              router.push("/dashboard");
              router.refresh();
            }
          } catch (err: any) {
            toast.error("Authentication error", { description: err.message });
          } finally {
            setInternalLoading(false);
          }
        },
      });

      if (googleBtnContainerRef.current) {
        googleBtnContainerRef.current.innerHTML = "";
        window.google?.accounts.id.renderButton(googleBtnContainerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: 320,
        });
      }
    } catch (err) {
      console.warn("Google Identity initialization fallback:", err);
    }
  }, [gisLoaded, clientId, onSuccess, router, supabase]);

  // Fallback OAuth handler if Client ID is not configured or script hasn't loaded
  const handleOAuthFallback = async () => {
    setInternalLoading(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=/dashboard`,
        },
      });

      if (error) {
        toast.error("Google login failed", { description: error.message });
      }
    } catch {
      toast.error("OAuth connection failed");
    } finally {
      setInternalLoading(false);
    }
  };

  const isLoading = externalLoading || internalLoading;

  return (
    <div className="relative w-full overflow-hidden rounded-xl">
      {/* Custom Styled Hackline Button */}
      <Button
        type="button"
        variant="outline"
        size="md"
        isLoading={isLoading}
        onClick={handleOAuthFallback}
        className={className || "w-full bg-zinc-950/40 border-zinc-800 hover:border-zinc-700"}
      >
        <GoogleIcon className="h-4 w-4" />
        <span className="text-xs font-medium">Google</span>
      </Button>

      {/* Native Google GIS button overlay (invisible, handles click directly on your domain) */}
      {clientId && (
        <div
          ref={googleBtnContainerRef}
          title="Sign in with Google"
          className="absolute inset-0 z-10 opacity-[0.0001] overflow-hidden cursor-pointer flex items-center justify-center scale-150 origin-center"
        />
      )}
    </div>
  );
}
