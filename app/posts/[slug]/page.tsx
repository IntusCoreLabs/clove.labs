import PostClient from "./PostClient"
import { getPosts } from "@/lib/posts"

export async function generateStaticParams() {
  const posts = await getPosts()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function Post({ params }: { params: { slug: string } }) {
  return <PostClient params={params} />
}
