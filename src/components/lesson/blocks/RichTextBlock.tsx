import { Fragment } from "react";
import type { QuillDelta, QuillOp } from "@/types";

/**
 * Minimal Quill Delta renderer (no external dependency).
 *
 * Supports the common ops the Flutter editor produces: plain text, bold,
 * italic, underline, code (inline), links, headers, and bullet/ordered lists
 * via line-level attributes on the trailing "\n".
 *
 * BIDI: each text run that is purely Latin/code/numeric is wrapped in <bdi> so
 * it keeps LTR order inside the RTL paragraph (section 2). Arabic runs render
 * normally in the RTL flow.
 */

type Line = { ops: QuillOp[]; attrs: Record<string, unknown> };

const HAS_LATIN = /[A-Za-z0-9]/;
// Arabic, Arabic Supplement, and Arabic Presentation Forms A/B (via \u escapes
// so the ranges can't be mangled by editors/encoding).
const HAS_ARABIC =
  /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/;

function isLtrRun(text: string): boolean {
  // Force LTR when the run has Latin/digits and no Arabic letters.
  return HAS_LATIN.test(text) && !HAS_ARABIC.test(text);
}

/** Split the flat op list into lines based on newline characters in inserts. */
function toLines(delta: QuillDelta): Line[] {
  const lines: Line[] = [];
  let current: QuillOp[] = [];

  for (const op of delta.ops ?? []) {
    if (typeof op.insert !== "string") {
      // Embeds (images etc.) are handled as their own blocks; skip inline here.
      current.push(op);
      continue;
    }
    const parts = op.insert.split("\n");
    for (let i = 0; i < parts.length; i++) {
      if (parts[i]) current.push({ insert: parts[i], attributes: op.attributes });
      if (i < parts.length - 1) {
        // The newline itself may carry line-level attributes (list/header).
        lines.push({ ops: current, attrs: op.attributes ?? {} });
        current = [];
      }
    }
  }
  if (current.length) lines.push({ ops: current, attrs: {} });
  return lines;
}

function renderInline(op: QuillOp, key: number) {
  const text = typeof op.insert === "string" ? op.insert : "";
  if (!text) return null;
  const a = op.attributes ?? {};

  let node: React.ReactNode = text;
  if (isLtrRun(text)) node = <bdi dir="ltr">{text}</bdi>;

  if (a.code) node = <code className="rounded bg-space-navy-700 px-1 py-0.5 text-orbit-cyan">{node}</code>;
  if (a.bold) node = <strong>{node}</strong>;
  if (a.italic) node = <em>{node}</em>;
  if (a.underline) node = <u>{node}</u>;
  if (typeof a.link === "string") {
    node = (
      <a href={a.link} target="_blank" rel="noopener noreferrer">
        {node}
      </a>
    );
  }
  return <Fragment key={key}>{node}</Fragment>;
}

export default function RichTextBlock({ delta }: { delta: QuillDelta }) {
  const lines = toLines(delta);

  // Group consecutive list lines so <ul>/<ol> wrap correctly.
  const out: React.ReactNode[] = [];
  let listBuffer: { type: "bullet" | "ordered"; items: React.ReactNode[] } | null = null;

  const flushList = () => {
    if (!listBuffer) return;
    const items = listBuffer.items.map((it, i) => <li key={i}>{it}</li>);
    out.push(
      listBuffer.type === "ordered" ? (
        <ol key={`ol-${out.length}`}>{items}</ol>
      ) : (
        <ul key={`ul-${out.length}`}>{items}</ul>
      )
    );
    listBuffer = null;
  };

  lines.forEach((line, li) => {
    const inline = line.ops.map((op, i) => renderInline(op, i));
    const listType = line.attrs.list as string | undefined;
    const header = line.attrs.header as number | undefined;

    if (listType === "bullet" || listType === "ordered") {
      if (!listBuffer || listBuffer.type !== listType) {
        flushList();
        listBuffer = { type: listType, items: [] };
      }
      listBuffer.items.push(<>{inline}</>);
      return;
    }

    flushList();

    if (header === 1) out.push(<h1 key={li}>{inline}</h1>);
    else if (header === 2) out.push(<h2 key={li}>{inline}</h2>);
    else if (header === 3) out.push(<h3 key={li}>{inline}</h3>);
    else if (inline.some(Boolean)) out.push(<p key={li}>{inline}</p>);
  });
  flushList();

  return <div className="rich-text">{out}</div>;
}
