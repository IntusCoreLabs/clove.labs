"use client"

import { useState, useEffect } from "react"
import { PreviewIframe } from "./preview-iframe"
import type { FileStructure } from "@/app/actions"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface FilePreviewProps {
  selectedFile: string | null
  files: FileStructure[]
}

export function FilePreview({ selectedFile, files }: FilePreviewProps) {
  const [previewHtml, setPreviewHtml] = useState<string>("")
  const [isPreviewRunning, setIsPreviewRunning] = useState(false)
  const [staticPreviewContent, setStaticPreviewContent] = useState<string>("")

  // Generar contenido de vista previa cuando cambia el archivo seleccionado
  useEffect(() => {
    if (!selectedFile) {
      setStaticPreviewContent("")
      setPreviewHtml("")
      return
    }

    const file = files.find((f) => f.path === selectedFile)
    if (!file) {
      setStaticPreviewContent("")
      setPreviewHtml("")
      return
    }

    const extension = selectedFile.split(".").pop()?.toLowerCase()

    // Generar vista previa según el tipo de archivo
    if (extension === "html") {
      setStaticPreviewContent(file.content)
      setPreviewHtml(file.content)
    } else if (extension === "md") {
      // Convertir markdown a HTML (simplificado)
      const html = file.content
        .replace(/^# (.*$)/gm, "<h1>$1</h1>")
        .replace(/^## (.*$)/gm, "<h2>$1</h2>")
        .replace(/^### (.*$)/gm, "<h3>$1</h3>")
        .replace(/\*\*(.*)\*\*/gm, "<strong>$1</strong>")
        .replace(/\*(.*)\*/gm, "<em>$1</em>")
        .replace(/\n/gm, "<br>")
      setStaticPreviewContent(html)
      setPreviewHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
          </style>
        </head>
        <body>
          ${html}
        </body>
        </html>
      `)
    } else if (["js", "jsx", "ts", "tsx"].includes(extension || "")) {
      // Para archivos JavaScript/React, intentamos extraer JSX/HTML
      const jsxMatch = file.content.match(/<[a-z][\s\S]*>/i)
      const JSXContent = jsxMatch ? jsxMatch[0] : ""

      const staticContent = `
        <div style="padding: 20px; color: #666;">
          <p>Vista previa de componente React (simulada):</p>
          <div style="border: 1px solid #eaeaea; padding: 20px; margin-top: 10px;">
            ${JSXContent || "No se encontró contenido JSX para mostrar"}
          </div>
        </div>
      `

      setStaticPreviewContent(staticContent)

      // Crear un HTML completo para la vista previa interactiva
      setPreviewHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
            #app { max-width: 1200px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div id="app"></div>
          <script>
            try {
              ${file.content}
              
              // Intentar renderizar el componente
              document.addEventListener('DOMContentLoaded', () => {
                try {
                  if (typeof init === 'function') init();
                  if (typeof render === 'function') render();
                  if (typeof main === 'function') main();
                  if (typeof App === 'function') {
                    const app = document.getElementById('app');
                    if (app) app.innerHTML = App();
                  }
                } catch (e) {
                  console.error('Error al inicializar:', e);
                  document.getElementById('app').innerHTML = '<div style="color: red; padding: 10px; border: 1px solid red;">Error: ' + e.message + '</div>';
                }
              });
            } catch (e) {
              console.error('Error al cargar script:', e);
              document.write('<div style="color: red; padding: 20px; border: 1px solid red;">Error al cargar script: ' + e.message + '</div>');
            }
          </script>
        </body>
        </html>
      `)
    } else if (["css", "scss"].includes(extension || "")) {
      const staticContent = `
        <div style="padding: 20px; color: #666;">
          <p>Vista previa de estilos CSS:</p>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px; overflow: auto;">${file.content}</pre>
        </div>
      `

      setStaticPreviewContent(staticContent)

      // Crear un HTML que muestre el CSS aplicado a elementos de ejemplo
      setPreviewHtml(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
            .preview-container { margin-top: 20px; border: 1px solid #eaeaea; padding: 20px; border-radius: 4px; }
            .css-code { background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; margin-bottom: 20px; }
            ${file.content}
          </style>
        </head>
        <body>
          <h2>Vista previa de CSS</h2>
          <div class="css-code">
            <pre>${file.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>
          </div>
          <div class="preview-container">
            <h3>Elementos con los estilos aplicados:</h3>
            <div class="example-elements">
              <p>Párrafo de ejemplo</p>
              <button>Botón de ejemplo</button>
              <div class="box">Caja de ejemplo</div>
              <a href="#">Enlace de ejemplo</a>
            </div>
          </div>
        </body>
        </html>
      `)
    } else {
      const staticContent = `
        <div style="padding: 20px; color: #666;">
          <p>No se puede generar vista previa para este tipo de archivo.</p>
        </div>
      `

      setStaticPreviewContent(staticContent)
      setPreviewHtml("")
    }
  }, [selectedFile, files])

  // Generar HTML para la vista previa de múltiples archivos
  const generateFullPreviewHtml = () => {
    if (!files.length) return ""

    // Buscar archivos HTML, index.js o index.jsx para la vista previa
    const htmlFiles = files.filter((f) => f.path.endsWith(".html"))
    const indexFiles = files.filter(
      (f) => f.path.endsWith("index.js") || f.path.endsWith("index.jsx") || f.path.endsWith("index.tsx"),
    )

    const mainFile = htmlFiles[0] || indexFiles[0] || files.find((f) => f.type === "file")

    if (!mainFile) return ""

    // Crear un documento HTML completo para la vista previa
    let previewHtml = ""

    if (mainFile.path.endsWith(".html")) {
      previewHtml = mainFile.content
    } else {
      // Crear un HTML básico que incluya todos los archivos JS y CSS
      const jsFiles = files.filter(
        (f) => f.path.endsWith(".js") || f.path.endsWith(".jsx") || f.path.endsWith(".ts") || f.path.endsWith(".tsx"),
      )
      const cssFiles = files.filter((f) => f.path.endsWith(".css") || f.path.endsWith(".scss"))

      // Crear un documento HTML que incluya los scripts y estilos
      previewHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vista Previa</title>
          <style>
            body { font-family: system-ui, sans-serif; margin: 0; padding: 20px; }
            #app { max-width: 1200px; margin: 0 auto; }
            ${cssFiles.map((f) => f.content).join("\n")}
          </style>
        </head>
        <body>
          <div id="app"></div>
          <script>
            // Función de ayuda para manejar errores
            function handleError(error) {
              console.error('Error en la vista previa:', error);
              document.getElementById('app').innerHTML = '<div style="color: red; padding: 20px; border: 1px solid red; border-radius: 4px;"><h3>Error en la vista previa</h3><pre>' + error.message + '</pre></div>';
            }

            try {
              ${jsFiles.map((f) => f.content).join("\n")}
              
              // Inicializar la aplicación
              document.addEventListener('DOMContentLoaded', () => {
                try {
                  if (typeof init === 'function') init();
                  if (typeof render === 'function') render();
                  if (typeof main === 'function') main();
                  if (typeof App === 'function') {
                    const app = document.getElementById('app');
                    if (app) app.innerHTML = App();
                  }
                } catch (e) {
                  handleError(e);
                }
              });
            } catch (e) {
              handleError(e);
            }
          </script>
        </body>
        </html>
      `
    }

    return previewHtml
  }

  const startPreview = () => {
    setIsPreviewRunning(true)
  }

  const stopPreview = () => {
    setIsPreviewRunning(false)
  }

  const refreshPreview = () => {
    if (isPreviewRunning) {
      setIsPreviewRunning(false)
      setTimeout(() => setIsPreviewRunning(true), 100)
    } else {
      setIsPreviewRunning(true)
    }
  }

  // Si no hay archivo seleccionado, mostrar mensaje
  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Selecciona un archivo para ver la vista previa</p>
      </div>
    )
  }

  return (
    <>
      {isPreviewRunning ? (
        <PreviewIframe
          html={previewHtml || generateFullPreviewHtml()}
          isRunning={isPreviewRunning}
          onStart={startPreview}
          onStop={stopPreview}
          onRefresh={refreshPreview}
          fileName={selectedFile}
        />
      ) : (
        <div className="h-full flex flex-col">
          <div className="border-b p-2 bg-gray-50 dark:bg-gray-800 text-xs text-muted-foreground flex justify-between items-center">
            <span>Vista previa de {selectedFile}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={startPreview}
                title="Ejecutar vista previa"
              >
                <Play className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: staticPreviewContent }} />
          </div>
        </div>
      )}
    </>
  )
}
