
"use server"
import { GoogleGenerativeAI } from "@google/generative-ai"

import { cloveSystemPrompt } from '../prompt/systemprompt.js'


export interface FileStructure {
  path: string
  type: "file" | "folder"
  content: string
}

export async function generateCodeWithGemini(prompt: string): Promise<FileStructure[]> {
  try {
    // Initialize the Google Generative AI with API key
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
    if (!apiKey) {
      throw new Error("Google API key is not set. Please set NEXT_PUBLIC_GOOGLE_API_KEY in your environment variables.")
    }

    const genAI = new GoogleGenerativeAI(apiKey)

    // Lista de modelos para intentar, en orden de preferencia
    // Comenzamos con modelos más básicos que tienen mayor cuota gratuita
    const modelsToTry = [
      "gemini-2.0-flash",
      "gemini-2.5-pro-preview-05-06",
    ]

    let model = null
    let modelUsed = ""
    let error = null

    // Intentar cada modelo hasta que uno funcione
    for (const modelName of modelsToTry) {
      try {
        console.log(`Attempting to use model: ${modelName}`)
        model = genAI.getGenerativeModel({ model: modelName })

        // Probar si el modelo está disponible con una solicitud simple
        // Usamos una solicitud mínima para verificar disponibilidad
        await model.generateContent("test")

        modelUsed = modelName
        console.log(`Successfully connected to model: ${modelName}`)
        break
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : String(e)
        console.warn(`Failed to use model ${modelName}:`, errorMessage)

        // Si es un error de cuota, intentamos el siguiente modelo
        if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
          console.log(`Quota exceeded for ${modelName}, trying next model...`)
          error = e
          continue
        }

        // Si es un error de modelo no encontrado, intentamos el siguiente
        if (
          errorMessage.includes("404") ||
          errorMessage.includes("not found") ||
          errorMessage.includes("not supported")
        ) {
          console.log(`Model ${modelName} not found, trying next model...`)
          error = e
          continue
        }

        // Para otros errores, también intentamos el siguiente modelo
        error = e
      }
    }

    // Si ningún modelo funcionó, lanzar el último error
    if (!model) {
      console.error("All models failed, using fallback project structure")
      return createQuotaExceededProjectStructure(prompt)
    }

    console.log(`Using model: ${modelUsed} for generation`)

    // Determinar si es una continuación de proyecto o un nuevo proyecto
    //const isContinuation = prompt.includes("Continúa trabajando en el proyecto existente")




    const isContinuation = "Continue working on the existing project"


    const fullPrompt = `
    // Create a system prompt that instructs Gemini how to generate code
    const fullPrompt =
You are Gemini, a highy capable coding assistant designed to generate clear, complete, production - ready code.You emulate the skills and discipline of a senior software engineer.

You specialize in modern development, with expertise in React, Next.js(App Router), Tailwind CSS, shadcn / ui, TypeScript, JavaScript, HTML, and Node.js.You follow current best practices and produce high - quality, accessible, and maintainable code.

Your core principles:

- Write ** complete solutions ** in a single file unless multi - file structure is requested.
- Use semantic, accessible, responsive HTML and components.
- Style using Tailwind CSS with modern class names (e.g.\`bg-primary\`, \`text-primary-foreground\`).
- Leverage \`shadcn/ui\` for UI components and \`lucide-react\` for icons.
- Use function components and React hooks. Avoid class components.
- Never include "fill this" comments or incomplete placeholders.
- Do not write dynamic imports or lazy loading unless explicitly requested.
- Prefer native browser APIs (like \`IntersectionObserver\`, \`localStorage\`) over third-party libraries.

${isContinuation
        ? `
IMPORTANT: You are continuing work on an existing project. The user has provided information about existing files.
When generating code:
1. If you need to modify an existing file, include the full updated content for that file.
2. If you're creating new files, make sure they integrate well with the existing structure.
3. Don't recreate files that already exist unless they need modifications.
4. Consider the project history and previous prompts when making additions.
`
        : ""
      }

If the task requires UI code:
- Ensure proper accessibility (alt text, ARIA roles, \`sr-only\` where needed).
- Create responsive layouts and use utility-first CSS.
- Group logic and structure components clearly within the file.

If the task involves backend, logic, or server-side code:
- Organize the code cleanly, use no unnecessary libraries.
- Don't fetch or connect to external APIs unless explicitly instructed.
- Keep the logic robust and the output deterministic.

IMPORTANT: Your response MUST be a valid JSON array of file objects with this exact structure:
[
  {
    "path": "file/path/with/extension",
    "type": "file",
    "content": "file content as string"
  },
  {
    "path": "folder/path",
    "type": "folder",
    "content": ""
  }
]

For folders, use empty content and type "folder".  
For files, include the full code content and type "file".  
Organize files in a logical structure with appropriate folders.  
Include all necessary files for a complete, working project.

CRITICAL: Make sure all JSON strings are properly escaped.  
Any quotes, backslashes, or control characters within string values must be properly escaped according to JSON standards.
Double quotes inside content strings must be escaped with a backslash (\\").
Backslashes must be escaped as double backslashes (\\\\).
Avoid using backticks (\`) in your JSON content as they can cause parsing issues.

DO NOT include any explanations, markdown formatting, or text outside the JSON array.  
ONLY return the JSON array.

User request: ${prompt}

Remember to ONLY return a valid JSON array with the file structure. `


    // Add safety timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Request timed out after 30 seconds")), 30000)
    })

    // Add generation options to reduce token usage
    const generationConfig = {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    }

    // Race the API call with a timeout
    let result
    try {
      result = await Promise.race([
        model.generateContent({
          contents: [{ role: "user", parts: [{ text: fullPrompt }] }],
          generationConfig,
        }),
        timeoutPromise,
      ])
    } catch (genError) {
      const errorMessage = genError instanceof Error ? genError.message : String(genError)
      console.error("Error during content generation:", errorMessage)

      // Si es un error de cuota, usamos la estructura de proyecto para cuota excedida
      if (errorMessage.includes("429") || errorMessage.includes("quota") || errorMessage.includes("rate limit")) {
        console.log("Quota exceeded during generation, using fallback project structure")
        return createQuotaExceededProjectStructure(prompt)
      }

      // Para otros errores, usamos la estructura básica
      return createBasicProjectStructure(prompt)
    }

    const response = result.response
    const text = response.text()

    // Log the first 100 characters of the response for debugging
    console.log("Response from Gemini (first 100 chars):", text.substring(0, 100))

    // Parse the response as JSON
    let files: FileStructure[] = []

    try {
      // Intenta encontrar un array JSON en la respuesta
      let jsonText = text

      // Eliminar cualquier texto antes del primer '['
      const startIndex = text.indexOf("[")
      if (startIndex !== -1) {
        jsonText = text.substring(startIndex)
      } else {
        throw new Error("No se encontró un array JSON en la respuesta")
      }

      // Eliminar cualquier texto después del último ']' que balancee el array
      let openBrackets = 0
      let endIndex = -1

      for (let i = 0; i < jsonText.length; i++) {
        if (jsonText[i] === "[") openBrackets++
        if (jsonText[i] === "]") {
          openBrackets--
          if (openBrackets === 0) {
            endIndex = i
            break
          }
        }
      }

      if (endIndex !== -1) {
        jsonText = jsonText.substring(0, endIndex + 1)
      } else {
        throw new Error("No se encontró un array JSON válido en la respuesta")
      }

      // Limpia el JSON antes de analizarlo
      // 1. Eliminar caracteres no imprimibles
      jsonText = jsonText.replace(/[\x00-\x1F\x7F-\x9F]/g, "")

      // 2. Reemplaza secuencias de escape incorrectas
      jsonText = jsonText.replace(/\\([^"\\/bfnrtu])/g, "\\\\$1")

      // 3. Corrige comas finales en arrays y objetos
      jsonText = jsonText.replace(/,(\s*[\]}])/g, "$1")

      // 4. Reemplaza saltos de línea y tabulaciones con sus secuencias de escape
      jsonText = jsonText.replace(/\n/g, "\\n").replace(/\t/g, "\\t")

      // 5. Intenta arreglar problemas comunes con JSON
      jsonText = jsonText.replace(/,\s*,/g, ",") // Elimina comas duplicadas

      console.log("Cleaned JSON (first 100 chars):", jsonText.substring(0, 100))

      // Intenta analizar el JSON limpiado
      try {
        files = JSON.parse(jsonText)
      } catch (jsonError) {
        console.error("Error parsing JSON:", jsonError)

        // Intenta un enfoque más agresivo: extraer cada objeto individualmente
        const fileObjects: FileStructure[] = []
        const objectRegex =
          /\{\s*"path"\s*:\s*"([^"]+)"\s*,\s*"type"\s*:\s*"([^"]+)"\s*,\s*"content"\s*:\s*"([^"]*)"\s*\}/g

        let match
        while ((match = objectRegex.exec(jsonText)) !== null) {
          fileObjects.push({
            path: match[1],
            type: match[2] as "file" | "folder",
            content: match[3],
          })
        }

        if (fileObjects.length > 0) {
          files = fileObjects
        } else {
          throw jsonError
        }
      }

      // Valida la estructura del array
      if (!Array.isArray(files)) {
        throw new Error("La respuesta no es un array")
      }

      // Asegúrate de que cada elemento tenga las propiedades requeridas
      files = files.map((file) => {
        if (!file.path) {
          throw new Error("Archivo sin propiedad path")
        }
        return {
          path: file.path,
          type: file.type === "folder" ? "folder" : "file",
          content: file.content || "",
        }
      })
    } catch (parseError) {
      console.error("Error al analizar la respuesta de Gemini:", parseError)

      // Intenta extraer archivos del texto como último recurso
      files = extractFilesFromText(text)

      if (files.length === 0) {
        // Si no podemos extraer archivos, creamos una estructura básica
        files = createBasicProjectStructure(prompt)
      }
    }

    // Sort files to ensure folders come before their contents
    files.sort((a, b) => {
      // First sort by type (folder first)
      if (a.type === "folder" && b.type === "file") return -1
      if (a.type === "file" && b.type === "folder") return 1
      // Then sort alphabetically by path
      return a.path.localeCompare(b.path)
    })

    return files
  } catch (error) {
    console.error("Error generating code with Gemini:", error)

    // Check for quota exceeded error
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes("quota") || errorMessage.includes("rate limit") || errorMessage.includes("429")) {
      console.log("Quota exceeded, using fallback project structure")
      return createQuotaExceededProjectStructure(prompt)
    }

    // For other errors, create a basic structure
    return createBasicProjectStructure(prompt)
  }
}

