import { ExternalLink } from "lucide-react";
import type { NewsItem } from "@/lib/types";
import { formatDateTime } from "@/lib/dates";

export function NewsCard({ item }: { item: NewsItem }) {
  return (
    <article className={`card flex gap-3 p-4 ${item.isIndia ? "border-l-4 border-l-saffron" : ""}`}>
      {item.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-20 w-20 shrink-0 rounded object-cover" />
      )}
      <div className="min-w-0">
        <h3 className="font-bold leading-snug">{item.title}</h3>
        <p className="mt-0.5 text-xs text-slate-500">{item.source} · {formatDateTime(item.publishedAt)}</p>
        {item.summary && <p className="mt-1 text-sm text-slate-700">{item.summary}</p>}
        <a href={item.url} target="_blank" rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-navy underline-offset-2 hover:underline">
          Read original <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      </div>
    </article>
  );
}
