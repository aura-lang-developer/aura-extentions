; Tree-sitter syntax highlighting queries for Aura Language in Zed

; 1. Keywords
[
  "fn"
  "let"
  "mut"
  "const"
  "type"
  "interface"
  "trait"
  "impl"
  "struct"
  "packed"
  "module"
  "import"
  "export"
  "from"
  "as"
  "extern"
  "embed"
  "embedBytes"
  "match"
  "when"
  "if"
  "else"
  "while"
  "for"
  "in"
  "break"
  "continue"
  "return"
  "defer"
  "errdefer"
  "panic"
  "recover"
  "spawn"
  "routine"
  "go"
  "select"
  "case"
  "default"
] @keyword

; 2. Concurrency & Async
[
  "async"
  "await"
  "spawn"
  "routine"
  "go"
] @keyword.control

; 3. Built-in Boolean and Unit Literals
[
  "true"
  "false"
] @boolean

[
  "self"
  "Self"
  "this"
  "super"
] @variable.special

; 4. Primitive Types
[
  "Int"
  "Float"
  "String"
  "Bool"
  "Unit"
  "Byte"
  "Char"
  "Any"
  "Never"
  "Void"
] @type.builtin

; 5. Core Standard Library Types
[
  "Option"
  "Result"
  "Some"
  "None"
  "Ok"
  "Err"
  "Task"
  "Channel"
  "SendChannel"
  "RecvChannel"
  "Context"
  "WaitGroup"
  "Mutex"
  "RWMutex"
  "Once"
  "Pool"
  "Server"
  "Request"
  "Response"
  "ServeMux"
  "Handler"
  "Iterator"
  "Error"
  "List"
  "Array"
  "Map"
  "Set"
] @type.builtin

; 6. Functions & Method Declarations
(function_declaration
  name: (identifier) @function)

(call_expression
  function: (identifier) @function.call)

(call_expression
  function: (member_expression
    property: (identifier) @function.method))

; 7. Types, Structs & Sum Types
(struct_declaration
  name: (identifier) @type)

(type_declaration
  name: (identifier) @type)

(sum_type_declaration
  name: (identifier) @type)

(sum_type_variant
  name: (identifier) @constructor)

(interface_declaration
  name: (identifier) @type)

; 8. Variables and Parameters
(parameter
  name: (identifier) @variable.parameter)

(variable_declaration
  name: (identifier) @variable)

(identifier) @variable

; 9. Literals
(number) @number
(string) @string
(template_string) @string
(escape_sequence) @string.escape

; 10. Operators
[
  "|>"
  "<-"
  "->"
  "=>"
  "::"
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
  "^"
  "<"
  ">"
  "..."
  ".."
] @operator

; 11. Comments & Directives
(comment) @comment
(line_comment) @comment
(block_comment) @comment

; 12. Punctuation
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
