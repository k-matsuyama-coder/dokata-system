"use client";

import React, { useEffect, useRef, useState } from "react";

type Props = {
  detail: string;
  title: string;
  isMobile: boolean;
  onOpen: (title: string, text: string) => void;
};

export default function DetailPreview({
  detail,
  title,
  isMobile,
  onOpen,
}: Props) {
  const text = `詳細：${detail}`;
  const textRef = useRef<HTMLDivElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const checkOverflow = () => {
      setIsOverflowing(element.scrollWidth > element.clientWidth);
    };

    checkOverflow();

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [text, isMobile]);

  return (
    <button
      type="button"
      onClick={() => {
        if (!isOverflowing) return;
        onOpen(title, detail);
      }}
      style={{
        ...detailPreviewButtonStyle,
        cursor: isOverflowing ? "pointer" : "default",
      }}
    >
      <div
        ref={textRef}
        style={{
          ...notesBlockStyle,
          fontSize: isMobile ? 9 : 12,
          padding: isMobile ? "5px 6px" : "8px 9px",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        {text}
      </div>

      {isOverflowing ? (
        <div style={detailMoreTextStyle}>タップで全文</div>
      ) : null}
    </button>
  );
}

const notesBlockStyle: React.CSSProperties = {
  padding: "8px 9px",
  borderRadius: 12,
  background: "linear-gradient(180deg, #f3f4f6 0%, #ffffff 100%)",
  border: "1px solid #d1d5db",
  color: "#374151",
  fontSize: 10,
  fontWeight: 800,
  lineHeight: 1.4,
  wordBreak: "break-word",
};

const detailPreviewButtonStyle: React.CSSProperties = {
  display: "block",
  border: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  textAlign: "left",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "hidden",
  boxSizing: "border-box",
};

const detailMoreTextStyle: React.CSSProperties = {
  marginTop: 4,
  fontSize: 10,
  fontWeight: 800,
  color: "#2563eb",
};