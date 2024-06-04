import { test, expect, describe } from "vitest";
import { unsafeParse } from "./parser";
import { Declaration, Expr } from "./ast";

describe("numbers", () => {
  test("int number", () => {
    const INPUT = "42";

    expect(parseExpr(INPUT)).toEqual<Expr>({
      type: "number-literal",
      number: 42,
    });
  });

  test("negative number", () => {
    const INPUT = "-42";

    expect(parseExpr(INPUT)).toEqual<Expr>({
      type: "number-literal",
      number: -42,
    });
  });

  test("float number", () => {
    const INPUT = "42.3";

    expect(parseExpr(INPUT)).toEqual<Expr>({
      type: "number-literal",
      number: 42.3,
    });
  });
});

describe("strings", () => {
  test("empty string", () => {
    const INPUT = `""`;

    expect(parseExpr(INPUT)).toEqual<Expr>({
      type: "string-literal",
      string: "",
    });
  });

  test("non empty string", () => {
    const INPUT = `"abc"`;

    expect(parseExpr(INPUT)).toEqual<Expr>({
      type: "string-literal",
      string: "abc",
    });
  });

  test("escape char", () => {
    const INPUT = `"\\x"`;

    expect(parseExpr(INPUT)).toEqual<Expr>({
      type: "string-literal",
      string: "\\x",
    });
  });
});

test("ident", () => {
  expectIdent("abc");
  expectIdent("a_c");
  expectIdent("_ac");
  expectIdent("ac_");
  expectIdent("_");
});

test("infix ops", () => {
  // 1 + 2
  // == (+) 1 2
  // == ((+) 1) 2

  expectInfix("+");
  expectInfix("-");
  expectInfix("*");
  expectInfix("/");
  expectInfix("^");
  expectInfix("%");
  expectInfix("||");
  expectInfix("&&");
  expectInfix("==");
  expectInfix("!=");
  expectInfix("<=");
  expectInfix(">=");
  expectInfix("<");
  expectInfix(">");
});

test("infix expr prec", () => {
  const INPUT = "1 + 2 * 3";
  //= 1 + (2 * 3)
  //= `+` 1 (2 * 3)
  //= (`+` 1) (2 * 3)
  //= (`+` 1) (`*` 2 3)
  //= (`+` 1) (`*` 2 3)
  //= (`+` 1) ((`*` 2) 3)
  //= (`+` 1) ((`*` 2) 3)

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "application",
    caller: {
      type: "application",
      caller: { type: "ident", ident: "+" },
      arg: { type: "number-literal", number: 1 },
    },
    arg: {
      type: "application",
      caller: expect.anything(),
      arg: { type: "number-literal", number: 3 },
    },
  });
});

test("let definition statement", () => {
  const INPUT = `let x = 42 in k`;

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "let",
    binding: "x",
    definition: {
      type: "number-literal",
      number: 42,
    },
    body: {
      type: "ident",
      ident: "k",
    },
  });
});

test("lambda", () => {
  const INPUT = `\\ x -> 42`;
  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "lambda",
    param: "x",
    body: { type: "number-literal", number: 42 },
  });
});

test("lambda+let", () => {
  expect(() => parseExpr("\\ x -> let x = 0 in 0")).not.toThrow();
  expect(() => parseExpr("let x = 0 in \\ x -> 42")).not.toThrow();
  expect(() => parseExpr("let x = \\ x -> 42 in 0")).not.toThrow();
});

test("application", () => {
  const INPUT = `f x`;

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "application",
    caller: {
      type: "ident",
      ident: "f",
    },
    arg: {
      type: "ident",
      ident: "x",
    },
  });
});

test("if expression", () => {
  const INPUT = `if b then x else y`;

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "if",
    condition: { type: "ident", ident: "b" },
    then: { type: "ident", ident: "x" },
    else: { type: "ident", ident: "y" },
  });
});

test("application (2 args)", () => {
  const INPUT = `f x y`;

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "application",
    caller: {
      type: "application",
      caller: {
        type: "ident",
        ident: "f",
      },
      arg: {
        type: "ident",
        ident: "x",
      },
    },
    arg: {
      type: "ident",
      ident: "y",
    },
  });
});

test("parens", () => {
  const INPUT = "(f)";
  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "ident",
    ident: "f",
  });
});

test("infix and fn precedence", () => {
  // (plus 1) (\x -> x)
  const INPUT = "1 + \\x -> x";

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "application",
    caller: expect.anything(),
    arg: expect.objectContaining({ type: "lambda" }),
  });
});

test("infix and application precedence", () => {
  // (plus 1) (let x = ...)
  const INPUT = "1 + let x = 0 in 0";

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "application",
    caller: {
      type: "application",
      caller: expect.anything(),
      arg: expect.anything(),
    },
    arg: expect.anything(),
  });
});

test("infix and application precedence", () => {
  // (`+` 1) (f x)
  const INPUT = "1 + f x";

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "application",
    caller: {
      type: "application",
      caller: { type: "ident", ident: "+" },
      arg: { type: "number-literal", number: 1 },
    },
    arg: expect.anything(),
  });
});

test("curried functions sugar", () => {
  const INPUT = "\\x y -> z";

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "lambda",
    param: "x",
    body: {
      type: "lambda",
      param: "y",
      body: { type: "ident", ident: "z" },
    },
  });
});

test("let function sugar", () => {
  const INPUT = "let f x y = z in 0";

  const abs: Expr = {
    type: "lambda",
    param: "x",
    body: {
      type: "lambda",
      param: "y",
      body: { type: "ident", ident: "z" },
    },
  };

  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "let",
    binding: "f",
    definition: abs,
    body: { type: "number-literal", number: 0 },
  });
});

test("parse many declrs", () => {
  expect(
    unsafeParse(`
    let x = 0
    let y = 1
  `)
  ).toEqual<Declaration[]>([
    { binding: "x", expr: { type: "number-literal", number: 0 } },
    { binding: "y", expr: { type: "number-literal", number: 1 } },
  ]);
});

test("parse declrs lambda sugar", () => {
  expect(
    unsafeParse(`
    let f x y = 0
  `)
  ).toEqual<Declaration[]>([
    {
      binding: "f",
      expr: {
        type: "lambda",
        param: "x",
        body: {
          type: "lambda",
          param: "y",
          body: { type: "number-literal", number: 0 },
        },
      },
    },
  ]);
});

// 1 `op` 2
function expectInfix(op: string) {
  const INPUT = `1 ${op} 2`;
  expect(parseExpr(INPUT)).toEqual<Expr>({
    type: "application",
    caller: {
      type: "application",
      caller: {
        type: "ident",
        ident: op,
      },
      arg: { type: "number-literal", number: 1 },
    },
    arg: { type: "number-literal", number: 2 },
  });
}

function expectIdent(name: string) {
  expect(parseExpr(name)).toEqual<Expr>({
    type: "ident",
    ident: name,
  });
}

function parseExpr(expr: string): Expr {
  const wrappedExpr = `let expr = ${expr}`;
  const parsed = unsafeParse(wrappedExpr);
  if (parsed.length != 1) {
    throw new Error("Err");
  }

  return parsed[0]!.expr;
}
