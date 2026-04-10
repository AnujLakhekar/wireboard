"use client";

import * as React from "react";

import { useIsMobile } from "@/hooks/use-mobile";

type MobileSupportBlockerProps = {
  children: React.ReactNode;
};

const MOBILE_USER_AGENT_REGEX =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i;

function hasMobileUserAgent() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return MOBILE_USER_AGENT_REGEX.test(navigator.userAgent);
}

export function MobileSupportBlocker({ children }: MobileSupportBlockerProps) {
  const isMobileViewport = useIsMobile();
  const [isReady, setIsReady] = React.useState(false);
  const [isMobileDevice, setIsMobileDevice] = React.useState(false);

  React.useEffect(() => {
    setIsMobileDevice(hasMobileUserAgent());
    setIsReady(true);
  }, []);

  if (!isReady) {
    return null;
  }

  if (isMobileDevice || isMobileViewport) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 py-12">
        <section className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
          <h1 className="text-2xl font-semibold">Desktop Only</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Wireboard is currently available on desktop and larger screens only. Please
            open this app on a laptop or desktop device.
          </p>
        </section>
      </main>
    );
  }

  return <>{children}</>;
}