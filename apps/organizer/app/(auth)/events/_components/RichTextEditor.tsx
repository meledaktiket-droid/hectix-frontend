"use client";

import { useRef } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useMutation } from "@tanstack/react-query";
import {
  Bold, Italic, List, ListOrdered, Heading2, Heading3,
  Link as LinkIcon, Image as ImageIcon,
} from "lucide-react";

async function uploadImage(file: File): Promise<string> {
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      folder: "events/descriptions",
    }),
  });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error ?? "Upload failed. Please try again.");
  }
  const { url, publicUrl } = await res.json();
  await fetch(url, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return publicUrl as string;
}

function ToolbarButton({ active, disabled, onClick, title, children }: {
  active?: boolean; disabled?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40 ${active ? "bg-muted text-foreground" : ""}`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const imageMutation = useMutation({
    mutationFn: uploadImage,
    onSuccess: (url) => editor.chain().focus().setImage({ src: url }).run(),
  });

  function addLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-input px-2 py-1.5">
      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="size-4" /></ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="size-4" /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-input" />
      <ToolbarButton title="Heading" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="size-4" /></ToolbarButton>
      <ToolbarButton title="Subheading" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="size-4" /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-input" />
      <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="size-4" /></ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="size-4" /></ToolbarButton>
      <span className="mx-1 h-5 w-px bg-input" />
      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={addLink}><LinkIcon className="size-4" /></ToolbarButton>
      <ToolbarButton title="Image" disabled={imageMutation.isPending} onClick={() => fileRef.current?.click()}><ImageIcon className="size-4" /></ToolbarButton>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => { const file = e.target.files?.[0]; if (file) imageMutation.mutate(file); e.target.value = ""; }}
      />
      {imageMutation.isPending && <span className="ml-1 text-xs text-muted-foreground">Uploading…</span>}
    </div>
  );
}

export function RichTextEditor({ value, onChange, placeholder = "Describe your event…" }: {
  value: string; onChange: (html: string) => void; placeholder?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
        underline: false,
      }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: { class: "prose-event min-h-40 px-3 py-2.5 focus:outline-none" },
    },
  });

  return (
    <div className="rounded-lg border border-input bg-background focus-within:ring-2 focus-within:ring-ring">
      {editor && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
