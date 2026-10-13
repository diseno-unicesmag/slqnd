#!/usr/bin/env bash
# Publica el sitio: construye la exportación estática y la deja en la rama main,
# que es la que sirve GitHub Pages. El código fuente vive en la rama next.
# Uso (Git Bash, desde la raíz del repositorio):  bash scripts/publicar.sh "mensaje"
set -euo pipefail

MENSAJE="${1:-Publica el sitio}"
TMP="$(mktemp -d)"

MSYS_NO_PATHCONV=1 BASE_PATH=/slqnd npx next build

git worktree add --force "$TMP" main
(
  cd "$TMP"
  git rm -rq --ignore-unmatch .
  git clean -fdxq
)
cp -r out/. "$TMP"/
touch "$TMP/.nojekyll"
(
  cd "$TMP"
  git add -A
  if git diff --cached --quiet; then
    echo "Nada nuevo que publicar."
  else
    git commit -q -m "$MENSAJE"
    git push origin main
  fi
)
git worktree remove --force "$TMP"
echo "Listo: https://diseno-unicesmag.github.io/slqnd/"
