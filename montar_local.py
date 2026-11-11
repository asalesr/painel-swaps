"""Gera o HTML local (PC, sem login e sem rede) a partir de celular/index.html.

Uso:  python montar_local.py resumo.json saida.html [painel.html cenarios.html panorama.html]

- lê o resumo (JSON) e grava um HTML único, com app.css e app.js embutidos e window.RESUMO_LOCAL definido;
- o supabase-js NÃO entra no HTML local (ele não depende de rede);
- os três últimos argumentos (opcionais) são os caminhos dos documentos técnicos: viram window.LINKS_LOCAIS
  (links na tela "Mais"). Se faltarem, essas telas mostram "Disponível no app do celular".
O arquivo de saída contém os dados reais do resumo: não o coloque em pasta pública.
"""
import json
import pathlib
import re
import sys

AQUI = pathlib.Path(__file__).resolve().parent


def escapar(js_texto: str) -> str:
    """Evita que o texto feche a tag <script> dentro do HTML."""
    return js_texto.replace("</", "<\\/")


def trocar_uma_vez(texto: str, padrao: str, novo: str, rotulo: str, regex: bool = False) -> str:
    n = len(re.findall(padrao, texto)) if regex else texto.count(padrao)
    if n != 1:
        sys.exit(f"Erro: esperava 1 ocorrência de {rotulo} em index.html e achei {n}.")
    if regex:
        return re.sub(padrao, lambda _m: novo, texto, count=1)
    return texto.replace(padrao, novo, 1)


def main() -> None:
    if len(sys.argv) not in (3, 6):
        sys.exit(__doc__)
    entrada, saida = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2])
    resumo = json.loads(entrada.read_text(encoding="utf-8"))
    if not isinstance(resumo, dict) or not isinstance(resumo.get("swaps"), list):
        sys.exit("Erro: o JSON não parece um resumo (falta a lista 'swaps').")

    html = (AQUI / "index.html").read_text(encoding="utf-8")
    css = (AQUI / "app.css").read_text(encoding="utf-8")
    js = (AQUI / "app.js").read_text(encoding="utf-8")
    if "</script" in js.lower():
        sys.exit("Erro: app.js contém '</script'; não dá para embutir com segurança.")

    html = trocar_uma_vez(html, r'<link rel="stylesheet" href="app\.css[^"]*">', "<style>\n" + css.replace("</", "<\\/") + "\n</style>", "o link do app.css", regex=True)
    html = trocar_uma_vez(html, r'<script src="https://cdn\.jsdelivr\.net/npm/@supabase/[^"]*"></script>\s*', "", "o script do supabase-js", regex=True)

    dados = "window.RESUMO_LOCAL = " + escapar(json.dumps(resumo, ensure_ascii=False)) + ";\n"
    if len(sys.argv) == 6:
        nomes = ("painel", "cenarios", "panorama")
        links = {n: pathlib.Path(a).resolve().as_uri() for n, a in zip(nomes, sys.argv[3:6])}
        dados += "window.LINKS_LOCAIS = " + escapar(json.dumps(links, ensure_ascii=False)) + ";\n"
    html = trocar_uma_vez(html, "<!--RESUMO_LOCAL-->", "<script>\n" + dados + "</script>", "o marcador RESUMO_LOCAL")
    html = trocar_uma_vez(html, r'<script src="app\.js[^"]*"></script>', "<script>\n" + js + "\n</script>", "o script app.js", regex=True)

    saida.write_text(html, encoding="utf-8")
    print(f"Gerado: {saida} ({saida.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
