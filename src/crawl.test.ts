import { expect, test, describe } from "vitest";
import {
  normalizeURL,
  getHeadingFromHTML,
  getFirstParagraphFromHTML,
  getURLsFromHTML,
  getImagesFromHTML,
  extractPageData,
} from "./crawl";

describe("normalizeURL", () => {
  describe("trailing slashes", () => {
    test("strips trailing slash from path", () => {
      expect(normalizeURL("https://www.boot.dev/blog/path/")).toBe(
        "www.boot.dev/blog/path",
      );
    });

    test("strips trailing slash from root", () => {
      expect(normalizeURL("http://www.boot.dev/")).toBe("www.boot.dev");
    });
  });

  describe("protocol normalization", () => {
    test("strips https protocol", () => {
      expect(normalizeURL("https://www.boot.dev/blog")).toBe(
        "www.boot.dev/blog",
      );
    });

    test("strips http protocol", () => {
      expect(normalizeURL("http://www.boot.dev")).toBe("www.boot.dev");
    });

    test("treats http and https as equivalent", () => {
      expect(normalizeURL("https://www.boot.dev/blog")).toBe(
        normalizeURL("http://www.boot.dev/blog"),
      );
    });
  });

  describe("invalid input", () => {
    test("returns null for a plain string", () => {
      expect(normalizeURL("invalid url")).toBeNull();
    });

    test("returns null for an empty string", () => {
      expect(normalizeURL("")).toBeNull();
    });

    test("returns null for a relative path", () => {
      expect(normalizeURL("/blog/path")).toBeNull();
    });
  });
});

describe("getHeadingFromHTML", () => {
  describe("present h1 tag", () => {
    test("returns the textContent of the h1 tag", () => {
      const html = `
        <html>
            <body>
                <h1>Welcome to Boot.dev</h1>
                <main>
                    <p>Learn to code by building real projects.</p>
                    <p>This is the second paragraph.</p>
                </main>
            </body>
        </html>`;

      expect(getHeadingFromHTML(html)).toBe("Welcome to Boot.dev");
    });

    test("returns the textContent of the h1 tag", () => {
      const html = `
        <html>
            <body>
                <main>
                    <p>Learn to code by building real projects.</p>
                    <p>This is the second paragraph.</p>
                    <h1>Welcome to Boot.dev</h1>
                </main>
            </body>
        </html>`;

      expect(getHeadingFromHTML(html)).toBe("Welcome to Boot.dev");
    });
  });

  describe("no h1 but h2 present", () => {
    test("returns the textContent of the h2 tag", () => {
      const html = `
        <html>
            <body>
                <h2>Welcome to Boot.dev</h2>
                <main>
                    <p>Learn to code by building real projects.</p>
                    <p>This is the second paragraph.</p>
                </main>
            </body>
        </html>`;

      expect(getHeadingFromHTML(html)).toBe("Welcome to Boot.dev");
    });

    test("returns the textContent of the h2 tag", () => {
      const html = `
        <html>
            <body>
                <main>
                    <p>Learn to code by building real projects.</p>
                    <h2>Welcome to Boot.dev</h2>
                    <p>This is the second paragraph.</p>
                </main>
            </body>
        </html>`;

      expect(getHeadingFromHTML(html)).toBe("Welcome to Boot.dev");
    });
  });

  describe("no h1 or h2", () => {
    test("returns the textContent of the h1 tag", () => {
      const html = `
        <html>
            <body>
                <h1>Welcome to Boot.dev</h1>
                <main>
                    <h2>The Goddam best website to learn to program</h2>
                    <p>Learn to code by buildingreal projects.</p>
                    <p>This is the second paragraph.</p>
                </main>
            </body>
        </html>`;

      expect(getHeadingFromHTML(html)).toBe("Welcome to Boot.dev");
    });

    test("returns the textContent of the h1 tag even if h2 comes be h1", () => {
      const html = `
        <html>
            <body>
                <h2>The Goddam best website to learn to program</h2>
                <main>
                    <p>Learn to code by building real projects.</p>
                    <h1>Welcome to Boot.dev</h1>
                    <p>This is the second paragraph.</p>
                </main>
            </body>
        </html>`;

      expect(getHeadingFromHTML(html)).toBe("Welcome to Boot.dev");
    });
  });

  describe("h1 & h2 present", () => {
    test("returns empty string if no h1 or h2 is found", () => {
      const html = `
        <html>
            <body>
                <main>
                    <p>Learn to code by building real projects.</p>
                    <p>This is the second paragraph.</p>
                </main>
            </body>
        </html>`;

      expect(getHeadingFromHTML(html)).toBe("");
    });
  });
});

