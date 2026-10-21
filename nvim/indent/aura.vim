" Vim indent file for Aura Language
" Language: Aura

if exists("b:did_indent")
  finish
endif
let b:did_indent = 1

setlocal autoindent
setlocal cindent
setlocal cinoptions+=L0,(0,W4
setlocal tabstop=4
setlocal softtabstop=4
setlocal shiftwidth=4
setlocal expandtab

let b:undo_indent = "setl cin< cino< ts< sts< sw< et<"
