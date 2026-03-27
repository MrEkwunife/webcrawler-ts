import { JSDOM } from "jsdom";

type ExtractedPageData = {
  url: string;
  heading: string;
  firstParagraph: string;
  outgoingLinks: Array<string>;
  imageURLs: Array<string>;
};

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
  const doc = dom.window.document;
  const pTextContent =
    doc.querySelector("main p")?.textContent ??
    doc.querySelector("p")?.textContent;

  return pTextContent?.trim() ?? "";
}

export function getURLsFromHTML(html: string, baseURL: string): string[] {
  const urls: string[] = [];
  const dom = new JSDOM(html);
  const allAnchorsEl = Array.from(dom.window.document.querySelectorAll("a"));
  allAnchorsEl.forEach((a) => {
    const href = a.getAttribute("href");
    if (href) {
      urls.push(new URL(href, baseURL).href);
    }
  });

  return urls;
}

export function getImagesFromHTML(html: string, baseURL: string): string[] {
  const dom = new JSDOM(html);
  const imgs = dom.window.document.querySelectorAll("img");

  return Array.from(imgs)
    .map((img) => {
      const src = img.getAttribute("src");
      if (!src) return null;
      try {
        return new URL(src, baseURL).href;
      } catch {
        return null;
      }
    })
    .filter((src): src is string => src !== null);
}

export function extractPageData(
  html: string,
  pageURL: string,
): ExtractedPageData {
  return {
    url: pageURL,
    heading: getHeadingFromHTML(html),
    firstParagraph: getFirstParagraphFromHTML(html),
    outgoingLinks: getURLsFromHTML(html, pageURL),
    imageURLs: getImagesFromHTML(html, pageURL),
  };
}

export async function getHTML(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "BootCrawler/1.0",
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch HTML: ${res.status} ${res.statusText}`);
      return null;
    }

    const contentType = res.headers.get("Content-Type");
    if (!contentType?.includes("text/html")) {
      console.error(`Unexpected content type: ${contentType}`);
      return null;
    }

    return await res.text();
  } catch (err) {
    console.error(`Network error fetching ${url}:`, err);
    return null;
  }
}
