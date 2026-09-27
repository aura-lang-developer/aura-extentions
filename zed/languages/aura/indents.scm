; Tree-sitter indent queries for Aura in Zed

[
  (block)
  (match_expression)
  (select_expression)
  (record_literal)
  (list_literal)
  (interface_declaration)
  (sum_type_declaration)
] @indent

[
  "}"
  ")"
  "]"
] @outdent
