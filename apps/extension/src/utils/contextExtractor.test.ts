import { describe, expect, it } from "vitest";
import { Position, Range } from "vscode";
import { extractContext } from "./contextExtractor";

type MockDocument = {
  lineCount: number;
  getText: (range: Range) => string;
  lineAt: (line: number) => { range: { end: Position } };
};

function makeDocument(text: string): MockDocument {
  const lines = text.split("\n");

  const getOffset = (position: Position): number => {
    let offset = 0;
    for (let i = 0; i < position.line; i += 1) {
      offset += lines[i].length + 1;
    }
    return offset + position.character;
  };

  return {
    lineCount: lines.length,
    getText(range: Range) {
      const start = getOffset(range.start);
      const end = getOffset(range.end);
      return text.slice(start, end);
    },
    lineAt(line: number) {
      return {
        range: {
          end: new Position(line, lines[line].length)
        }
      };
    }
  };
}

describe("extractContext", () => {
  it("extracts prefix and suffix around cursor", () => {
    const document = makeDocument("const a = 1;\nconst b = a + 1;\nconsole.log(b);");
    const position = new Position(1, 10);

    const context = extractContext(document as never, position, 20, 100, 100);

    expect(context.prefix).toContain("const a = 1;");
    expect(context.prefix).toContain("const b = ");
    expect(context.suffix).toContain("a + 1;");
    expect(context.suffix).toContain("console.log(b);");
  });
});
