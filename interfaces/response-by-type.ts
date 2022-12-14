// To parse this data:
//
//   import { Convert, ResponseByType } from "./file";
//
//   const responseByType = Convert.toResponseByType(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface ResponseByType {
  data: Data;
  status: number;
  statusText: string;
  headers: ResponseByTypeHeaders;
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
  damage_relations: DamageRelations;
  game_indices: GameIndex[];
  generation: Generation;
  id: number;
  move_damage_class: Generation;
  moves: Generation[];
  name: string;
  names: Name[];
  past_damage_relations: any[];
  pokemon: PokemonResult[];
}

export interface DamageRelations {
  double_damage_from: Generation[];
  double_damage_to: any[];
  half_damage_from: any[];
  half_damage_to: Generation[];
  no_damage_from: Generation[];
  no_damage_to: Generation[];
}

export interface Generation {
  name: string;
  url: string;
}

export interface GameIndex {
  game_index: number;
  generation: Generation;
}

export interface Name {
  language: Generation;
  name: string;
}

export interface PokemonResult {
  pokemon: Generation;
  slot: number;
}

export interface ResponseByTypeHeaders {
  "cache-control": string;
  "content-type": string;
}

export interface Request {}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toResponseByType(json: string): ResponseByType {
    return cast(JSON.parse(json), r("ResponseByType"));
  }

  public static responseByTypeToJson(value: ResponseByType): string {
    return JSON.stringify(uncast(value, r("ResponseByType")), null, 2);
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
  ResponseByType: o(
    [
      { json: "data", js: "data", typ: r("Data") },
      { json: "status", js: "status", typ: 0 },
      { json: "statusText", js: "statusText", typ: "" },
      { json: "headers", js: "headers", typ: r("ResponseByTypeHeaders") },
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
      {
        json: "damage_relations",
        js: "damage_relations",
        typ: r("DamageRelations"),
      },
      { json: "game_indices", js: "game_indices", typ: a(r("GameIndex")) },
      { json: "generation", js: "generation", typ: r("Generation") },
      { json: "id", js: "id", typ: 0 },
      {
        json: "move_damage_class",
        js: "move_damage_class",
        typ: r("Generation"),
      },
      { json: "moves", js: "moves", typ: a(r("Generation")) },
      { json: "name", js: "name", typ: "" },
      { json: "names", js: "names", typ: a(r("Name")) },
      {
        json: "past_damage_relations",
        js: "past_damage_relations",
        typ: a("any"),
      },
      { json: "pokemon", js: "pokemon", typ: a(r("Pokemon")) },
    ],
    false
  ),
  DamageRelations: o(
    [
      {
        json: "double_damage_from",
        js: "double_damage_from",
        typ: a(r("Generation")),
      },
      { json: "double_damage_to", js: "double_damage_to", typ: a("any") },
      { json: "half_damage_from", js: "half_damage_from", typ: a("any") },
      { json: "half_damage_to", js: "half_damage_to", typ: a(r("Generation")) },
      { json: "no_damage_from", js: "no_damage_from", typ: a(r("Generation")) },
      { json: "no_damage_to", js: "no_damage_to", typ: a(r("Generation")) },
    ],
    false
  ),
  Generation: o(
    [
      { json: "name", js: "name", typ: "" },
      { json: "url", js: "url", typ: "" },
    ],
    false
  ),
  GameIndex: o(
    [
      { json: "game_index", js: "game_index", typ: 0 },
      { json: "generation", js: "generation", typ: r("Generation") },
    ],
    false
  ),
  Name: o(
    [
      { json: "language", js: "language", typ: r("Generation") },
      { json: "name", js: "name", typ: "" },
    ],
    false
  ),
  Pokemon: o(
    [
      { json: "pokemon", js: "pokemon", typ: r("Generation") },
      { json: "slot", js: "slot", typ: 0 },
    ],
    false
  ),
  ResponseByTypeHeaders: o(
    [
      { json: "cache-control", js: "cache-control", typ: "" },
      { json: "content-type", js: "content-type", typ: "" },
    ],
    false
  ),
  Request: o([], false),
};
