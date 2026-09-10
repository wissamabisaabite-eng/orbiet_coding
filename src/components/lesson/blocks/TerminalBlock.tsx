/**
 * "Terminal" block — a fake terminal panel showing a command + its output.
 * Always LTR (dir="ltr") like code blocks: shell commands must never be
 * mirrored under RTL.
 */
export default function TerminalBlock({
  command,
  output,
}: {
  command: string;
  output?: string;
}) {
  return (
    <figure className="terminal-block my-5">
      <div className="terminal-header">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff6b9d" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#ff8c42" }} />
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: "#00e88f" }} />
      </div>
      <div className="terminal-body" dir="ltr">
        <div className="cmd-line">
          <span className="cmd-prompt">$ </span>
          {command}
        </div>
        {output && (
          <div className="cmd-output">
            {output.split("\n").map((line, i, arr) => (
              <span key={i}>
                {line}
                {i < arr.length - 1 && <br />}
              </span>
            ))}
          </div>
        )}
      </div>
    </figure>
  );
}
