import { writeFileSync } from "fs";
import { resolve } from "path";
import { ExtractedPageData } from "./crawl";

export function writeJSONReport(
  pageData: Record<string, ExtractedPageData>,
  filename = "report.json",
): void {
  const sorted = Object.values(pageData).sort((a, b) =>
    a.url.localeCompare(b.url),
  );

  const json = JSON.stringify(sorted, null, 2);

  const filepath = resolve(process.cwd(), filename);
  writeFileSync(filepath, json);

  console.log(`Report written to ${filepath}`);
}
