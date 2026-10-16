"use client";

import * as React from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { GoogleIcon } from "@/components/icons/OAuthIcons";

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

interface GoogleSignInButtonProps {
  isLoading?: boolean;
  onSuccess?: () => void;
  className?: string;
  redirectPath?: string;
}

export function GoogleSignInButton({
  isLoading: externalLoading,
  onSuccess,
  className,
  redirectPath = "/dashboard",
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
              router.push(redirectPath);
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
  }, [gisLoaded, clientId, onSuccess, router, supabase, redirectPath]);

  // Fallback OAuth handler if Client ID is not configured or script hasn't loaded
  const handleOAuthFallback = async () => {
    setInternalLoading(true);
    try {
      const origin = window.location.origin;
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(redirectPath)}`,
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
        className={className || "w-full bg-canvas border-surface-border text-parchment hover:border-mustard/40 hover:bg-surface-elevated"}
      >
        <GoogleIcon className="h-4 w-4 shrink-0" />
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
