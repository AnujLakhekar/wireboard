"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GalleryVerticalEndIcon } from "lucide-react";
import Image from "next/image";
import { BsGithub } from "react-icons/bs";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const { signIn } = useAuthActions();
  const user = useQuery(api.users.viewer);

  console.log("Current user:", user);

  useGSAP(
    () => {
      gsap.from(".login-item", {
        y: 20,
        opacity: 0,
        duration: 0.55,
        stagger: 0.08,
        ease: "power2.out",
      });
    },
    { scope: rootRef },
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = Object.fromEntries(
      new FormData(event.currentTarget).entries(),
    );
    console.log("Login form submitted", payload);
    console.table(payload);
  };

  if (!isClient) {
    return <div className={cn("flex flex-col gap-6", className)} {...props} />;
  }

  return (
    <div
      ref={rootRef}
      className={cn("flex flex-col gap-6", className)}
      {...props}
    >
      <form ref={formRef} onSubmit={handleSubmit}>
        <FieldGroup>
          <div className="login-item flex flex-col items-center gap-2 text-center">
            <a
              href="#"
              className="flex flex-col items-center gap-2 font-medium"
            >
              <div className="flex size-8 items-center justify-center rounded-md">
                <Image
                  src="/logo.png"
                  alt="wireboard logo"
                  width={32}
                  height={32}
                />
              </div>
              <span className="sr-only">wireboard</span>
            </a>
            <h1 className="text-xl font-bold">Welcome to wireboard</h1>
            <FieldDescription>
              Don&apos;t have an account? <a href="#">Sign up</a>
            </FieldDescription>
          </div>
          <Field className="login-item grid gap-3">
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
            />
          </Field>

          <Field className="login-item grid gap-3">
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <a
                href="#"
                className="ml-auto text-sm underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <Input id="password" name="password" type="password" required />
          </Field>

          <Button type="submit" className="login-item w-full">
            Sign In
          </Button>

          <FieldSeparator className="login-item">
            Or continue with
          </FieldSeparator>

          <Field className="login-item grid gap-4 sm:grid-cols-2">
            <Button variant="outline" type="button">
              <BsGithub className="size-5" />
              Continue with Github
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => void signIn("google")}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                  fill="currentColor"
                />
              </svg>
              Continue with Google
            </Button>
          </Field>
        </FieldGroup>
      </form>
      <FieldDescription className="login-item px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  );
}
