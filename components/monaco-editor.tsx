"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import Editor, { type Monaco } from "@monaco-editor/react"
import type { editor } from "monaco-editor"

interface MonacoEditorProps {
  value: string
  language: string
  readOnly?: boolean
  height?: string
  onChange?: (value: string | undefined) => void
}

export function MonacoEditor({
  value,
  language,
  readOnly = true,
  height = "calc(100vh - 200px)",
  onChange,
}: MonacoEditorProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [editorTheme, setEditorTheme] = useState<string>("vs-light")

  // Evitar hidratación incorrecta
  useEffect(() => {
    setMounted(true)
  }, [])

  // Actualizar el tema del editor cuando cambia el tema de la aplicación
  useEffect(() => {
    if (!mounted) return

    switch (theme) {
      case "dark":
        setEditorTheme("app-dark")
        break
      case "gruvbox":
        setEditorTheme("gruvbox")
        break
      case "purple":
        setEditorTheme("purple")
        break
      default:
        setEditorTheme("vs-light")
        break
    }
  }, [theme, mounted])

  // Configurar temas personalizados para Monaco Editor
  const handleEditorWillMount = (monaco: Monaco) => {
    // Definir tema Dark que coincida con la aplicación
    monaco.editor.defineTheme("app-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "6A9955", fontStyle: "italic" },
        { token: "keyword", foreground: "569CD6" },
        { token: "string", foreground: "CE9178" },
        { token: "number", foreground: "B5CEA8" },
        { token: "function", foreground: "DCDCAA" },
        { token: "type", foreground: "4EC9B0" },
        { token: "identifier", foreground: "D4D4D4" },
        { token: "variable", foreground: "9CDCFE" },
      ],
      colors: {
        // Usar los mismos colores que la aplicación en modo oscuro
        "editor.background": "#0f1729", // --background: 222.2 84% 4.9%
        "editor.foreground": "#e1e7ef", // --foreground: 210 40% 98%
        "editorCursor.foreground": "#e1e7ef",
        "editor.lineHighlightBackground": "#1e293b", // --secondary: 217.2 32.6% 17.5%
        "editorLineNumber.foreground": "#64748b", // --muted-foreground
        "editor.selectionBackground": "#2d3748",
        "editor.inactiveSelectionBackground": "#1e293b",
        "editorSuggestWidget.background": "#0f1729",
        "editorSuggestWidget.border": "#1e293b",
        "editorSuggestWidget.foreground": "#e1e7ef",
        "editorSuggestWidget.selectedBackground": "#2d3748",
        "editorSuggestWidget.highlightForeground": "#3b82f6", // --primary
        "editorWidget.background": "#0f1729",
        "editorWidget.border": "#1e293b",
        "editorHoverWidget.background": "#0f1729",
        "editorHoverWidget.border": "#1e293b",
        "editorIndentGuide.background": "#1e293b",
        "editorIndentGuide.activeBackground": "#3e4c5e",
      },
    })

    // Definir tema Gruvbox
    monaco.editor.defineTheme("gruvbox", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "928374", fontStyle: "italic" },
        { token: "keyword", foreground: "fb4934" },
        { token: "string", foreground: "b8bb26" },
        { token: "number", foreground: "d3869b" },
        { token: "function", foreground: "fabd2f" },
        { token: "type", foreground: "8ec07c" },
        { token: "identifier", foreground: "ebdbb2" },
        { token: "variable", foreground: "83a598" },
      ],
      colors: {
        "editor.background": "#282828",
        "editor.foreground": "#ebdbb2",
        "editor.lineHighlightBackground": "#3c3836",
        "editorCursor.foreground": "#ebdbb2",
        "editorWhitespace.foreground": "#504945",
        "editorIndentGuide.background": "#504945",
        "editor.selectionBackground": "#504945",
        "editor.inactiveSelectionBackground": "#3c3836",
        "editorSuggestWidget.background": "#282828",
        "editorSuggestWidget.border": "#504945",
        "editorSuggestWidget.foreground": "#ebdbb2",
        "editorSuggestWidget.selectedBackground": "#504945",
        "editorWidget.background": "#282828",
        "editorWidget.border": "#504945",
      },
    })

    // Definir tema Purple (estilo Slack)
    monaco.editor.defineTheme("purple", {
      base: "vs-dark",
      inherit: true,
      rules: [
        { token: "comment", foreground: "7f848e", fontStyle: "italic" },
        { token: "keyword", foreground: "c678dd" },
        { token: "string", foreground: "98c379" },
        { token: "number", foreground: "e5c07b" },
        { token: "function", foreground: "61afef" },
        { token: "type", foreground: "56b6c2" },
        { token: "identifier", foreground: "e9e1f8" },
        { token: "variable", foreground: "bd93f9" },
      ],
      colors: {
        "editor.background": "#1a1025",
        "editor.foreground": "#e9e1f8",
        "editor.lineHighlightBackground": "#2d1e42",
        "editorCursor.foreground": "#e9e1f8",
        "editorWhitespace.foreground": "#4c3a70",
        "editorIndentGuide.background": "#4c3a70",
        "editor.selectionBackground": "#4c3a70",
        "editor.inactiveSelectionBackground": "#2d1e42",
        "editorSuggestWidget.background": "#1a1025",
        "editorSuggestWidget.border": "#4c3a70",
        "editorSuggestWidget.foreground": "#e9e1f8",
        "editorSuggestWidget.selectedBackground": "#4c3a70",
        "editorWidget.background": "#1a1025",
        "editorWidget.border": "#4c3a70",
      },
    })
  }

  // Opciones del editor
  const editorOptions: editor.IStandaloneEditorConstructionOptions = {
    readOnly,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    fontSize: 14,
    lineNumbers: "on",
    renderLineHighlight: "all",
    scrollbar: {
      useShadows: false,
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10,
    },
    padding: {
      top: 16,
      bottom: 16,
    },
  }

  if (!mounted) {
    return <div className="h-full w-full bg-muted animate-pulse rounded-md"></div>
  }

  return (
    <Editor
      height={height}
      language={language}
      value={value}
      theme={editorTheme}
      options={editorOptions}
      beforeMount={handleEditorWillMount}
      onChange={onChange}
      loading={<div className="h-full w-full flex items-center justify-center">Cargando editor...</div>}
    />
  )
}
