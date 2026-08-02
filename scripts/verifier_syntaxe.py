"""Verification de syntaxe rapide, sans executer le code (ast.parse)."""
import ast
import sys

for chemin in sys.argv[1:]:
    ast.parse(open(chemin, encoding="utf-8").read())
    print(f"{chemin} OK (syntaxe valide)")
