import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function GET() {
  const sitemapPath = join(process.cwd(), "sitemap.xml");
  const xml = await readFile(sitemapPath, "utf8");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