// Helper function to extract files from text when JSON parsing fails
function extractFilesFromText(text: string): FileStructure[] {
  const files: FileStructure[] = []

  // Intenta extraer bloques de código con nombres de archivo
  const codeBlockRegex = /```(?:(\w+)\s+)?(?:file=['"]([^'"]+)['"])?\s*\n([\s\S]*?)```/g
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || ""
    const filename = match[2] || `file-${files.length + 1}.${getExtensionFromLanguage(language)}`
    const content = match[3] || ""

    files.push({
      path: filename,
      type: "file",
      content: content.trim(),
    })
  }

  // Si encontramos bloques de código, devolvemos esos archivos
  if (files.length > 0) {
    return files
  }

  // Si no hay bloques de código, buscamos patrones de nombres de archivo
  const filenameRegex = /\b[\w-]+\/[\w-]+\.\w{1,5}\b|\b[\w-]+\.\w{1,5}\b/g
  const filenames = new Set<string>()
  let filenameMatch

  while ((filenameMatch = filenameRegex.exec(text)) !== null) {
    filenames.add(filenameMatch[0])
  }

  // Crea archivos a partir de los nombres encontrados
  filenames.forEach((filename) => {
    // Intenta encontrar contenido para este archivo
    const fileContentRegex = new RegExp(`${filename}[\\s\\S]*?\\{([\\s\\S]*?)\\}`, "i")
    const contentMatch = fileContentRegex.exec(text)

    files.push({
      path: filename,
      type: "file",
      content: contentMatch ? contentMatch[1].trim() : `// Content for ${filename}`,
    })
  })

  return files
}

