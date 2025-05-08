"use client"

import { useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PreviewIframeProps {
  html: string
  isRunning: boolean
  onStart: () => void
  onStop: () => void
  onRefresh: () => void
  fileName: string
}

export function PreviewIframe({ html, isRunning, onStart, onStop, onRefresh, fileName }: PreviewIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const { toast } = useToast()

  // Actualizar el iframe cuando cambia el HTML o isRunning
  useEffect(() => {
    if (isRunning && html && iframeRef.current) {
      try {
        const iframe = iframeRef.current
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document

        if (iframeDoc) {
          // Limpiar cualquier contenido previo
          iframeDoc.open()
          iframeDoc.write(html)
          iframeDoc.close()

          console.log("Vista previa actualizada")
        } else {
          console.error("No se pudo acceder al documento del iframe")
        }
      } catch (error) {
        console.error("Error al actualizar el iframe:", error)
        toast({
          variant: "destructive",
          title: "Error en la vista previa",
          description:
            "Ocurrió un error al actualizar la vista previa. Esto podría estar relacionado con restricciones de seguridad del navegador.",
        })
      }
    }
  }, [html, isRunning, toast])

  return (
    <div className="h-full flex flex-col">
      <div className="border-b p-2 bg-gray-50 dark:bg-gray-800 text-xs text-muted-foreground flex justify-between items-center">
        <span>Vista previa de {fileName}</span>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={isRunning ? onStop : onStart}
            title={isRunning ? "Detener vista previa" : "Ejecutar vista previa"}
          >
            {isRunning ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRefresh} title="Recargar vista previa">
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {isRunning ? (
          <iframe
            ref={iframeRef}
            className="w-full h-full border-0"
            title="Vista previa"
            sandbox="allow-scripts allow-same-origin"
            onLoad={() => console.log("iframe cargado")}
            onError={(e) => console.error("Error en iframe:", e)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Haz clic en el botón de reproducción para iniciar la vista previa</p>
          </div>
        )}
      </div>
    </div>
  )
}
