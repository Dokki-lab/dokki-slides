#!/usr/bin/env bash
# Rebuild examples/angel-round/deck.json from pages/ with the skill CLI.
set -euo pipefail
cd "$(dirname "$0")"
CLI=../../dokki-slides/scripts/dokki-slides.mjs
rm -f deck.json
node $CLI init . --title "Dokki 天使轮 · 讨论版" >/dev/null
# init seeds a cover; page 01 replaces it, so remove the seed after page 01 lands.
for f in $(ls pages | rg '^\d\d-' | sed -E 's/\.(json|svg|notes\.md)$//' | sort -u); do
  notes=()
  [ -f "pages/$f.notes.md" ] && notes=(--notes-file "pages/$f.notes.md")
  if [ -f "pages/$f.json" ]; then
    layout=$(node -e "console.log(JSON.parse(require('fs').readFileSync('pages/$f.json','utf8')).layout)")
    node -e "const p=JSON.parse(require('fs').readFileSync('pages/$f.json','utf8'));require('fs').writeFileSync('pages/.$f.content.json',JSON.stringify(p.content))"
    node $CLI layout deck.json "$layout" --content "pages/.$f.content.json" --id "p${f%%-*}" --name "$f" ${notes[@]+"${notes[@]}"} | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log('$f', r.ok?'ok':'HARD', r.lint.length?JSON.stringify(r.lint.map(x=>x.rule+':'+x.message)):'')})"
    rm -f "pages/.$f.content.json"
  else
    node $CLI svg deck.json "pages/$f.svg" --id "p${f%%-*}" --name "$f" ${notes[@]+"${notes[@]}"} | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log('$f', r.ok?'ok':'HARD', r.warnings.length?'warnings:'+r.warnings.join(';'):'', r.lint.length?JSON.stringify(r.lint.map(x=>x.rule+':'+x.message)):'')})"
  fi
done
node $CLI remove deck.json cover >/dev/null
node $CLI package deck.json --out-dir dist | node -e "process.stdin.on('data',d=>{const r=JSON.parse(d);console.log('package', r.ok?'ok':'HARD', 'slides', r.slideCount, 'hard', r.lint.hard, 'soft', r.lint.soft)})"
