"use client"

import { Moon, Sun } from "lucide-react"

interface ThemeToggleProps {
  isDarkMode?: boolean
}

export function ThemeToggle({ isDarkMode = false }: ThemeToggleProps) {
  return isDarkMode ? <Sun className="h-5 w-5 text-gray-300" /> : <Moon className="h-5 w-5 text-gray-700" />
}

