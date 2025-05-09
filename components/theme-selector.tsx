"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Monitor, Moon, Palette, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeSelector() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true)
  }, [])

  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest("[data-theme-selector]")) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("click", handleClickOutside)
    }

    return () => {
      document.removeEventListener("click", handleClickOutside)
    }
  }, [isOpen])

  if (!mounted) {
    return <Button variant="outline" size="sm" className="w-9 px-0" />
  }

  const themes = [
    {
      name: "Light",
      id: "light",
      icon: Sun,
    },
    {
      name: "Dark",
      id: "dark",
      icon: Moon,
    },
    {
      name: "clove-cream",
      id: "gruvbox",
      icon: Palette,
    },
    {
      name: "clove-purple",
      id: "purple",
      icon: Palette,
    },
    {
      name: "System",
      id: "system",
      icon: Monitor,
    },
  ]

  const currentTheme = themes.find((t) => t.id === theme) || themes[0]
  const Icon = currentTheme.icon

  return (
    <div className="relative" data-theme-selector>
      <Button variant="outline" size="sm" className="gap-1 h-8" onClick={() => setIsOpen(!isOpen)}>
        <Icon className="h-[1.2rem] w-[1.2rem]" />
        <span className="hidden md:inline">{currentTheme.name}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 ml-1"
        >
          <path d={isOpen ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"} />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background border border-border z-50">
          <div className="py-1 rounded-md bg-background">
            {themes.map((t) => {
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id)
                    setIsOpen(false)
                  }}
                  className={cn(
                    "flex items-center gap-2 w-full text-left px-4 py-2 text-sm",
                    theme === t.id ? "bg-accent text-accent-foreground" : "hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t.name}
                  {theme === t.id && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 ml-auto"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
