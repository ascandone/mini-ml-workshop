export type Declaration = {
  binding: string;
  expr: Expr;
};

export type Expr =
  | {
      type: "string-literal";
      string: string;
    }
  | {
      type: "number-literal";
      number: number;
    }
  | {
      type: "ident";
      ident: string;
    }
  | {
      type: "lambda";
      param: string;
      body: Expr;
    }
  | {
      type: "application";
      caller: Expr;
      arg: Expr;
    }
  | {
      type: "let";
      binding: string;
      definition: Expr;
      body: Expr;
    }
  | {
      type: "if";
      condition: Expr;
      then: Expr;
      else: Expr;
    };
