// Sample blog post data
interface Post {
  slug: string
  title: string
  date: string
  author: string
  content: string
}

// Sample blog posts data
const posts: Post[] = [
  {
    slug: "getting-started",
    title: "Getting Started with AI Code Generation",
    date: "2023-04-15",
    author: "AI Assistant",
    content: `
      <p>Welcome to the world of AI-powered code generation! This guide will help you get started with using AI to generate code for your projects.</p>
      <h2>Why Use AI for Code Generation?</h2>
      <p>AI code generation can significantly speed up your development process by:</p>
      <ul>
        <li>Automating repetitive coding tasks</li>
        <li>Providing starter templates for common patterns</li>
        <li>Helping you explore new approaches to problems</li>
      </ul>
      <h2>Getting Started</h2>
      <p>To begin using AI code generation, simply describe what you want to build in natural language, and let the AI do the heavy lifting!</p>
    `,
  },
  {
    slug: "best-practices",
    title: "Best Practices for AI Code Generation",
    date: "2023-04-20",
    author: "AI Assistant",
    content: `
      <p>While AI code generation is powerful, following these best practices will help you get the most out of it:</p>
      <h2>1. Be Specific</h2>
      <p>The more specific your prompt, the better the generated code will be. Include details about:</p>
      <ul>
        <li>Frameworks and libraries you want to use</li>
        <li>Specific functionality requirements</li>
        <li>Code style preferences</li>
      </ul>
      <h2>2. Review Generated Code</h2>
      <p>Always review AI-generated code before using it in production. Look for:</p>
      <ul>
        <li>Security vulnerabilities</li>
        <li>Performance issues</li>
        <li>Adherence to best practices</li>
      </ul>
      <h2>3. Iterate</h2>
      <p>Don't expect perfect results on the first try. Iterate on your prompts to refine the output.</p>
    `,
  },
]

/**
 * Get all blog posts
 */
export async function getPosts(): Promise<Post[]> {
  // In a real application, this would fetch from a database or API
  return posts
}

/**
 * Get a specific blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<Post | undefined> {
  // In a real application, this would fetch from a database or API
  return posts.find((post) => post.slug === slug)
}
