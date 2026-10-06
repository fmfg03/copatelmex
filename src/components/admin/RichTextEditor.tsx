import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ImagePlus,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  onImageUpload: (file: File) => Promise<string>;
}

export const RichTextEditor = ({ value, onChange, onImageUpload }: RichTextEditorProps) => {
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [insertionPosition, setInsertionPosition] = useState(0);
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });


  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value]);

  if (!editor) return null;

  const openImageDialog = () => {
    setInsertionPosition(editor.state.selection.from);
    setImageDialogOpen(true);
  };

  const closeImageDialog = (open: boolean) => {
    if (uploadingImage) return;
    setImageDialogOpen(open);
    if (!open) {
      setSelectedImage(null);
      setImageAlt("");
    }
  };

  const insertImage = async () => {
    if (!selectedImage || !imageAlt.trim()) return;
    setUploadingImage(true);
    try {
      const src = await onImageUpload(selectedImage);
      const inserted = editor.chain().focus().insertContentAt(insertionPosition, {
        type: "image",
        attrs: { src, alt: imageAlt.trim() },
      }).run();
      if (!inserted) throw new Error("No se pudo colocar la imagen en el contenido");
      setUploadingImage(false);
      setImageDialogOpen(false);
      setSelectedImage(null);
      setImageAlt("");
    } catch (error) {
      console.error("Error inserting news image:", error);
      toast({
        title: "No se pudo insertar la foto",
        description: error instanceof Error ? error.message : "Intenta nuevamente",
        variant: "destructive",
      });
      setUploadingImage(false);
    }
  };

  const ToolBtn = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="icon"
      className="h-7 w-7"
      onClick={onClick}
      title={title}
    >
      {children}
    </Button>
  );

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="flex flex-wrap gap-0.5 p-1 border-b bg-muted/50">
        <ToolBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrita">
          <Bold className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Cursiva">
          <Italic className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="Subrayado">
          <UnderlineIcon className="w-3.5 h-3.5" />
        </ToolBtn>
        <div className="w-px bg-border mx-0.5" />
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título">
          <Heading2 className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Subtítulo">
          <Heading3 className="w-3.5 h-3.5" />
        </ToolBtn>
        <div className="w-px bg-border mx-0.5" />
        <ToolBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">
          <List className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
          <ListOrdered className="w-3.5 h-3.5" />
        </ToolBtn>
        <div className="w-px bg-border mx-0.5" />
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="Alinear a la izquierda">
          <AlignLeft className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="Centrar">
          <AlignCenter className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="Alinear a la derecha">
          <AlignRight className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().setTextAlign("justify").run()} active={editor.isActive({ textAlign: "justify" })} title="Justificar">
          <AlignJustify className="w-3.5 h-3.5" />
        </ToolBtn>
        <div className="w-px bg-border mx-0.5" />
        <ToolBtn onClick={openImageDialog} title="Insertar foto">
          <ImagePlus className="w-3.5 h-3.5" />
        </ToolBtn>
        <div className="w-px bg-border mx-0.5" />
        <ToolBtn onClick={() => editor.chain().focus().undo().run()} title="Deshacer">

          <Undo className="w-3.5 h-3.5" />
        </ToolBtn>
        <ToolBtn onClick={() => editor.chain().focus().redo().run()} title="Rehacer">
          <Redo className="w-3.5 h-3.5" />
        </ToolBtn>
      </div>
      <EditorContent editor={editor} className="prose prose-sm max-w-none p-3 min-h-[150px] focus-within:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[140px] [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg" />
      <Dialog open={imageDialogOpen} onOpenChange={closeImageDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Insertar foto en la noticia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inline-news-image">Foto</Label>
              <Input
                id="inline-news-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={uploadingImage}
                onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="inline-news-image-alt">Descripción de la foto</Label>
              <Input
                id="inline-news-image-alt"
                value={imageAlt}
                onChange={(event) => setImageAlt(event.target.value)}
                placeholder="Describe lo que aparece en la foto"
                disabled={uploadingImage}
              />
            </div>
            <Button type="button" className="w-full" onClick={insertImage} disabled={!selectedImage || !imageAlt.trim() || uploadingImage}>
              {uploadingImage ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subiendo foto...</> : "Insertar foto"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
