" Vim syntax file for Aura Language
" Language: Aura
" Maintainer: Aura Lang Developer

if exists("b:current_syntax")
  finish
endif

" 1. Build Directives
syn match auraBuildDirective "^//\%(aura\|go\):build.*$"
syn match auraBuildDirective "^//\s*+build.*$"

" 2. Keywords
syn keyword auraKeyword fn let mut const type interface trait impl module import export from as extern embed embedBytes struct packed
syn keyword auraControl if else match when while for in break continue return defer errdefer panic recover select case default
syn keyword auraConcurrency spawn routine go
syn keyword auraAsync async await
syn keyword auraBoolean true false
syn keyword auraConstant self Self this super

" 3. Types
syn keyword auraType Int Float String Bool Unit Byte Char Any Never Void
syn keyword auraCoreType Option Result Some None Ok Err Task List Array Map Set Channel SendChannel RecvChannel Context WaitGroup Mutex RWMutex Once Pool Server Request Response ServeMux Handler Iterator Error

" 4. Stdlib modules and builtins
syn keyword auraStdlib pg postgres mysql mongo mongodb redis http sync json math io time os env process
syn keyword auraBuiltin println print eprintln eprint panic recover len make assert assert_eq

" 5. Strings & Template Strings
syn region auraString start='"' skip='\\\\\|\\"' end='"' contains=auraEscape
syn region auraTemplateString start='`' skip='\\\\\|\\`' end='`' contains=auraTemplateEmbed,auraEscape
syn region auraTemplateEmbed start='\${' end='}' contained contains=TOP
syn match auraEscape contained "\\\%([nrt\\\"0]\|x[0-9a-fA-F]\{2}\|u{[0-9a-fA-F]\+}\)"

" 6. Comments
syn match auraComment "//.*$" contains=auraTodo,@Spell
syn region auraComment start="/\*" end="\*/" contains=auraTodo,@Spell
syn match auraDocComment "///.*$" contains=auraDocTag,@Spell
syn match auraDocTag "@\%(param\|return\|returns\|example\|see\|note\|throws\|type\|since\|deprecated\)\>" contained
syn keyword auraTodo TODO FIXME XXX NOTE BUG contained

" 7. Numbers
syn match auraNumber "\<0x[0-9a-fA-F_]\+\>"
syn match auraNumber "\<0b[01_]\+\>"
syn match auraNumber "\<[0-9][0-9_]*\%(\.[0-9][0-9_]*\)\=\%([eE][+-]\=[0-9_]\+\)\=\>"

" 8. Operators
syn match auraOperator "|>"
syn match auraOperator "<-"
syn match auraOperator "->"
syn match auraOperator "=>"
syn match auraOperator "::"
syn match auraOperator "==\|!=\|<=\|>=\|<\|>"
syn match auraOperator "+\|-\|*\|/\|%"
syn match auraOperator "&&\|||\|!"
syn match auraOperator "&\||\|\^\|<<\|>>"
syn match auraOperator "\.\.\.\|\.\."
syn match auraOperator "?"
syn match auraOperator "#[{[]"

" 9. Function & Method Declarations
syn match auraFunction "\<fn\s\+\zs[a-zA-Z_][a-zA-Z0-9_]*\ze\s*("
syn match auraMethod "\<fn\s*([^)]*)\s*\zs[a-zA-Z_][a-zA-Z0-9_]*\ze\s*("

" Highlighting Links
hi def link auraBuildDirective PreProc
hi def link auraKeyword Keyword
hi def link auraControl Conditional
hi def link auraConcurrency Keyword
hi def link auraAsync Keyword
hi def link auraBoolean Boolean
hi def link auraConstant Constant
hi def link auraType Type
hi def link auraCoreType Structure
hi def link auraStdlib Identifier
hi def link auraBuiltin Function
hi def link auraString String
hi def link auraTemplateString String
hi def link auraTemplateEmbed Special
hi def link auraEscape SpecialChar
hi def link auraComment Comment
hi def link auraDocComment Comment
hi def link auraDocTag SpecialComment
hi def link auraTodo Todo
hi def link auraNumber Number
hi def link auraOperator Operator
hi def link auraFunction Function
hi def link auraMethod Function

let b:current_syntax = "aura"
