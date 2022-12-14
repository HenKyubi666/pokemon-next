// To parse this data:
//
//   import { Convert, ResponseColorNames } from "./file";
//
//   const responseColorNames = Convert.toResponseColorNames(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface ResponseColorNames {
  data: Data;
  status: number;
  statusText: string;
  headers: ResponseColorNamesHeaders;
  config: Config;
  request: Request;
}

export interface Config {
  transitional: Transitional;
  transformRequest: null[];
  transformResponse: null[];
  timeout: number;
  xsrfCookieName: string;
  xsrfHeaderName: string;
  maxContentLength: number;
  maxBodyLength: number;
  env: Env;
  headers: ConfigHeaders;
  method: string;
  url: string;
}

export interface Env {
  FormData: null;
}

export interface ConfigHeaders {
  Accept: string;
}

export interface Transitional {
  silentJSONParsing: boolean;
  forcedJSONParsing: boolean;
  clarifyTimeoutError: boolean;
}

export interface Data {
  count: number;
  next: null;
  previous: null;
  results: Result[];
}

export interface Result {
  name: string;
  url: string;
}

export interface ResponseColorNamesHeaders {
  "cache-control": string;
  "content-type": string;
}

export interface Request {}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toResponseColorNames(json: string): ResponseColorNames {
    return cast(JSON.parse(json), r("ResponseColorNames"));
  }

  public static responseColorNamesToJson(value: ResponseColorNames): string {
    return JSON.stringify(uncast(value, r("ResponseColorNames")), null, 2);
  }
}

function invalidValue(typ: any, val: any, key: any = ""): never {
  if (key) {
    throw Error(
      `Invalid value for key "${key}". Expected type ${JSON.stringify(
        typ
      )} but got ${JSON.stringify(val)}`
    );
  }
  throw Error(
    `Invalid value ${JSON.stringify(val)} for type ${JSON.stringify(typ)}`
  );
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.json] = { key: p.js, typ: p.typ }));
    typ.jsonToJS = map;
  }
  return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => (map[p.js] = { key: p.json, typ: p.typ }));
    typ.jsToJSON = map;
  }
  return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = ""): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val;
    return invalidValue(typ, val, key);
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length;
    for (let i = 0; i < l; i++) {
      const typ = typs[i];
      try {
        return transform(val, typ, getProps);
      } catch (_) {}
    }
    return invalidValue(typs, val);
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val;
    return invalidValue(cases, val);
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue("array", val);
    return val.map((el) => transform(el, typ, getProps));
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null;
    }
    const d = new Date(val);
    if (isNaN(d.valueOf())) {
      return invalidValue("Date", val);
    }
    return d;
  }

  function transformObject(
    props: { [k: string]: any },
    additional: any,
    val: any
  ): any {
    if (val === null || typeof val !== "object" || Array.isArray(val)) {
      return invalidValue("object", val);
    }
    const result: any = {};
    Object.getOwnPropertyNames(props).forEach((key) => {
      const prop = props[key];
      const v = Object.prototype.hasOwnProperty.call(val, key)
        ? val[key]
        : undefined;
      result[prop.key] = transform(v, prop.typ, getProps, prop.key);
    });
    Object.getOwnPropertyNames(val).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key);
      }
    });
    return result;
  }

  if (typ === "any") return val;
  if (typ === null) {
    if (val === null) return val;
    return invalidValue(typ, val);
  }
  if (typ === false) return invalidValue(typ, val);
  while (typeof typ === "object" && typ.ref !== undefined) {
    typ = typeMap[typ.ref];
  }
  if (Array.isArray(typ)) return transformEnum(typ, val);
  if (typeof typ === "object") {
    return typ.hasOwnProperty("unionMembers")
      ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty("arrayItems")
      ? transformArray(typ.arrayItems, val)
      : typ.hasOwnProperty("props")
      ? transformObject(getProps(typ), typ.additional, val)
      : invalidValue(typ, val);
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== "number") return transformDate(val);
  return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps);
}

function a(typ: any) {
  return { arrayItems: typ };
}

function u(...typs: any[]) {
  return { unionMembers: typs };
}

function o(props: any[], additional: any) {
  return { props, additional };
}

function m(additional: any) {
  return { props: [], additional };
}

function r(name: string) {
  return { ref: name };
}

const typeMap: any = {
  ResponseColorNames: o(
    [
      { json: "data", js: "data", typ: r("Data") },
      { json: "status", js: "status", typ: 0 },
      { json: "statusText", js: "statusText", typ: "" },
      { json: "headers", js: "headers", typ: r("ResponseColorNamesHeaders") },
      { json: "config", js: "config", typ: r("Config") },
      { json: "request", js: "request", typ: r("Request") },
    ],
    false
  ),
  Config: o(
    [
      { json: "transitional", js: "transitional", typ: r("Transitional") },
      { json: "transformRequest", js: "transformRequest", typ: a(null) },
      { json: "transformResponse", js: "transformResponse", typ: a(null) },
      { json: "timeout", js: "timeout", typ: 0 },
      { json: "xsrfCookieName", js: "xsrfCookieName", typ: "" },
      { json: "xsrfHeaderName", js: "xsrfHeaderName", typ: "" },
      { json: "maxContentLength", js: "maxContentLength", typ: 0 },
      { json: "maxBodyLength", js: "maxBodyLength", typ: 0 },
      { json: "env", js: "env", typ: r("Env") },
      { json: "headers", js: "headers", typ: r("ConfigHeaders") },
      { json: "method", js: "method", typ: "" },
      { json: "url", js: "url", typ: "" },
    ],
    false
  ),
  Env: o([{ json: "FormData", js: "FormData", typ: null }], false),
  ConfigHeaders: o([{ json: "Accept", js: "Accept", typ: "" }], false),
  Transitional: o(
    [
      { json: "silentJSONParsing", js: "silentJSONParsing", typ: true },
      { json: "forcedJSONParsing", js: "forcedJSONParsing", typ: true },
      { json: "clarifyTimeoutError", js: "clarifyTimeoutError", typ: true },
    ],
    false
  ),
  Data: o(
    [
      { json: "count", js: "count", typ: 0 },
      { json: "next", js: "next", typ: null },
      { json: "previous", js: "previous", typ: null },
      { json: "results", js: "results", typ: a(r("Result")) },
    ],
    false
  ),
  Result: o(
    [
      { json: "name", js: "name", typ: "" },
      { json: "url", js: "url", typ: "" },
    ],
    false
  ),
  ResponseColorNamesHeaders: o(
    [
      { json: "cache-control", js: "cache-control", typ: "" },
      { json: "content-type", js: "content-type", typ: "" },
    ],
    false
  ),
  Request: o([], false),
};
