import { argv } from "node:process";
import { getHTML } from "./crawl";

async function main() {
  const argsLength = argv.length;

  if (argsLength !== 3) {
    console.log(`crawler requires 1 arg but got ${argsLength - 2}`);
    process.exit(1);
  }

  const [_, __, baseURL] = argv;
  console.log(`Crawling the website at url: ${baseURL}`);
  const html = await getHTML(baseURL);
  if (html) {
    console.log(html);
  }
  process.exit(0);
}

await main();
