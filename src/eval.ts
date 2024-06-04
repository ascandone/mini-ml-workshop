import { Declaration, Expr } from "./ast";

export type Value =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "builtin-function"; value: (value: Value) => Value };

export type EvalResult = Record<string, Value>;

export class UnboundVariableError extends Error {
  constructor(public readonly binding: string) {
    super(`Binding not found: "${binding}"`);
  }
}

function evalExpr(expr: Expr, result: EvalResult): Value {
  switch (expr.type) {
    case "number-literal":
      return { type: "number", value: expr.number };

    case "string-literal":
      return { type: "string", value: expr.string };

    case "ident": {
      if (expr.ident === "True") {
        return { type: "boolean", value: true };
      } else if (expr.ident === "False") {
        return { type: "boolean", value: false };
      }
      const lookup = result[expr.ident];
      if (lookup === undefined) {
        throw new UnboundVariableError(expr.ident);
      } else {
        return lookup;
      }
    }

    case "application": {
      const caller = evalExpr(expr.caller, result);
      if (caller.type !== "builtin-function") {
        throw new Error("Expected a function");
      }
      const f = caller.value;

      const arg = evalExpr(expr.arg, result);
      return f(arg);
    }

    case "if": {
      const condition = evalExpr(expr.condition, result);
      if (condition.type !== "boolean") {
        throw new TypeError("Expected a boolean as if condition");
      }

      if (condition.value) {
        return evalExpr(expr.then, result);
      } else {
        return evalExpr(expr.else, result);
      }
    }

    case "lambda":
    case "let":
      throw new Error("TODO expr of type: " + expr.type);
  }
}

function curry(f: (...args: Value[]) => Value): Value {
  function curryTimes(n: number, xs: Value[]): Value {
    if (n === 0) {
      return f(...xs);
    }
    return {
      type: "builtin-function",
      value: (x) => curryTimes(n - 1, [...xs, x]),
    };
  }
  return curryTimes(f.length, []);
}

export function evalProgram(program: Declaration[]): EvalResult {
  const result: EvalResult = {};

  for (const token of program) {
    result[token.binding] = evalExpr(token.expr, { ...builtins, ...result });
  }

  return result;
}

const builtins: EvalResult = {
  not: {
    type: "builtin-function",
    value: (b) => {
      if (b.type !== "boolean") {
        throw new TypeError("Expected a boolean in not");
      }
      return { type: "boolean", value: !b.value };
    },
  },
  "++": {
    type: "builtin-function",
    value: (a) => {
      return {
        type: "builtin-function",
        value: (b) => {
          if (a.type !== "number" || b.type !== "number") {
            throw TypeError();
          }
          return { type: "number", value: a.value + b.value };
        },
      };
    },
  },

  "+": curry((x, y) => {
    if (x.type !== "number" || y.type !== "number") {
      throw new TypeError("Expected numbers in +");
    }
    return { type: "number", value: x.value + y.value };
  }),
  "*": curry((x, y) => {
    if (x.type !== "number" || y.type !== "number") {
      throw new TypeError("Expected numbers in *");
    }
    return { type: "number", value: x.value * y.value };
  }),
  "-": curry((x, y) => {
    if (x.type !== "number" || y.type !== "number") {
      throw new TypeError("Expected numbers in -");
    }
    return { type: "number", value: x.value - y.value };
  }),
  ">": curry((x, y) => {
    if (x.type !== "number" || y.type !== "number") {
      throw new TypeError("Expected numbers in >");
    }
    return { type: "boolean", value: x.value > y.value };
  }),
  "<=": curry((x, y) => {
    if (x.type !== "number" || y.type !== "number") {
      throw new TypeError("Expected numbers in <=");
    }
    return { type: "boolean", value: x.value <= y.value };
  }),
  "==": curry((x, y) => {
    if (x.type !== "number" || y.type !== "number") {
      throw new TypeError("Expected numbers in ==");
    }
    return { type: "boolean", value: x.value === y.value };
  }),
};
