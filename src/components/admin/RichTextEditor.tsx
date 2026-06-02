import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Dropcursor from "@tiptap/extension-dropcursor";
import Gapcursor from "@tiptap/extension-gapcursor";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  LinkIcon,
  ImageIcon,
  Undo2,
  Redo2,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import type { JSONContent } from "@tiptap/react";

interface Props {
  value: string;
  jsonValue?: JSONContent | null;
  onChange: (html: string, json: JSONContent) => void;
  onAssetUploaded?: (url: string) => void;
  /** Used to scope inline-image uploads. If absent, caller should request creation of a draft first. */
  columnId?: string | null;
  requestColumnId?: () => Promise<string | null>;
}

export function RichTextEditor({
  value,
  jsonValue,
  onChange,
  onAssetUploaded,
  columnId,
  requestColumnId,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      Image.configure({ inline: false }),
      Placeholder.configure({ placeholder: "Escreva sua coluna..." }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Dropcursor,
      Gapcursor,
    ],
    content: jsonValue ?? value ?? "",
    onUpdate: ({ editor }) => onChange(editor.getHTML(), editor.getJSON()),
    editorProps: {
      attributes: {
        class:
          "prose-editorial max-w-none focus:outline-none min-h-[420px] py-4",
      },
    },
    immediatelyRender: false,
  });

  if (!editor) {
    return (
      <div className="border rounded-md p-4 text-sm text-muted-foreground">
        Carregando editor...
      </div>
    );
  }

  const addLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const uploadInlineImage = async (file: File) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast.error("Formato inválido. Use JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem maior que 5MB.");
      return;
    }
    let cid = columnId ?? null;
    if (!cid && requestColumnId) {
      cid = await requestColumnId();
    }
    if (!cid) {
      toast.error("Salve um rascunho antes de inserir imagens.");
      return;
    }
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `columns/${cid}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("inline-images")
      .upload(path, file, { cacheControl: "31536000", upsert: false });
    if (error) {
      toast.error(`Falha no upload: ${error.message}`);
      return;
    }
    const { data } = supabase.storage.from("inline-images").getPublicUrl(path);
    editor
      .chain()
      .focus()
      .setImage({ src: data.publicUrl, alt: file.name, title: file.name })
      .run();
    onAssetUploaded?.(data.publicUrl);
    toast.success("Imagem inserida");
  };

  const onPickImage = () => fileInputRef.current?.click();

  const btn = (active: boolean) =>
    `h-8 px-2 rounded text-sm transition-colors ${
      active ? "bg-accent text-accent-foreground" : "hover:bg-muted"
    }`;

  return (
    <div className="border rounded-md bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b px-2 py-1.5">
        <button type="button" className={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive("underline"))}
          onClick={() => editor.chain().focus().toggleUnderline().run()}>
          <UnderlineIcon className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive("strike"))}
          onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-border mx-1" />
        <button type="button" className={btn(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive("heading", { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-border mx-1" />
        <button type="button" className={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive("blockquote"))}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-border mx-1" />
        <button type="button" className={btn(editor.isActive({ textAlign: "left" }))}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}>
          <AlignLeft className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive({ textAlign: "center" }))}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}>
          <AlignCenter className="h-4 w-4" />
        </button>
        <button type="button" className={btn(editor.isActive({ textAlign: "right" }))}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}>
          <AlignRight className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-border mx-1" />
        <button type="button" className={btn(editor.isActive("link"))} onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </button>
        <button type="button" className={btn(false)} onClick={onPickImage}>
          <ImageIcon className="h-4 w-4" />
        </button>
        <span className="flex-1" />
        <Button type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().undo().run()}>
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm"
          onClick={() => editor.chain().focus().redo().run()}>
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="px-4">
        <EditorContent editor={editor} />
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void uploadInlineImage(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}