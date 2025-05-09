"use client"

import { getPostBySlug } from "@/lib/posts"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function PostClient({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)

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
