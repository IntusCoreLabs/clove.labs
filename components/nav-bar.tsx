"use client";

import { ThemeSelector } from "@/components/theme-selector";
import Link from "next/link";
import { Button } from "./ui/button";
import { useClerk, useUser } from "@clerk/nextjs";

export function NavBar() {
  const { signOut } = useClerk();
  const { isSignedIn } = useUser();

  return (
    <header className="border-b p-4 flex items-center justify-between bg-background">
      <Link href="/" className="text-xl font-bold">
        clove
      </Link>
      <div className="flex items-center gap-2">
        <ThemeSelector />
        {isSignedIn && (
          <Button
            variant="destructive"
            size="sm"
            className="bg-destructive/90 hover:bg-primary"
            onClick={() => signOut({ redirectUrl: "https://clove.labs.vercel.app" })}
          >
            Log out
          </Button>
        )}
      </div>
    </header>
  );
}
