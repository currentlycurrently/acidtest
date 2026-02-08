/**
 * Python parser implementation using tree-sitter-python
 * Extracts imports, functions, and variables from Python code
 */

import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';
import type { Parser as ParserInterface, ParsedFile, ImportStatement, FunctionDefinition, VariableDeclaration } from './parser-interface.js';

export class PythonParser implements ParserInterface {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
    // For tree-sitter 0.21.x, Python is the language object itself
    this.parser.setLanguage(Python as any);
  }

  /**
   * Check if this parser can handle the given file
   */
  canParse(filePath: string): boolean {
    return /\.py$/i.test(filePath);
  }

  /**
   * Parse Python file and extract information
   */
  parse(filePath: string, content: string): ParsedFile {
    const tree = this.parser.parse(content);
    const rootNode = tree.rootNode;

    const imports: ImportStatement[] = [];
    const functions: FunctionDefinition[] = [];
    const variables: VariableDeclaration[] = [];

    // Traverse the AST
    const traverse = (node: Parser.SyntaxNode) => {
      // Extract import statements: import X, import Y
      if (node.type === 'import_statement') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          const module = nameNode.text;
          const line = node.startPosition.row + 1;
          imports.push({ module, names: [], line });
        }
      }

      // Extract from imports: from X import Y, Z
      if (node.type === 'import_from_statement') {
        const moduleNode = node.childForFieldName('module_name');
        const module = moduleNode ? moduleNode.text : '';
        const names: string[] = [];
        const line = node.startPosition.row + 1;

        // Get imported names
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i);
          if (child?.type === 'dotted_name' || child?.type === 'identifier') {
            // This might be the imported name
            const nameText = child.text;
            if (nameText !== module && !names.includes(nameText)) {
              names.push(nameText);
            }
          } else if (child?.type === 'aliased_import') {
            const nameChild = child.childForFieldName('name');
            if (nameChild) {
              names.push(nameChild.text);
            }
          }
        }

        imports.push({ module, names, line });
      }

      // Extract function definitions
      if (node.type === 'function_definition') {
        const nameNode = node.childForFieldName('name');
        if (nameNode) {
          const name = nameNode.text;
          const params: string[] = [];
          const line = node.startPosition.row + 1;

          // Get parameters
          const parametersNode = node.childForFieldName('parameters');
          if (parametersNode) {
            for (let i = 0; i < parametersNode.childCount; i++) {
              const paramChild = parametersNode.child(i);
              if (paramChild?.type === 'identifier') {
                params.push(paramChild.text);
              } else if (paramChild?.type === 'typed_parameter' || paramChild?.type === 'default_parameter') {
                const paramName = paramChild.childForFieldName('name');
                if (paramName) {
                  params.push(paramName.text);
                }
              }
            }
          }

          functions.push({ name, params, line });
        }
      }

      // Extract variable assignments at module level
      if (node.type === 'assignment' && node.parent?.type === 'expression_statement') {
        const leftNode = node.childForFieldName('left');
        const rightNode = node.childForFieldName('right');

        if (leftNode?.type === 'identifier') {
          const name = leftNode.text;
          const value = rightNode ? rightNode.text.substring(0, 100) : undefined;
          const line = node.startPosition.row + 1;
          variables.push({ name, value, line });
        }
      }

      // Recursively traverse children
      for (let i = 0; i < node.childCount; i++) {
        const child = node.child(i);
        if (child) {
          traverse(child);
        }
      }
    };

    traverse(rootNode);

    return {
      filePath,
      ast: tree,
      imports,
      functions,
      variables
    };
  }
}
