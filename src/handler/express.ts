





import type {
  GenericOpenAPIRequest,
  GenericOpenAPIResponse,
} from "./handler-types";
import type { OpenAPIHandler } from "./handlers";






















































const logFieldCharacterLimit = 10 * 1024;

function truncateString(str: string, maxLength: number): string {
  return str.length > maxLength
    ? `${str.slice(0, maxLength)}... [truncated]`
    : str;
}

function truncateJSON(obj: any, maxFieldLength: number): any {
  if (typeof obj !== "object" || obj === null) return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => truncateJSON(item, maxFieldLength));
  }

  const truncatedObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      truncatedObj[key] = truncateString(value, maxFieldLength);
    } else if (typeof value === "object") {
      truncatedObj[key] = truncateJSON(value, maxFieldLength);
    } else {
      truncatedObj[key] = value;
    }
  }

  return truncatedObj;
}




  enableLogging = true,




















              bodyLog = truncateJSON(asJSON, logFieldCharacterLimit);

              bodyLog = truncateString(bodyString, logFieldCharacterLimit);


                body: bodyLog,



          const loggableReq: Exclude<
            GenericOpenAPIRequest,
            "bodyString" | "headers"
          > & {

            headers?: any; // Allows deleting





          loggableReq.headers = undefined;
          loggableReq.bodyString = undefined;










            openAPIResponse: truncateJSON(response, logFieldCharacterLimit),



















