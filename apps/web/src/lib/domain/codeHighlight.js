function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

const PYTHON_KEYWORDS = new Set([
  "and",
  "as",
  "assert",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "False",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "None",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "True",
  "try",
  "while",
  "with",
  "yield"
]);

const JSON_LITERALS = new Set(["true", "false", "null"]);

function highlightPythonLine(line) {
  const escaped = escapeHtml(line);
  const tokens = [];
  const pattern =
    /(&quot;[^&]*&quot;|&#39;[^&]*&#39;|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\b\d+(?:\.\d+)?\b|\b[A-Za-z_][A-Za-z0-9_]*\b|#[^\n]*)/g;

  let lastIndex = 0;
  for (const match of escaped.matchAll(pattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    tokens.push(escaped.slice(lastIndex, index));

    if (token.startsWith("#")) {
      tokens.push(`<span class="code-token comment">${token}</span>`);
    } else if (token.startsWith('"') || token.startsWith("'")) {
      tokens.push(`<span class="code-token string">${token}</span>`);
    } else if (/^\d/.test(token)) {
      tokens.push(`<span class="code-token number">${token}</span>`);
    } else if (PYTHON_KEYWORDS.has(token)) {
      tokens.push(`<span class="code-token keyword">${token}</span>`);
    } else {
      tokens.push(token);
    }

    lastIndex = index + token.length;
  }

  tokens.push(escaped.slice(lastIndex));
  return tokens.join("");
}

function highlightJsonLine(line) {
  const tokens = [];
  const pattern =
    /"(?:[^"\\]|\\.)*"(?=\s*:)|"(?:[^"\\]|\\.)*"|\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b|\b(?:true|false|null)\b/g;

  let lastIndex = 0;
  for (const match of line.matchAll(pattern)) {
    const token = match[0];
    const index = match.index ?? 0;
    tokens.push(escapeHtml(line.slice(lastIndex, index)));

    const escapedToken = escapeHtml(token);
    if (token.startsWith('"') && /^\s*:/.test(line.slice(index + token.length))) {
      tokens.push(`<span class="code-token property">${escapedToken}</span>`);
    } else if (token.startsWith('"')) {
      tokens.push(`<span class="code-token string">${escapedToken}</span>`);
    } else if (/^-?\d/.test(token)) {
      tokens.push(`<span class="code-token number">${escapedToken}</span>`);
    } else if (JSON_LITERALS.has(token)) {
      tokens.push(`<span class="code-token keyword">${escapedToken}</span>`);
    } else {
      tokens.push(escapedToken);
    }

    lastIndex = index + token.length;
  }

  tokens.push(escapeHtml(line.slice(lastIndex)));
  return tokens.join("");
}

export function renderHighlightedCode(source, language = "text") {
  const lines = (source || "").replace(/\t/g, "    ").split("\n");

  return lines
    .map((line, index) => {
      const content =
        language === "python"
          ? highlightPythonLine(line)
          : language === "json"
            ? highlightJsonLine(line)
            : escapeHtml(line || " ");
      return `<div class="code-block__line"><span class="code-block__gutter">${index + 1}</span><span class="code-block__content">${content || "&nbsp;"}</span></div>`;
    })
    .join("");
}
