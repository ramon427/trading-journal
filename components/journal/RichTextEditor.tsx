"use client";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExtension from '@tiptap/extension-image';
import LinkExtension from '@tiptap/extension-link';
import PlaceholderExtension from '@tiptap/extension-placeholder';
import { Node, mergeAttributes } from '@tiptap/core';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Code,
  Link2,
  Heading2,
  Strikethrough,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { useEffect, useCallback, useState, useRef } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

// Custom Image Extension with width/height support
const ResizableImage = ImageExtension.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return { width: attributes.width };
        },
        parseHTML: element => element.getAttribute('width'),
      },
      height: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.height) {
            return {};
          }
          return { height: attributes.height };
        },
        parseHTML: element => element.getAttribute('height'),
      },
    };
  },
});

export function RichTextEditor({ content, onChange, placeholder = 'Start writing...', minHeight = '200px' }: RichTextEditorProps) {
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [bubbleMenuVisible, setBubbleMenuVisible] = useState(false);
  const [bubbleMenuPosition, setBubbleMenuPosition] = useState({ top: 0, left: 0 });
  const [selectedImageSize, setSelectedImageSize] = useState<number>(100);
  const [isImageSelected, setIsImageSelected] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const bubbleMenuRef = useRef<HTMLDivElement>(null);
  const imageNodeRef = useRef<any>(null);
  
  // Use ref to store the latest onChange callback to avoid recreating the editor
  const onChangeRef = useRef(onChange);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // Disable the default link extension to avoid conflicts
        link: false,
      }),
      ResizableImage.configure({
        inline: true,
        allowBase64: true,
      }),
      LinkExtension.configure({
        openOnClick: true,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:opacity-80 transition-opacity',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      PlaceholderExtension.configure({
        placeholder,
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none h-full p-4',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              if (src && view.state.selection) {
                const node = view.state.schema.nodes.image.create({ src });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
              const file = items[i].getAsFile();
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const src = e.target?.result as string;
                  if (src && view.state.selection) {
                    const node = view.state.schema.nodes.image.create({ src });
                    const transaction = view.state.tr.replaceSelectionWith(node);
                    view.dispatch(transaction);
                  }
                };
                reader.readAsDataURL(file);
                return true;
              }
            }
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onChangeRef.current(editor.getHTML());
    },
  }, []);

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Handle text selection and image selection for bubble menu
  useEffect(() => {
    if (!editor) return;

    const updateBubbleMenu = () => {
      // Don't update if we're actively resizing
      if (isResizing) return;
      
      const { from, to, node } = editor.state.selection as any;
      
      // Check if an image is selected
      const isImage = node && node.type.name === 'image';
      setIsImageSelected(isImage);
      
      if (isImage) {
        // Store the image node for later reference
        imageNodeRef.current = { node, pos: from };
        
        // Image is selected - show image controls
        const { view } = editor;
        const coords = view.coordsAtPos(from);
        
        // Get current image size
        const attrs = node.attrs;
        if (attrs.width) {
          setSelectedImageSize(parseInt(attrs.width));
        } else {
          // If no width set, default to 100% (use a pixel value)
          setSelectedImageSize(600);
        }
        
        // Position below the image
        setBubbleMenuPosition({ 
          top: coords.bottom + 10, 
          left: coords.left + (coords.right - coords.left) / 2 
        });
        setBubbleMenuVisible(true);
      } else {
        // Only clear image ref if we're not resizing
        if (!isResizing) {
          imageNodeRef.current = null;
        }
        
        // Text selection
        const hasSelection = from !== to;
        
        if (hasSelection && !editor.state.selection.empty) {
          const { view } = editor;
          const start = view.coordsAtPos(from);
          const end = view.coordsAtPos(to);
          
          // Calculate position using viewport coordinates (fixed positioning)
          const centerX = (start.left + end.left) / 2;
          const top = start.top - 50; // 50px above selection
          const left = centerX;
          
          setBubbleMenuPosition({ top, left });
          setBubbleMenuVisible(true);
        } else {
          // Don't hide if we're resizing
          if (!isResizing) {
            setBubbleMenuVisible(false);
          }
        }
      }
    };

    editor.on('selectionUpdate', updateBubbleMenu);
    editor.on('update', updateBubbleMenu);

    // Hide bubble menu and clear selection when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      // Don't close if we're resizing or clicking in the bubble menu
      if (isResizing) return;
      
      const target = e.target as Node;
      const clickedInBubbleMenu = bubbleMenuRef.current && bubbleMenuRef.current.contains(target);
      const clickedInEditor = editorRef.current && editorRef.current.contains(target);
      
      // If clicked outside both the editor and bubble menu, clear selection and hide menu
      if (!clickedInBubbleMenu && !clickedInEditor) {
        // Clear the selection
        const { from } = editor.state.selection;
        editor.commands.setTextSelection(from);
        
        // Hide the bubble menu
        setBubbleMenuVisible(false);
        setIsImageSelected(false);
        imageNodeRef.current = null;
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      editor.off('selectionUpdate', updateBubbleMenu);
      editor.off('update', updateBubbleMenu);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editor, isResizing]);

  // Keyboard shortcut for Cmd/Ctrl+K to add links
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to add link
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openLinkDialog();
      }
    };

    const editorElement = editorRef.current?.querySelector('.ProseMirror');
    if (editorElement) {
      editorElement.addEventListener('keydown', handleKeyDown);
      return () => editorElement.removeEventListener('keydown', handleKeyDown);
    }
  }, [editor]);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, '');
    
    setLinkUrl(previousUrl || '');
    setLinkText(selectedText || '');
    setLinkDialogOpen(true);
  }, [editor]);

  const handleLinkSubmit = useCallback(() => {
    if (!editor) return;

    if (!linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkDialogOpen(false);
      setLinkUrl('');
      setLinkText('');
      return;
    }

    // If there's text selected or link text provided, update the selection
    if (linkText) {
      editor.chain()
        .focus()
        .insertContent({
          type: 'text',
          text: linkText,
          marks: [{ type: 'link', attrs: { href: linkUrl } }],
        })
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: linkUrl }).run();
    }

    setLinkUrl('');
    setLinkText('');
    setLinkDialogOpen(false);
  }, [editor, linkUrl, linkText]);

  const handleImageSizeChange = useCallback((value: number[]) => {
    if (!editor) return;
    
    const newWidth = value[0];
    setSelectedImageSize(newWidth);
    
    // Use stored image node if selection is lost
    const imageData = imageNodeRef.current;
    if (!imageData) return;
    
    const { node, pos } = imageData;
    if (node && node.type.name === 'image') {
      // Calculate height based on aspect ratio
      // If we have an existing aspect ratio, maintain it
      const currentWidth = node.attrs.width;
      const currentHeight = node.attrs.height;
      
      let newHeight: number | null = null;
      
      if (currentWidth && currentHeight) {
        // Maintain existing aspect ratio
        const aspectRatio = currentHeight / currentWidth;
        newHeight = Math.round(newWidth * aspectRatio);
      }
      
      // Update the image attributes and maintain selection
      editor.chain()
        .updateAttributes('image', {
          width: newWidth,
          height: newHeight,
        })
        .setNodeSelection(pos)
        .run();
    }
  }, [editor]);
  
  const handleResizeStart = useCallback(() => {
    setIsResizing(true);
  }, []);
  
  const handleResizeEnd = useCallback(() => {
    setIsResizing(false);
    // Re-select the image after resizing
    if (editor && imageNodeRef.current) {
      const { pos } = imageNodeRef.current;
      editor.commands.setNodeSelection(pos);
    }
  }, [editor]);
  
  // Add global mouseup listener to catch mouse release outside bubble menu
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isResizing) {
        handleResizeEnd();
      }
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isResizing, handleResizeEnd]);

  if (!editor) {
    return null;
  }

  return (
    <>
      {/* Floating Bubble Menu - appears when text or image is selected */}
      {bubbleMenuVisible && editor && (
        <div
          ref={bubbleMenuRef}
          className="fixed z-50 bg-popover border border-border rounded-lg shadow-lg p-1"
          style={{
            top: `${bubbleMenuPosition.top}px`,
            left: `${bubbleMenuPosition.left}px`,
            transform: 'translateX(-50%)',
          }}
        >
          {isImageSelected ? (
            // Image resize controls
            <div 
              className="flex items-center gap-3 px-3 py-2 min-w-[280px]"
              onPointerDown={(e) => {
                // Prevent editor from losing focus when clicking in the bubble menu
                e.preventDefault();
                e.stopPropagation();
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={(e) => {
                // Prevent clicks from bubbling to editor
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <ImageIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <Slider
                  value={[selectedImageSize]}
                  onValueChange={handleImageSizeChange}
                  onPointerDown={(e) => {
                    // Don't preventDefault - let the slider work
                    e.stopPropagation();
                    handleResizeStart();
                  }}
                  onPointerUp={(e) => {
                    e.stopPropagation();
                    handleResizeEnd();
                  }}
                  min={100}
                  max={800}
                  step={10}
                  className="w-full"
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium min-w-[50px] text-right">
                {selectedImageSize}px
              </span>
            </div>
          ) : (
            // Text formatting controls
            <div className="flex gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`h-7 px-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`}
                title="Heading"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </Button>
              
              <div className="w-px h-5 bg-border self-center" />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`h-7 px-2 ${editor.isActive('bold') ? 'bg-accent' : ''}`}
                title="Bold"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`h-7 px-2 ${editor.isActive('italic') ? 'bg-accent' : ''}`}
                title="Italic"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`h-7 px-2 ${editor.isActive('strike') ? 'bg-accent' : ''}`}
                title="Strikethrough"
              >
                <Strikethrough className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleCode().run()}
                className={`h-7 px-2 ${editor.isActive('code') ? 'bg-accent' : ''}`}
                title="Code"
              >
                <Code className="h-3.5 w-3.5" />
              </Button>
              
              <div className="w-px h-5 bg-border self-center" />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`h-7 px-2 ${editor.isActive('bulletList') ? 'bg-accent' : ''}`}
                title="Bullet List"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`h-7 px-2 ${editor.isActive('orderedList') ? 'bg-accent' : ''}`}
                title="Numbered List"
              >
                <ListOrdered className="h-3.5 w-3.5" />
              </Button>
              
              <div className="w-px h-5 bg-border self-center" />
              
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={openLinkDialog}
                className={`h-7 px-2 ${editor.isActive('link') ? 'bg-accent' : ''}`}
                title="Add Link"
              >
                <Link2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div 
        ref={editorRef}
        className="relative border border-border rounded-lg bg-card focus-within:border-ring/30 focus-within:ring-1 focus-within:ring-ring/20 transition-all"
        style={{ minHeight }}
      >
        {/* Editor Content */}
        <div className="p-4">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Link</DialogTitle>
            <DialogDescription>
              Add a hyperlink to your text
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="link-text">Link Text (optional)</Label>
              <Input
                id="link-text"
                type="text"
                placeholder="Click here"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                type="url"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLinkSubmit();
                  }
                }}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setLinkUrl('');
                  setLinkText('');
                  setLinkDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleLinkSubmit}
                disabled={!linkUrl.trim()}
              >
                {linkText ? 'Insert Link' : 'Update Link'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
