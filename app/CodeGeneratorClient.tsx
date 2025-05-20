"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  Loader2,
  FileCode,
  FolderClosed,
  ChevronRight,
  ChevronDown,
  Copy,
  Download,
  FileJson,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileArchive,
  FileAudio,
  FileVideo,
  FileBadge,
  Sparkles,
  PlusCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { generateCodeWithGemini } from "../app/actions"
import type { FileStructure } from "../app/actions"
import { MonacoEditor } from "@/components/monaco-editor"
import { NavBar } from "@/components/nav-bar"
import { FilePreview } from "@/components/file-preview"


import { useUser, useClerk } from "@clerk/nextjs";


const fileColors = {
  js: "text-yellow-500",
  jsx: "text-blue-500",
  ts: "text-blue-600",
  tsx: "text-blue-700",
  css: "text-pink-500",
  scss: "text-pink-600",
  html: "text-orange-500",
  json: "text-green-500",
  md: "text-gray-500",
  py: "text-green-600",
  rb: "text-red-600",
  php: "text-purple-500",
  java: "text-amber-600",
  go: "text-cyan-600",
  rs: "text-orange-600",
  c: "text-blue-800",
  cpp: "text-blue-900",
  h: "text-blue-800",
  folder: "text-amber-400",
  default: "text-gray-400",
}

const getFileIcon = (path: string) => {
  const extension = path.split(".").pop()?.toLowerCase() || ""

  switch (extension) {
    case "json":
      return <FileJson className="h-3.5 w-3.5 mr-1.5" />
    case "txt":
    case "md":
      return <FileText className="h-3.5 w-3.5 mr-1.5" />
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "svg":
    case "webp":
      return <FileImage className="h-3.5 w-3.5 mr-1.5" />
    case "csv":
    case "xlsx":
    case "xls":
      return <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
    case "zip":
    case "rar":
    case "tar":
    case "gz":
      return <FileArchive className="h-3.5 w-3.5 mr-1.5" />
    case "mp3":
    case "wav":
    case "ogg":
      return <FileAudio className="h-3.5 w-3.5 mr-1.5" />
    case "mp4":
    case "webm":
    case "avi":
      return <FileVideo className="h-3.5 w-3.5 mr-1.5" />
    case "ico":
    case "favicon":
      return <FileBadge className="h-3.5 w-3.5 mr-1.5" />
    default:
      return <FileCode className="h-3.5 w-3.5 mr-1.5" />
  }
}

// Función para obtener el color adecuado según la extensión del archivo
const getFileColor = (path: string, type: string) => {
  if (type === "folder") return fileColors.folder

  const extension = path.split(".").pop()?.toLowerCase() || ""
  return fileColors[extension as keyof typeof fileColors] || fileColors.default
}

interface FileTreeProps {
  files: FileStructure[]
  expandedFolders: Set<string>
  toggleFolder: (path: string) => void
  selectedFile: string | null
  setSelectedFile: (path: string) => void
  getFileIcon: (path: string) => React.JSX.Element
  getFileColor: (path: string, type: string) => string
}

