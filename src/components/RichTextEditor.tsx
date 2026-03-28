"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { useEffect, useState } from "react";

interface RichTextEditorProps {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`px-2 py-1 rounded text-sm font-medium transition-colors ${
        active
          ? "bg-[#0B1C3A] text-white"
          : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  name,
  defaultValue = "",
  placeholder = "Enter description...",
  required = false,
}: RichTextEditorProps) {
  const [html, setHtml] = useState(defaultValue);
  const [isEmpty, setIsEmpty] = useState(!defaultValue);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content: defaultValue,
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] px-3 py-2 focus:outline-none prose prose-sm max-w-none",
      },
    },
    onUpdate({ editor }) {
      setHtml(editor.getHTML());
      setIsEmpty(editor.isEmpty);
    },
  });

  useEffect(() => {
    if (defaultValue && editor && editor.isEmpty) {
      editor.commands.setContent(defaultValue);
      setHtml(defaultValue);
      setIsEmpty(false);
    }
  }, [defaultValue, editor]);

  return (
    <div className="border border-gray-300 rounded focus-within:ring-2 focus-within:ring-[#0B1C3A] focus-within:border-transparent">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-200 bg-gray-50 rounded-t">
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          active={editor?.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          active={editor?.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          active={editor?.isActive("underline")}
          title="Underline"
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <span className="w-px bg-gray-300 mx-1 self-stretch" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          active={editor?.isActive("bulletList")}
          title="Bullet list"
        >
          ☰
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive("orderedList")}
          title="Numbered list"
        >
          1.
        </ToolbarButton>
        <span className="w-px bg-gray-300 mx-1 self-stretch" />
        <ToolbarButton
          onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
          title="Clear formatting"
        >
          ✕
        </ToolbarButton>
      </div>

      {/* Editor area */}
      <div className="relative bg-white rounded-b">
        {isEmpty && (
          <p className="absolute top-2 left-3 text-gray-400 text-sm pointer-events-none select-none">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} />
      </div>

      {/* Hidden input to submit HTML value with form */}
      <input
        type="hidden"
        name={name}
        value={isEmpty ? "" : html}
        required={required}
      />
    </div>
  );
}
