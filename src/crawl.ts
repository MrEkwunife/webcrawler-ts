import { JSDOM } from "jsdom";

export function normalizeURL(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const normalized = `${urlObj.host}${urlObj.pathname}`;
    if (normalized.charAt(normalized.length - 1) === "/") {
      return normalized.slice(0, -1);
    }
    return normalized;
  } catch (e) {
    console.error(`Invalid URL: ${url}`, e);
    return null;
  }
}

export function getHeadingFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const h1TextContent = dom.window.document.querySelector("h1")?.textContent;
  if (!h1TextContent) {
    const h2TextContent = dom.window.document.querySelector("h2")?.textContent;
    if (!h2TextContent) {
      return "";
    }

    return h2TextContent;
  }
  return h1TextContent;
}

export function getFirstParagraphFromHTML(html: string): string {
  const dom = new JSDOM(html);
  const mainEl = dom.window.document.querySelector("main");
  const pTextContent = mainEl?.querySelector("p")?.textContent;
  if (!pTextContent) {
    return "";
  }
  return pTextContent;
}

// export function getURLsFromHTML(html: string, baseURL: string): string[] {
//   return [];
// }
