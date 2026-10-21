" Vim syntax file for aura.lock (Aura Lockfile)
" Language: Aura Lockfile
" Maintainer: Aura Lang Developer

if exists("b:current_syntax")
  finish
endif

syn match auralockComment "(?://|#).*$" contains=@Spell
syn match auralockPackage "\<[a-zA-Z0-9_.-]\+\%(/[a-zA-Z0-9_.-]\+\)\+\>"
syn match auralockVersion "\<v\=[0-9]\+\.[0-9]\+\%(\.[0-9]\+\)\=\%(-[a-zA-Z0-9_.]\+\)\=\>"
syn match auralockHash "\<h1:[a-zA-Z0-9+/=]\+\>"
syn match auralockHash "\<[a-fA-F0-9]\{64\}\>"

hi def link auralockComment Comment
hi def link auralockPackage Identifier
hi def link auralockVersion Number
hi def link auralockHash Special

let b:current_syntax = "auralock"
