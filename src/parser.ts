import type { MatchResult, NonterminalNode, TerminalNode } from "ohm-js";
import grammar from "./parser/grammar.ohm-bundle";
import { Declaration, Expr } from "./ast";

const semantics = grammar.createSemantics();

function infixOp(
  this: NonterminalNode,
  left: NonterminalNode,
  op: TerminalNode,
  right: NonterminalNode
): Expr {
  return {
    type: "application",
    caller: {
      type: "application",
      caller: {
        type: "ident",
        ident: op.sourceString,
      },
      arg: left.expr(),
    },
    arg: right.expr(),
  };
}

semantics.addOperation<number>("number()", {
  number_whole(node) {
    return Number(node.sourceString);
  },

  number_fract(_intPart, _comma, _floatPart) {
    return Number(this.sourceString);
  },

  number_neg(_minus, node) {
    return -node.number();
  },
});

semantics.addOperation<Expr>("expr()", {
  PriExp_let(_let, idents, _eq, def, _in, body): Expr {
    const [ident, ...params] = idents.children;

    const abstr: Expr = params.reduceRight(
      (prev, param) => ({
        type: "lambda",
        param: param!.sourceString,
        body: prev,
      }),
      def.expr() as Expr
    );

    return {
      type: "let",
      binding: ident!.sourceString,
      definition: abstr,
      body: body.expr(),
    };
  },

  PriExp_abs(_fn, params, _arrow, body): Expr {
    return params.children.reduceRight(
      (prev, param) => ({
        type: "lambda",
        param: param!.sourceString,
        body: prev,
      }),
      body.expr() as Expr
    );
  },

  PriExp_if(_if, condition, _then, x, _else, y) {
    return {
      type: "if",
      condition: condition.expr(),
      then: x.expr(),
      else: y.expr(),
    };
  },

  ApplyExpr_apply(items) {
    const [first, ...other] = items.children;
    return other.reduce<Expr>(
      (acc, node) => ({
        type: "application",
        caller: acc,
        arg: node.expr(),
      }),
      first!.expr()
    );
  },

  PriExp_paren(_l, arg1, _r) {
    return arg1.expr();
  },

  ident(_l, _ns) {
    return {
      type: "ident",
      ident: this.sourceString,
    };
  },

  number(node) {
    return {
      type: "number-literal",
      number: node.number(),
    };
  },

  string(_stQuote, s, _endQuote) {
    return {
      type: "string-literal",
      string: s.sourceString,
    };
  },

  EqExpr_eq: infixOp,
  EqExpr_neq: infixOp,
  CompExp_lte: infixOp,
  CompExp_lt: infixOp,
  CompExp_gt: infixOp,
  CompExp_gte: infixOp,
  AddExp_plus: infixOp,
  AddExp_minus: infixOp,
  MulExp_mult: infixOp,
  MulExp_divide: infixOp,
  MulExp_rem: infixOp,
  ExpExp_power: infixOp,
  OrExpr_or: infixOp,
  AndExpr_and: infixOp,
});

semantics.addOperation<Declaration>("declaration()", {
  Declaration_letDecl(_let, bindings, _eq, expr) {
    const [first, ...params] = bindings.children;

    return {
      binding: first!.sourceString,
      expr: params.reduceRight(
        (prev, binding): Expr => ({
          type: "lambda",
          param: binding.sourceString,
          body: prev,
        }),
        expr.expr()
      ),
    };
  },
});

// Main
semantics.addOperation<Declaration[]>("program()", {
  MAIN_declarations(declarations) {
    return declarations.children.map((c) => c.declaration());
  },
});

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; matchResult: MatchResult };

export function parse(input: string): ParseResult<Declaration[]> {
  const matchResult = grammar.match(input);
  if (matchResult.failed()) {
    return { ok: false, matchResult };
  }

  return { ok: true, value: semantics(matchResult).program() };
}

export function unsafeParse(input: string): Declaration[] {
  const res = parse(input);
  if (res.ok) {
    return res.value;
  }

  throw new Error(res.matchResult.message!);
}
