export type RequestOptions = {
  baseUrl: string;
  fetchOverride?: (request: Request) => Promise<Response>;
};
