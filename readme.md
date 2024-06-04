## Mini-ml

A simple implementation of a minimal version of a [ml-like](https://en.wikipedia.org/wiki/Standard_ML) language.

### Language overview

```ocaml
(* You can create immutable variables using `let` declarations *)

let d1 = 42    (* A number *)
let d2 = 42.2  (* Stil a number *)
let d3 = "abc" (* A string. Note that there isn't a `char` type *)

(* You can use the common infix operators such as `+`, `==`, `&&`, ... *)
let sum = x + d1  (* evaluated as `43` *)

(* You can define `if` expressions *)
let ifExample =
  if 10 > 20
    then "a"
    else "b"

(* You can define local `let` expressions *)
let exampleLocal = (* This is evaluated to `43` *)
  let localValue = 42 in
  localValue + 1


(* You can define local lambda expressions *)
let exampleLambda =
  \x -> \y -> x + y

(* And then call them *)
let exampleLambdaCall = exampleLambda 10 20 (* => 30 *)

(* Using many params in a lambda is syntax sugar for curried lambdas *)
let exampleLambda1 =
  \x y -> x + y

(* You can also use this syntax sugar for defining lambdas in let *)
let exampleLambda1 x y = x + y
```

### Develop locally

You need to have `npm` installed locally

**setup**

```bash
# Install dependencies
npm install

# Run parser codegen step
npm run generate:parser
```

**develop**

```bash
# Run tests in watch mode
npm run test:w

# Run typechecker in watch mode
npm run ts:watch
```