export default function CodeGeneratorClient() {
  const [prompt, setPrompt] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [files, setFiles] = useState<FileStructure[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [showFileExplorer, setShowFileExplorer] = useState(false)
  const [isNewProject, setIsNewProject] = useState(true)
  const [projectHistory, setProjectHistory] = useState<string[]>([])





  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const handleClick = async () => {
    if (!isSignedIn) {
      await openSignIn(); // Abre el modal de inicio de sesión
      return;
    }

    generateCode(true); // Ejecuta la función si el usuario ha iniciado sesión
  };


  const { toast } = useToast()

  const generateCode = async (startNewProject = false) => {
    if (!prompt.trim()) return

    setIsGenerating(true)
    setGenerationError(null)

    if (startNewProject || isNewProject) {
      setFiles([])
      setProjectHistory([prompt])
      setIsNewProject(false)
    } else {
      setProjectHistory((prev) => [...prev, prompt])
    }

    setShowFileExplorer(true)

    let fullPrompt = prompt

    if (!startNewProject && !isNewProject && files.length > 0) {
      const existingFiles = files.map((file) => `${file.path} ${file.type === "folder" ? "(folder)" : ""}`).join("\n")

      fullPrompt = `Continue working on the existing project.
These are the existing files:
${existingFiles}

History of previous prompts:
${projectHistory.join("\n- ")}

New request: ${prompt}

 Please add or modify files as needed to implement this new functionality.
Do not repeat existing files unless they require modification. `
    }

    toast({
      title:
        startNewProject || isNewProject
          ? "clove is generating a new project"
          : "processing the new request",
      description: "clove is processing your request",
    })

    try {
      const generatedFiles = await generateCodeWithGemini(fullPrompt)

      const existingFilesMap = new Map(files.map((file) => [file.path, file]))

      for (let i = 0; i < generatedFiles.length; i++) {
        const file = generatedFiles[i]

        if (existingFilesMap.has(file.path)) {
          setFiles((prev) => prev.map((f) => (f.path === file.path ? { ...f, content: file.content } : f)))

          toast({
            title: "Updated file",
            description: `the file has been updated ${file.path}`,
            duration: 3000,
          })
        } else {
          setFiles((prev) => [...prev, file])

          if (file.type === "folder") {
            setExpandedFolders((prev) => {
              const newSet = new Set(prev)
              newSet.add(file.path)
              return newSet
            })
          }

          if (i === 0 && file.type === "file" && !selectedFile) {
            setSelectedFile(file.path)
          }
        }

        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      if (!selectedFile && generatedFiles.find((f) => f.type === "file")) {
        const firstFile = generatedFiles.find((f) => f.type === "file")
        if (firstFile) setSelectedFile(firstFile.path)
      }

      toast({
        title:
          startNewProject || isNewProject ? "new project generated" : "changes added to the project",
        description: `Have been ${startNewProject || isNewProject ? "created" : "added/updated"} ${generatedFiles.length} files.`,
      })
    } catch (error) {
      console.error("Error generating code:", error)
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al generar código"
      setGenerationError(errorMessage)

      if (errorMessage.includes("API key")) {
        toast({
          variant: "destructive",
          title: "Configuration error",
          description:
            "Missing API key, check the .env",
        })
      } else if (
        errorMessage.includes("parsing") ||
        errorMessage.includes("JSON") ||
        errorMessage.includes("unexpected character")
      ) {
        toast({
          variant: "destructive",
          title: "Format error",
          description:
            "clove had a problem with the project format",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Error generating code",
          description: "clove had a problem processing your request",
        })
      }
    } finally {
      setIsGenerating(false)
      setPrompt("") // Limpiar el prompt después de generar
    }
  }

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(path)) {
        newSet.delete(path)
      } else {
        newSet.add(path)
      }
      return newSet
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.metaKey) {
      e.preventDefault()
      generateCode(false) // No iniciar un nuevo proyecto al usar el atajo de teclado
    }
  }

  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.style.height = "auto"
      promptRef.current.style.height = `${promptRef.current.scrollHeight}px`
    }
  }, [prompt])

  const getFileContent = () => {
    if (!selectedFile) return ""
    const file = files.find((f) => f.path === selectedFile)
    return file?.content || ""
  }

  const getFileExtension = () => {
    if (!selectedFile) return "text"
    const extension = selectedFile.split(".").pop()?.toLowerCase() || "text"

    const extensionMap: Record<string, string> = {
      js: "javascript",
      jsx: "javascript",
      ts: "typescript",
      tsx: "typescript",
      css: "css",
      scss: "css",
      html: "html",
      json: "json",
      md: "markdown",
      py: "python",
      rb: "ruby",
      php: "php",
      java: "java",
      go: "go",
      rs: "rust",
      c: "c",
      cpp: "cpp",
      h: "c",
    }

    return extensionMap[extension] || "text"
  }

  const copyFileContent = () => {
    if (!selectedFile) return

    const content = getFileContent()
    navigator.clipboard.writeText(content)

    toast({
      title: "copied",
      description: `the content has been copied ${selectedFile} to the clipboard.`,
    })
  }

  const startNewProject = () => {
    if (files.length > 0) {
      if (confirm("Are you sure you want to start a new project? All current files will be lost.")) {
        setFiles([])
        setSelectedFile(null)
        setExpandedFolders(new Set())
        setIsNewProject(true)
        setProjectHistory([])
        setShowFileExplorer(false)
        setPrompt("")

        toast({
          title: "new project started",
          description: "The workspace has been cleared for a new project.",
        })
      }
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <NavBar />

      {!showFileExplorer ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-3xl">
            <h2 className="text-3xl font-bold mb-6 text-center">What do you want to build?</h2>
            <p className="text-center text-muted-foreground mb-8">
              Describe your project and Clove will generate the complete code for you.
            </p>
            <div className="flex flex-col gap-4">
              <Textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what you want to build... (e.g., 'Create a React todo app with local storage')"
                className="min-h-[150px] resize-none text-lg p-4"
              />
              <Button
                onClick={handleClick}
                disabled={isGenerating || !prompt.trim()}
                className="h-[50px] w-full bg-primary hover:bg-primary/90"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating code with clove...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    generate code with clove
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground mt-2">Press ⌘ + Enter to generate</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="w-64 border-r p-4 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <div className="text-sm font-medium">Project Files</div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startNewProject} title="New proyect">
                <PlusCircle className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="space-y-1">
              {files.length === 0 && !isGenerating && !generationError && (
                <div className="text-muted-foreground text-sm italic">No files generated yet</div>
              )}

              {generationError && (
                <div className="text-red-500 text-sm">
                  <p className="font-medium">Error:</p>
                  <p>{generationError}</p>
                </div>
              )}

              {isGenerating && files.length === 0 && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Generating project with clove...
                </div>
              )}

              <FileTree
                files={files}
                expandedFolders={expandedFolders}
                toggleFolder={toggleFolder}
                selectedFile={selectedFile}
                setSelectedFile={setSelectedFile}
                getFileIcon={getFileIcon}
                getFileColor={getFileColor}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedFile ? (
              <Tabs defaultValue="code" className="flex-1 flex flex-col">
                <div className="border-b px-4 flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger value="code">Code</TabsTrigger>
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                  </TabsList>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={copyFileContent}>
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <TabsContent value="code" className="flex-1 p-0 m-0 overflow-auto">
                  <div className="h-full overflow-auto">
                    <MonacoEditor
                      value={getFileContent()}
                      language={getFileExtension()}
                      readOnly={true}
                      height="calc(100vh - 200px)"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="flex-1 p-0 m-0 overflow-auto">
                  <FilePreview selectedFile={selectedFile} files={files} />
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                {isGenerating ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Generating your project with clove...</p>
                  </div>
                ) : (
                  <p>No file selected</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {showFileExplorer && (
        <div className="border-t p-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <Textarea
                ref={promptRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe what else you want to add to your project..."
                className="min-h-[60px] resize-none pr-12"
              />
              <div className="absolute right-3 bottom-3 text-xs text-muted-foreground">
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>⌘ + Enter</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => generateCode(true)}
                disabled={isGenerating || !prompt.trim()}
                variant="outline"
                className="h-[60px] px-4"
                title="generate new project"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                New
              </Button>
              <Button
                onClick={() => generateCode(false)}
                disabled={isGenerating || !prompt.trim()}
                className="h-[60px] px-4 bg-primary hover:bg-primary/90"
                title="add to the current project"
              >
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="h-4 w-4 mr-2" />
                )}
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FileTree({
  files,
  expandedFolders,
  toggleFolder,
  selectedFile,
  setSelectedFile,
  getFileIcon,
  getFileColor,
}: FileTreeProps) {
  const fileTree: Record<string, any> = {}

  files.forEach((file) => {
    const parts = file.path.split("/")
    let current = fileTree

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      const path = parts.slice(0, i + 1).join("/")

      if (i === parts.length - 1) {
        current[part] = {
          path,
          type: file.type,
          content: file.content,
          children: {},
        }
      } else {
        if (!current[part]) {
          current[part] = {
            path,
            type: "folder",
            content: "",
            children: {},
          }
        }
        current = current[part].children
      }
    }
  })

  const renderTree = (node: Record<string, any>, level = 0) => {
    return Object.keys(node).map((key) => {
      const item = node[key]
      const isFolder = item.type === "folder"
      const isExpanded = expandedFolders.has(item.path)
      const fileColor = getFileColor(item.path, item.type)

      return (
        <div key={item.path} style={{ marginLeft: level > 0 ? "0.75rem" : 0 }}>
          <div
            className={cn(
              "flex items-center py-1 px-2 rounded-md text-sm",
              selectedFile === item.path ? "bg-accent text-accent-foreground" : "hover:bg-accent/50 cursor-pointer",
            )}
            onClick={() => {
              if (isFolder) {
                toggleFolder(item.path)
              } else {
                setSelectedFile(item.path)
              }
            }}
          >
            {isFolder ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                )}
                <FolderClosed className={`h-3.5 w-3.5 mr-1.5 ${fileColor}`} />
              </>
            ) : (
              <span className={fileColor}>{getFileIcon(item.path)}</span>
            )}
            <span className={isFolder ? fileColor : ""}>{key}</span>
          </div>

          {isFolder && isExpanded && Object.keys(item.children).length > 0 && (
            <div className="ml-2 border-l pl-2 mt-1">{renderTree(item.children, level + 1)}</div>
          )}
        </div>
      )
    })
  }

  return <div className="space-y-1">{renderTree(fileTree)}</div>
}
