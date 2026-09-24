import { test } from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

// Web accepts bare text in layout containers; React Native throws at runtime,
// including for an explicit JSX space in a branch that only renders on phones.
test("native layout containers have no literal text children", () => {
  const failures: string[] = [];
  function scan(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) { scan(path); continue; }
      if (!path.endsWith(".tsx")) continue;
      const source = ts.createSourceFile(path, readFileSync(path, "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        if (ts.isJsxElement(node) && ["View", "Pressable", "ScrollView", "SafeAreaView", "KeyboardAvoidingView"].includes(node.openingElement.tagName.getText(source))) {
          for (const child of node.children) {
            const rawText = ts.isJsxText(child) && child.text.trim().length > 0;
            const literal = ts.isJsxExpression(child) && child.expression &&
              (ts.isStringLiteral(child.expression) || ts.isNoSubstitutionTemplateLiteral(child.expression));
            if (rawText || literal) failures.push(`${path}:${source.getLineAndCharacterOfPosition(child.getStart(source)).line + 1}`);
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  for (const folder of ["app", "screens", "components"]) scan(folder);
  assert.deepEqual(failures, [], "Render text inside Text, including explicit spaces.");
});
