import { getNews } from "@/lib/data";
import { NewsFeed } from "@/components/NewsFeed";

export const metadata = { title: "News" };

// Read JSON on every request so edits to /data show up without a rebuild.
export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const news = await getNews();
  return (
    <>
      <h1 className="text-2xl font-extrabold sm:text-3xl">Asian Games News</h1>
      <NewsFeed items={news.items} />
    </>
  );
}