// Función para crear una estructura básica de proyecto
function createBasicProjectStructure(prompt: string): FileStructure[] {
  const sanitizedPrompt = prompt
    .replace(/[^\w\s]/gi, "")
    .substring(0, 30)
    .trim()

  return [
    {
      path: "index.html",
      type: "file",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${sanitizedPrompt || "Generated Project"}</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root">
    <h1>${sanitizedPrompt || "Generated Project"}</h1>
    <p>This is a basic project structure created from your prompt.</p>
    <p>Prompt: "${prompt}"</p>
  </div>
  <script src="main.js"></script>
</body>
</html>`,
    },
    {
      path: "styles.css",
      type: "file",
      content: `body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 20px;
  line-height: 1.6;
  color: #333;
  background-color: #f9f9f9;
}

#root {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #2563eb;
  margin-top: 0;
}`,
    },
    {
      path: "main.js",
      type: "file",
      content: `// Main JavaScript file
console.log('Project initialized');

// Display the current time
document.addEventListener('DOMContentLoaded', () => {
  const timeElement = document.createElement('div');
  timeElement.style.marginTop = '20px';
  timeElement.style.padding = '10px';
  timeElement.style.backgroundColor = '#f0f0f0';
  timeElement.style.borderRadius = '4px';
  
  const updateTime = () => {
    const now = new Date();
    timeElement.textContent = 'Current time: ' + now.toLocaleTimeString();
  };
  
  updateTime();
  setInterval(updateTime, 1000);
  
  document.getElementById('root').appendChild(timeElement);
});
`,
    },
  ]
}

// Función para crear una estructura de proyecto cuando se excede la cuota
function createQuotaExceededProjectStructure(prompt: string): FileStructure[] {
  const sanitizedPrompt = prompt
    .replace(/[^\w\s]/gi, "")
    .substring(0, 30)
    .trim()

  return [
    {
      path: "index.html",
      type: "file",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Quota Exceeded</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="root">
    <div class="quota-error">
      <h1>API Quota Exceeded</h1>
      <p>We couldn't generate your project because the Google Gemini API quota has been exceeded.</p>
      <div class="info-box">
        <h2>Your Prompt</h2>
        <p>"${prompt}"</p>
      </div>
      <div class="info-box">
        <h2>What you can do</h2>
        <ul>
          <li>Try again later when the quota resets</li>
          <li>Use a different API key with higher quota limits</li>
          <li>Try a simpler prompt that requires fewer tokens</li>
        </ul>
      </div>
    </div>
  </div>
  <script src="main.js"></script>
</body>
</html>`,
    },
    {
      path: "styles.css",
      type: "file",
      content: `body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  margin: 0;
  padding: 20px;
  line-height: 1.6;
  color: #333;
  background-color: #f9f9f9;
}

#root {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.quota-error {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 30px;
  border-top: 5px solid #e11d48;
}

h1 {
  color: #e11d48;
  margin-top: 0;
}

.info-box {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  margin: 20px 0;
  border-left: 3px solid #2563eb;
}

.info-box h2 {
  margin-top: 0;
  font-size: 1.2rem;
  color: #2563eb;
}

ul {
  padding-left: 20px;
}

li {
  margin-bottom: 8px;
}`,
    },
    {
      path: "main.js",
      type: "file",
      content: `// Main JavaScript file
console.log('Quota exceeded handler initialized');

// Add a retry button
document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('root');
  const retryButton = document.createElement('button');
  retryButton.textContent = 'Try Again';
  retryButton.className = 'retry-button';
  retryButton.style.backgroundColor = '#2563eb';
  retryButton.style.color = 'white';
  retryButton.style.border = 'none';
  retryButton.style.padding = '10px 20px';
  retryButton.style.borderRadius = '4px';
  retryButton.style.marginTop = '20px';
  retryButton.style.cursor = 'pointer';
  
  retryButton.addEventListener('click', () => {
    window.location.reload();
  });
  
  root.appendChild(retryButton);
  
  // Add timestamp of when the quota might reset
  const timeElement = document.createElement('div');
  timeElement.style.marginTop = '20px';
  timeElement.style.fontSize = '0.9rem';
  timeElement.style.color = '#666';
  
  const now = new Date();
  const resetTime = new Date(now);
  resetTime.setMinutes(0);
  resetTime.setSeconds(0);
  resetTime.setHours(now.getHours() + 1); // Assume quota resets hourly
  
  timeElement.textContent = 'Quota might reset around: ' + resetTime.toLocaleTimeString();
  root.appendChild(timeElement);
});
`,
    },
  ]
}

// Función auxiliar para obtener extensiones de archivo basadas en el lenguaje
function getExtensionFromLanguage(language: string): string {
  const languageMap: Record<string, string> = {
    javascript: "js",
    js: "js",
    typescript: "ts",
    ts: "ts",
    jsx: "jsx",
    tsx: "tsx",
    html: "html",
    css: "css",
    python: "py",
    ruby: "rb",
    java: "java",
    cpp: "cpp",
    c: "c",
    csharp: "cs",
    go: "go",
    rust: "rs",
    php: "php",
    swift: "swift",
    kotlin: "kt",
    markdown: "md",
    json: "json",
  }

  return languageMap[language.toLowerCase()] || "txt"
}