describe("getFirstParagraphFromHTML", () => {
  test("returns p in main priority", () => {
    const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
    const actual = getFirstParagraphFromHTML(inputBody);
    const expected = "Main paragraph.";
    expect(actual).toEqual(expected);
  });

  test("returns an empty string if no paragraph", () => {
    const inputBody = `
    <html><body>
      <main>
      </main>
    </body></html>
  `;
    const actual = getFirstParagraphFromHTML(inputBody);
    const expected = "";
    expect(actual).toEqual(expected);
  });

  test("does not the paragraph that is not in main, even if it appears first", () => {
    const inputBody = `
    <html><body>
      <p>Outside paragraph.</p>
      <main>
        <p>Main paragraph.</p>
      </main>
    </body></html>
  `;
    const actual = getFirstParagraphFromHTML(inputBody);
    const notExpected = "Outside paragraph.";
    expect(actual).not.toEqual(notExpected);
  });
});

describe("getURLsFromHTML", () => {
  test("returns absolute path link", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><a href="/path/one"><span>Boot.dev</span></a></body></html>`;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected = ["https://crawler-test.com/path/one"];

    expect(actual).toEqual(expected);
  });

  test("returns all links in DOM", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `
        <html><body>
            <a href="/path/one"><span>Boot.dev</span></a>
            <a href="/path/two"><span>Boot.part2</span></a>
            <a href="/path/three"><span>Boot.part3</span></a>
        </body></html>
    `;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected = [
      "https://crawler-test.com/path/one",
      "https://crawler-test.com/path/two",
      "https://crawler-test.com/path/three",
    ];

    expect(actual).toEqual(expected);
  });

  test("returns an empty array if no anchor tag is found", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `
        <html><body>
            <h1>Boot.dev</h1>
            <p>Learn programming the best way</p>
        </body></html>
    `;

    const actual = getURLsFromHTML(inputBody, inputURL);
    expect(actual).toEqual([]);
  });

  test("with no hrefs", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `
        <html><body>
            <a href="/path/one"><span>Boot.dev</span></a>
            <a><span>Boot.part2</span></a>
            <a><span>Boot.part3</span></a>
        </body></html>
    `;

    const actual = getURLsFromHTML(inputBody, inputURL);
    const expected = ["https://crawler-test.com/path/one"];
    expect(actual).toEqual(expected);
  });
});

describe("getImagesFromHTML", () => {
  test("returns absolte path link", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body><img src="/logo.png" alt="Logo"></body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = ["https://crawler-test.com/logo.png"];

    expect(actual).toEqual(expected);
  });

  test("returns all images", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body>
        <img src="/logo.png" alt="Logo">
        <img src="/logo1.png" alt="Logo">
        <img src="/logo2.png" alt="Logo">
    </body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = [
      "https://crawler-test.com/logo.png",
      "https://crawler-test.com/logo1.png",
      "https://crawler-test.com/logo2.png",
    ];

    expect(actual).toEqual(expected);
  });

  test("with no src", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `<html><body>
        <img alt="Logo">
        <img src="/logo.png" alt="Logo">
        <img alt="Logo">
    </body></html>`;

    const actual = getImagesFromHTML(inputBody, inputURL);
    const expected = ["https://crawler-test.com/logo.png"];
    expect(actual).toEqual(expected);
  });
});

describe("extractPageData", () => {
  test("extractPageData basic", () => {
    const inputURL = "https://crawler-test.com";
    const inputBody = `
    <html><body>
      <h1>Test Title</h1>
      <p>This is the first paragraph.</p>
      <a href="/link1">Link 1</a>
      <img src="/image1.jpg" alt="Image 1">
    </body></html>
  `;

    const actual = extractPageData(inputBody, inputURL);
    const expected = {
      url: "https://crawler-test.com",
      heading: "Test Title",
      firstParagraph: "This is the first paragraph.",
      outgoingLinks: ["https://crawler-test.com/link1"],
      imageURLs: ["https://crawler-test.com/image1.jpg"],
    };

    expect(actual).toEqual(expected);
  });
});
