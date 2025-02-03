import * as URLPatternPolyfill from "urlpattern-polyfill";

export class PathMatcher {
  public readonly colonUrlPattern: string;
  private urlPattern: URLPattern;

  constructor(opPath: string, baseUrl?: string) {
    // Converts a path in the format /foo/{someId}/bar/{otherId} to the format /foo/:someId/bar/:otherId
    this.colonUrlPattern = opPath.replace(/\{([^}]+)\}/g, ":$1");

    const pattern = `${baseUrl || ""}${this.colonUrlPattern}`;
    this.urlPattern = new URLPatternPolyfill.URLPattern({
      pathname: pattern,
    });
  }

  public exec(url: URL): URLPatternResult | null {
    let patternResult: URLPatternResult | null = this.urlPattern.exec(url);
    if (patternResult) {
      return patternResult;
    }

    // Try the opposite of the current url ending (either include or remove the forward slash)
    const alternatePathName = url.pathname.endsWith("/")
      ? url.pathname.substring(0, url.pathname.length - 1)
      : `${url.pathname}/`;
    url.pathname = alternatePathName;

    patternResult = this.urlPattern.exec(url);
    if (patternResult) {
      return patternResult;
    }

    return null;
  }
}
