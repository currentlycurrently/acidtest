/**
 * Parser interface for code analysis
 * Provides a common interface for parsing different programming languages
 */

export interface ParsedFile {
  filePath: string;
  ast: any;
  imports: ImportStatement[];
  functions: FunctionDefinition[];
  variables: VariableDeclaration[];
}

export interface ImportStatement {
  module: string;
  names: string[];
  line: number;
}

export interface FunctionDefinition {
  name: string;
  params: string[];
  line: number;
}

export interface VariableDeclaration {
  name: string;
  value?: string;
  line: number;
}

export interface Parser {
  canParse(filePath: string): boolean;
  parse(filePath: string, content: string): ParsedFile;
}
