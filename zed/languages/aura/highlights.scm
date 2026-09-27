; Tree-sitter syntax highlighting queries for Aura Language in Zed

; Keywords
[
  "fn"
  "let"
  "mut"
  "type"
  "interface"
  "match"
  "when"
  "if"
  "else"
  "async"
  "await"
  "spawn"
  "routine"
  "go"
  "select"
  "default"
  "while"
  "for"
  "in"
  "defer"
  "errdefer"
  "import"
  "export"
  "from"
  "extern"
  "return"
  "break"
  "continue"
  "panic"
  "recover"
  "struct"
  "packed"
] @keyword

; Built-in Boolean and Unit Literals
[
  "true"
  "false"
] @boolean

; Primitive Types
[
  "Int"
  "Float"
  "String"
  "Bool"
  "Unit"
  "Option"
  "Result"
  "Task"
  "Channel"
  "List"
  "Array"
  "Map"
  "Set"
  "Iterator"
] @type.builtin

; Functions
(function_declaration
  name: (identifier) @function)

(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (member_expression
    property: (identifier) @function.method))

; Types & Sum Types
(type_declaration
  name: (identifier) @type)

(sum_type_declaration
  name: (identifier) @type)

(sum_type_variant
  name: (identifier) @constructor)

(interface_declaration
  name: (identifier) @type)

; Variables and Parameters
(parameter
  name: (identifier) @variable.parameter)

(variable_declaration
  name: (identifier) @variable)

(identifier) @variable

; Literals
(number) @number
(string) @string
(template_string) @string
(escape_sequence) @string.escape

; Operators
[
  "|>"
  "<-"
  "->"
  "=>"
  "=="
  "!="
  "<="
  ">="
  "&&"
  "||"
  "="
  "+"
  "-"
  "*"
  "/"
  "%"
  "!"
  "?"
  "|"
  "&"
  "<"
  ">"
] @operator

; Comments
(comment) @comment
(line_comment) @comment
(block_comment) @comment

; Punctuation
[
  "{"
  "}"
  "("
  ")"
  "["
  "]"
] @punctuation.bracket

[
  ";"
  ":"
  ","
  "."
] @punctuation.delimiter
