import { expect, test } from "vitest";
import { EvalResult, UnboundVariableError, evalProgram } from "./eval";
import { unsafeParse } from "./parser";

test("evaluate an empty program", () => {
  expect(evalProgram([])).toEqual({});
});

test("evaluate a program that assigns a value to a const", () => {
  const src = `let x = 1`;
  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "number", value: 1 },
  });
});

test("eval a string", () => {
  const src = `let x = "hello"`;
  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "string", value: "hello" },
  });
});

test("raises when accessing unbound variables", () => {
  const src = `let x = notFound`;
  expect(() => evalProgram(unsafeParse(src))).toThrow(UnboundVariableError);
});

test("True exists and is true", () => {
  const src = `let x = True`;
  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "boolean", value: true },
  });
});

test("False exists and is false", () => {
  const src = `let x = False`;
  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "boolean", value: false },
  });
});

test.todo("cannot override True or False");

test("handles multiple statements", () => {
  const src = `
    let x = 1
    let y = 2
  `;
  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "number", value: 1 },
    y: { type: "number", value: 2 },
  });
});

test("doesn't break if the ident actually exists", () => {
  const src = `
    let y = 1
    let x = y
  `;
  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    y: { type: "number", value: 1 },
    x: { type: "number", value: 1 },
  });
});

test("evaluates application of builtin functions", () => {
  const src = `
    let x = not(True)
  `;

  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "boolean", value: false },
  });
});

test("evaluates application of builtin functions", () => {
  const src = `
    let x = 1 + 2
  `;

  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "number", value: 3 },
  });
});

test("if expression when cond is true", () => {
  const src = `
    let x =
      if 100 > 10
        then "a"
        else "b"
  `;

  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "string", value: "a" },
  });
});

test("if expression when cond is true", () => {
  const src = `
    let x =
      if 1 > 10
        then "a"
        else "b"
  `;

  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "string", value: "b" },
  });
});

test.todo("let expressions", () => {
  const src = `
  let x =
      let local = 42 in
      local
  `;

  expect(evalProgram(unsafeParse(src))).toEqual<EvalResult>({
    x: { type: "number", value: 42 },
  });
});

test.todo("let expressions should not leak value", () => {
  const src = `
    let x =
      let local = 42 in
      local

    let y = local
  `;

  expect(() => evalProgram(unsafeParse(src))).toThrow(UnboundVariableError);
});
