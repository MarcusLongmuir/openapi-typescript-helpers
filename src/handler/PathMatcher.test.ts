import { PathMatcher } from "./PathMatcher";

describe("PathMatcher", () => {
  describe("without trailing slash", () => {
    const pathMatcher = new PathMatcher("/some/{p1}/{p2}");
    expect(pathMatcher.colonUrlPattern).toEqual("/some/:p1/:p2");

    it("handles url without trailing slash", () => {
      const url = new URL("http://example.com/some/foo/bar");
      const patternResult: URLPatternResult | null = pathMatcher.exec(url);
      expect(patternResult?.pathname).toEqual({
        groups: {
          p1: "foo",
          p2: "bar",
        },
        input: "/some/foo/bar",
      });
    });

    it("handles url with trailing slash", () => {
      const url = new URL("http://example.com/some/foo/bar/");
      const patternResult: URLPatternResult | null = pathMatcher.exec(url);
      expect(patternResult?.pathname).toEqual({
        groups: {
          p1: "foo",
          p2: "bar",
        },
        input: "/some/foo/bar",
      });
    });
  });

  describe("with trailing slash", () => {
    const pathMatcher = new PathMatcher("/some/{p1}/{p2}/");
    expect(pathMatcher.colonUrlPattern).toEqual("/some/:p1/:p2/");

    it("handles url with trailing slash", () => {
      const url = new URL("http://example.com/some/foo/bar/");
      const patternResult: URLPatternResult | null = pathMatcher.exec(url);
      expect(patternResult?.pathname).toEqual({
        groups: {
          p1: "foo",
          p2: "bar",
        },
        input: "/some/foo/bar/",
      });
    });

    it("handles url without trailing slash", () => {
      const url = new URL("http://example.com/some/foo/bar");
      const patternResult: URLPatternResult | null = pathMatcher.exec(url);
      expect(patternResult?.pathname).toEqual({
        groups: {
          p1: "foo",
          p2: "bar",
        },
        input: "/some/foo/bar/",
      });
    });
  });

  it("should return null for invalid paths", () => {
    const pathMatcher = new PathMatcher("/foo/{p1}/{p2}/");
    const url = new URL("http://example.com/bar/baz");
    const patternResult: URLPatternResult | null = pathMatcher.exec(url);
    expect(patternResult).toEqual(null);
  });
});
