/**
 * TypeScript/JavaScript parser implementation
 * Extracts imports, functions, and variables from TypeScript/JavaScript code
 */

import ts from 'typescript';
import type { Parser, ParsedFile, ImportStatement, FunctionDefinition, VariableDeclaration } from './parser-interface.js';

export class TypeScriptParser implements Parser {
  /**
   * Check if this parser can handle the given file
   */
  canParse(filePath: string): boolean {
    return /\.(ts|js|mjs|cjs)$/i.test(filePath);
  }

  /**
   * Parse TypeScript/JavaScript file and extract information
   */
  parse(filePath: string, content: string): ParsedFile {
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const imports: ImportStatement[] = [];
    const functions: FunctionDefinition[] = [];
    const variables: VariableDeclaration[] = [];

    // Traverse AST to extract imports, functions, and variables
    const visit = (node: ts.Node) => {
      // Extract import statements
      if (ts.isImportDeclaration(node)) {
        const importClause = node.importClause;
        const moduleSpecifier = node.moduleSpecifier;

        if (ts.isStringLiteral(moduleSpecifier)) {
          const module = moduleSpecifier.text;
          const names: string[] = [];

          // Named imports
          if (importClause?.namedBindings) {
            if (ts.isNamedImports(importClause.namedBindings)) {
              for (const element of importClause.namedBindings.elements) {
                names.push(element.name.text);
              }
            } else if (ts.isNamespaceImport(importClause.namedBindings)) {
              names.push(importClause.namedBindings.name.text);
            }
          }

          // Default import
          if (importClause?.name) {
            names.push(importClause.name.text);
          }

          const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
          imports.push({ module, names, line });
        }
      }

      // Extract require() calls
      if (ts.isCallExpression(node)) {
        const expression = node.expression;
        if (ts.isIdentifier(expression) && expression.text === 'require') {
          if (node.arguments.length > 0) {
            const arg = node.arguments[0];
            if (ts.isStringLiteral(arg)) {
              const module = arg.text;
              const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
              imports.push({ module, names: [], line });
            }
          }
        }
      }

      // Extract function declarations
      if (ts.isFunctionDeclaration(node) && node.name) {
        const name = node.name.text;
        const params = node.parameters.map(p => {
          if (ts.isIdentifier(p.name)) {
            return p.name.text;
          }
          return p.name.getText(sourceFile);
        });
        const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
        functions.push({ name, params, line });
      }

      // Extract arrow functions assigned to variables
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.initializer) {
            const name = declaration.name.text;
            const line = sourceFile.getLineAndCharacterOfPosition(declaration.getStart()).line + 1;

            // Check if it's a function
            if (ts.isArrowFunction(declaration.initializer) || ts.isFunctionExpression(declaration.initializer)) {
              const funcNode = declaration.initializer;
              const params = funcNode.parameters.map(p => {
                if (ts.isIdentifier(p.name)) {
                  return p.name.text;
                }
                return p.name.getText(sourceFile);
              });
              functions.push({ name, params, line });
            } else {
              // Regular variable
              const value = declaration.initializer.getText(sourceFile).substring(0, 100);
              variables.push({ name, value, line });
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    return {
      filePath,
      ast: sourceFile,
      imports,
      functions,
      variables
    };
  }
}
