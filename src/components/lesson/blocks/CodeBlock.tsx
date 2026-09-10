/**
 * Code block — visually identical to the `.code-block` used in the admin's
 * uploaded HTML lessons: a dark #0d1117 panel, a header with traffic-light
 * dots + language label, and the same syn-* syntax-highlight palette.
 *
 * ALWAYS renders LTR internally (dir="ltr") — code must never be mirrored or
 * reordered, even though the page is RTL.
 *
 * "Simple syntax highlighting": a lightweight, dependency-free tokenizer
 * matching the syn-kw/syn-type/syn-str/syn-num/syn-fn/syn-cm/syn-var/syn-op/
 * syn-bool classes defined in globals.css. Intentionally minimal (not a full
 * language grammar) to keep the bundle small.
 */

const KEYWORDS = new Set([
  "const", "let", "var", "function", "return", "if", "else", "for", "while",
  "class", "extends", "new", "import", "export", "from", "default", "async",
  "await", "try", "catch", "finally", "throw", "switch", "case", "break",
  "continue", "this", "super", "void", "typeof", "instanceof", "in", "of",
  "do", "yield",
  // Dart/Flutter-ish and Python-ish extras (content is programming-focused)
  "final", "override", "def", "self", "elif", "print",
]);

const TYPES = new Set([
  "int", "double", "String", "bool", "List", "Map", "Set", "num", "dynamic",
  "Object", "void", "Future", "Widget",
]);

const BOOL_NULL = new Set(["true", "false", "null", "None", "True", "False"]);

type Token = { text: string; cls: string };

function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  // Order matters: comments/strings first, then numbers, identifiers, other.
  const re =
    /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|(\()|(\s+)|([^\s\w])/g;

  let m: RegExpExecArray | null;
  let prevWord = "";
  while ((m = re.exec(code)) !== null) {
    if (m[1]) tokens.push({ text: m[1], cls: "syn-cm" });
    else if (m[2]) tokens.push({ text: m[2], cls: "syn-str" });
    else if (m[3]) tokens.push({ text: m[3], cls: "syn-num" });
    else if (m[4]) {
      const w = m[4];
      let cls = "syn-var";
      if (KEYWORDS.has(w)) cls = "syn-kw";
      else if (TYPES.has(w)) cls = "syn-type";
      else if (BOOL_NULL.has(w)) cls = "syn-bool";
      tokens.push({ text: w, cls });
      prevWord = w;
    } else if (m[5]) {
      // "(" right after an identifier => that identifier was a function call.
      if (prevWord && tokens.length) {
        const last = tokens[tokens.length - 1];
        if (last.text === prevWord && last.cls === "syn-var") last.cls = "syn-fn";
      }
      tokens.push({ text: m[5], cls: "syn-op" });
    } else if (m[6]) tokens.push({ text: m[6], cls: "" });
    else tokens.push({ text: m[0], cls: "syn-op" });
  }
  return tokens;
}

export default function CodeBlock({
  code,
  language,
}: {
  code: string;
  language?: string;
}) {
  const tokens = tokenize(code);
  return (
    <figure className="code-block my-5">
      <div className="code-header">
        <div className="code-dots">
          <span style={{ background: "#ff6b9d" }} />
          <span style={{ background: "#ff8c42" }} />
          <span style={{ background: "#00e88f" }} />
        </div>
        {language && (
          <span className="font-mono text-xs text-space-muted" dir="ltr">
            {language}
          </span>
        )}
      </div>
      {/* dir="ltr": code must never be reordered inside the RTL page. */}
      <pre dir="ltr" className="text-start">
        <code>
          {tokens.map((t, i) => (
            <span key={i} className={t.cls}>
              {t.text}
            </span>
          ))}
        </code>
      </pre>
    </figure>
  );
}
