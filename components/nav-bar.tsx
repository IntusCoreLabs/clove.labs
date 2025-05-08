"use client"
import { ThemeSelector } from "@/components/theme-selector"
import Link from "next/link"

export function NavBar() {
  return (
    <header className="border-b p-4 flex items-center justify-between bg-background">
      <Link href="/" className="text-xl font-bold">
        clove
      </Link>
      <div className="flex items-center gap-2">
        <ThemeSelector />
      </div>
    </header>
  )
}
