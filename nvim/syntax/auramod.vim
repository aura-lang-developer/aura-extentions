" Vim syntax file for aura.mod (Aura Modules)
" Language: Aura Module Definition
" Maintainer: Aura Lang Developer

if exists("b:current_syntax")
  finish
endif

syn match auramodComment "(?://|#).*$" contains=@Spell
syn keyword auramodKeyword module aura require replace indirect

syn region auramodString start='"' skip='\\\\\|\\"' end='"'
syn region auramodString start="'" skip="\\\\\|\\'" end="'"

syn match auramodVersion "\<v\=[0-9]\+\.[0-9]\+\%(\.[0-9]\+\)\=\%(-[a-zA-Z0-9_.]\+\)\=\>"
syn match auramodPackage "\<[a-zA-Z0-9_.-]\+\%(/[a-zA-Z0-9_.-]\+\)\+\>"
syn match auramodArrow "=>"

hi def link auramodComment Comment
hi def link auramodKeyword Keyword
hi def link auramodString String
hi def link auramodVersion Number
hi def link auramodPackage Identifier
hi def link auramodArrow Operator

let b:current_syntax = "auramod"
