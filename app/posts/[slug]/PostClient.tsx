"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPostBySlug } from "@/lib/posts"

export default function PostClient({ params }: { params: { slug: string } }) {
  const [post, setPost] = useState<{
    slug: string
    title: string
    date: string
    author: string
    content: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadPost() {
      try {
        const postData = await getPostBySlug(params.slug)
        if (postData) {
          setPost(postData)
        }
        setLoading(false)
      } catch (error) {
        console.error("Error loading post:", error)
        setLoading(false)
      }
    }

    loadPost()
  }, [params.slug])

  if (loading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        </div>
      </main>
    )
  }

  if (!post) {
    notFound()
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <Link href="/" className="text-blue-500 hover:underline mb-6 block">
        ← Back to home
      </Link>

      <article className="prose lg:prose-xl mx-auto">
        <h1>{post.title}</h1>
        <div className="flex items-center text-gray-500 mb-8">
          <span>{new Date(post.date).toLocaleDateString()}</span>
          <span className="mx-2">•</span>
          <span>{post.author}</span>
        </div>

        <div dangerouslySetInnerHTML={{ __html: post.content }} />
      </article>
    </main>
  )
}
