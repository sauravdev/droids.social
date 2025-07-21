import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link,
  Undo,
  Redo,
  Type,
  Palette,
  Highlighter,
  Smile
} from 'lucide-react';

interface RichTextEditorProps {
  initialContent?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  setGeneratedContent?: (content : string) => void 
  keywordGenerated? : Boolean 
}

const Editor: React.FC<RichTextEditorProps> = ({
  initialContent = '',
  onChange = () => {} ,
  placeholder = 'Start writing...' , 
  setGeneratedContent  = (data : string)=> {} ,
  keywordGenerated = false 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentFontSize, setCurrentFontSize] = useState('16px');
  const [isInitialized, setIsInitialized] = useState(false);

  const colors = [
    '#000000', '#333333', '#666666', '#999999', '#cccccc',
    '#ffffff', '#ff0000', '#ff6600', '#ffcc00', '#00ff00',
    '#0066ff', '#6600ff', '#ff0066', '#00ffff', '#ff00ff'
  ];

  const fontSizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];

  const emojis = [
    // Faces & People
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
    
    // Hand gestures
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
    '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵',
    
    // Objects & Symbols
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
    '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐',
    '⭐', '🌟', '✨', '💫', '⚡', '☄️', '💥', '🔥', '🌈', '☀️',
    '🌤️', '⛅', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '☁️', '💨', '❄️',
    '☃️', '⛄', '🌬️', '💧', '💦', '☔', '☂️', '🌊', '🌫️', '🍀',
    
    // Food & Drinks
    '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍈', '🍒', '🍑',
    '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥕', '🌽',
    '🌶️', '🥒', '🥬', '🥴', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖',
    '🧀', '🥚', '🍳', '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖',
    '🌭', '🍔', '🍟', '🍕', '🥪', '🥙', '🌮', '🌯', '🫔', '🥗',
    
    // Activities & Sports
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱',
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳',
    '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️',
    
    // Travel & Places
    '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐',
    '🛻', '🚚', '🚛', '🚜', '🏍️', '🛵', '🚲', '🛴', '🛺', '🚨',
    '✈️', '🛫', '🛬', '🪂', '💺', '🚁', '🚟', '🚠', '🚡', '🛰️',
    '🚀', '🛸', '🚢', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚂', '🚃'
  ];

  // Track the last content that was set to avoid unnecessary updates
  const lastSetContentRef = useRef<string>('');

  // Initialize content and handle updates from external sources (like regenerate button)
  useEffect(() => {
    if (editorRef.current && initialContent !== undefined) {
      
      if (initialContent !== lastSetContentRef.current) {
      
        const savedRange = document.activeElement === editorRef.current ? saveCursorPosition() : null;
        
        editorRef.current.innerHTML = initialContent;
        lastSetContentRef.current = initialContent;
        
        if (savedRange && initialContent.length > 0) {
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.focus();
              try {
                restoreCursorPosition(savedRange);
              } catch (e) {
                // If cursor restoration fails, just focus the editor
                console.log('Could not restore cursor position');
              }
            }
          }, 0);
        }
        
        if (!isInitialized) {
          setIsInitialized(true);
        }
      }
    }
  }, [initialContent]);

  // Save and restore cursor position
  const saveCursorPosition = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      return selection.getRangeAt(0);
    }
    return null;
  };

  const restoreCursorPosition = (range: Range) => {
    const selection = window.getSelection();
    if (selection && range) {
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const execCommand = (command: string, value?: string) => {
    const savedRange = saveCursorPosition();
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      if (savedRange) {
        setTimeout(() => restoreCursorPosition(savedRange), 0);
      }
      onChange?.(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      const currentContent = editorRef.current.innerHTML;
      console.log("editor data = ", currentContent); 
      
      // Update our tracking ref to prevent unnecessary re-renders
      lastSetContentRef.current = currentContent;
      
      if(!keywordGenerated) {
        setGeneratedContent(currentContent); 
      }
      onChange?.(currentContent);
    }
  };

  const insertLink = () => {
    let url = prompt('Enter URL:');
    console.log("url = ", url);
    
    if (url) {
      if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('mailto:')) {
        url = 'https://' + url;
      }
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        const link = document.createElement('a');
        link.href = url;
        link.textContent = selectedText || url;

        range.deleteContents();
        range.insertNode(link);
        
        
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(link);
        newRange.setEndAfter(link);
        selection.addRange(newRange);
        
        if (editorRef.current) {
          editorRef.current.focus();
          onChange?.(editorRef.current.innerHTML);
        }
      } else if (editorRef.current) {
       
        const link = document.createElement('a');
        link.href = url;
        link.textContent = url;
        
        editorRef.current.appendChild(link);
        editorRef.current.focus();
        onChange?.(editorRef.current.innerHTML);
      }
    }
  };

  const insertEmoji = (emoji: string) => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const range = selection.getRangeAt(0);
      const emojiNode = document.createTextNode(emoji);
      
      range.deleteContents();
      range.insertNode(emojiNode);
      range.setStartAfter(emojiNode);
      range.setEndAfter(emojiNode);
      
      selection.removeAllRanges();
      selection.addRange(range);
      
      editorRef.current.focus();
      onChange?.(editorRef.current.innerHTML);
    } else if (editorRef.current) {
      // If no selection, append at the end
      editorRef.current.innerHTML += emoji;
      editorRef.current.focus();
      onChange?.(editorRef.current.innerHTML);
    }
    
    setShowEmojiPicker(false);
  };

  const setFontSize = (size: string) => {
    // Remove any existing font-size spans in selection
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.fontSize = size;
      
      try {
        range.surroundContents(span);
        setCurrentFontSize(size);
        setShowFontSize(false);
        onChange?.(editorRef.current?.innerHTML || '');
      } catch (e) {
        // Fallback for complex selections
        execCommand('fontSize', '7');
        // Then apply custom size
        const fontElements = editorRef.current?.querySelectorAll('font[size="7"]');
        fontElements?.forEach(el => {
          const span = document.createElement('span');
          span.style.fontSize = size;
          span.innerHTML = el.innerHTML;
          el.parentNode?.replaceChild(span, el);
        });
      }
    }
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
    isActive?: boolean;
  }> = ({ onClick, icon, title, isActive }) => (
    <button
      onClick={onClick}
      title={title}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:text-gray-800'
      }`}
    >
      {icon}
    </button>
  );

  const ColorPicker: React.FC<{
    show: boolean;
    onClose: () => void;
    onColorSelect: (color: string) => void;
    title: string;
  }> = ({ show, onClose, onColorSelect, title }) => {
    if (!show) return null;

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-3 z-50">
        <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
        <div className="grid grid-cols-5 gap-1">
          {colors.map((color) => (
            <button
              key={color}
              onClick={() => {
                onColorSelect(color);
                onClose();
              }}
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    );
  };

  const FontSizeDropdown: React.FC<{
    show: boolean;
    onClose: () => void;
    onSizeSelect: (size: string) => void;
  }> = ({ show, onClose, onSizeSelect }) => {
    if (!show) return null;

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[80px]">
        {fontSizes.map((size) => (
          <button
            key={size}
            onClick={() => {
              onSizeSelect(size);
              onClose();
            }}
            className="block w-full px-3 py-1 text-left hover:bg-gray-100 text-sm"
          >
            {size}
          </button>
        ))}
      </div>
    );
  };

  const EmojiPicker: React.FC<{
    show: boolean;
    onClose: () => void;
    onEmojiSelect: (emoji: string) => void;
  }> = ({ show, onClose, onEmojiSelect }) => {
    if (!show) return null;

    return (
      <div className="absolute top-full left-0 mt-1 bg-white border rounded-lg shadow-lg p-3 z-50 w-80 max-h-64 overflow-y-auto">
        <div className="text-sm font-medium text-gray-700 mb-2">Select Emoji</div>
        <div className="grid grid-cols-8 gap-1">
          {emojis.map((emoji, index) => (
            <button
              key={index}
              onClick={() => onEmojiSelect(emoji)}
              className="w-8 h-8 rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-lg hover:scale-110"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setShowColorPicker(false);
        setShowHighlightPicker(false);
        setShowFontSize(false);
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-3">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting Group */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => execCommand('bold')}
              icon={<Bold size={16} />}
              title="Bold (Ctrl+B)"
            />
            <ToolbarButton
              onClick={() => execCommand('italic')}
              icon={<Italic size={16} />}
              title="Italic (Ctrl+I)"
            />
            <ToolbarButton
              onClick={() => execCommand('underline')}
              icon={<Underline size={16} />}
              title="Underline (Ctrl+U)"
            />
            <ToolbarButton
              onClick={() => execCommand('strikeThrough')}
              icon={<Strikethrough size={16} />}
              title="Strikethrough"
            />
          </div>

          {/* Text Style Group */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <select
              onChange={(e) => execCommand('formatBlock', e.target.value)}
              className="px-2 py-1 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue="div"
            >
              <option value="div">Normal</option>
              <option value="h1">Heading 1</option>
              <option value="h2">Heading 2</option>
              <option value="h3">Heading 3</option>
            </select>

            <div className="relative ml-1">
              <button
                onClick={() => setShowFontSize(!showFontSize)}
                className="flex items-center px-2 py-1 border rounded text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Type size={14} className="mr-1" />
                {currentFontSize}
              </button>
              <FontSizeDropdown
                show={showFontSize}
                onClose={() => setShowFontSize(false)}
                onSizeSelect={setFontSize}
              />
            </div>
          </div>

          {/* Color Group */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                title="Text Color"
              >
                <Palette size={16} />
              </button>
              <ColorPicker
                show={showColorPicker}
                onClose={() => setShowColorPicker(false)}
                onColorSelect={(color) => execCommand('foreColor', color)}
                title="Text Color"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowHighlightPicker(!showHighlightPicker)}
                className="p-2 rounded hover:bg-gray-100 transition-colors text-gray-600 hover:text-gray-800"
                title="Highlight Color"
              >
                <Highlighter size={16} />
              </button>
              <ColorPicker
                show={showHighlightPicker}
                onClose={() => setShowHighlightPicker(false)}
                onColorSelect={(color) => execCommand('backColor', color)}
                title="Highlight Color"
              />
            </div>
          </div>

          {/* Alignment Group */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => execCommand('justifyLeft')}
              icon={<AlignLeft size={16} />}
              title="Align Left"
            />
            <ToolbarButton
              onClick={() => execCommand('justifyCenter')}
              icon={<AlignCenter size={16} />}
              title="Align Center"
            />
            <ToolbarButton
              onClick={() => execCommand('justifyRight')}
              icon={<AlignRight size={16} />}
              title="Align Right"
            />
            <ToolbarButton
              onClick={() => execCommand('justifyFull')}
              icon={<AlignJustify size={16} />}
              title="Justify"
            />
          </div>

          {/* Lists Group */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={() => execCommand('insertUnorderedList')}
              icon={<List size={16} />}
              title="Bullet List"
            />
            <ToolbarButton
              onClick={() => execCommand('insertOrderedList')}
              icon={<ListOrdered size={16} />}
              title="Numbered List"
            />
          </div>

          {/* Insert Group */}
          <div className="flex items-center border-r border-gray-300 pr-2 mr-2">
            <ToolbarButton
              onClick={insertLink}
              icon={<Link size={16} />}
              title="Insert Link"
            />
            
            <div className="relative">
              <ToolbarButton
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                icon={<Smile size={16} />}
                title="Insert Emoji"
              />
              <EmojiPicker
                show={showEmojiPicker}
                onClose={() => setShowEmojiPicker(false)}
                onEmojiSelect={insertEmoji}
              />
            </div>
          </div>

          {/* Undo/Redo Group */}
          <div className="flex items-center">
            <ToolbarButton
              onClick={() => execCommand('undo')}
              icon={<Undo size={16} />}
              title="Undo (Ctrl+Z)"
            />
            <ToolbarButton
              onClick={() => execCommand('redo')}
              icon={<Redo size={16} />}
              title="Redo (Ctrl+Y)"
            />
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="p-6 bg-gray-700 text-white">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="h-[300px] overflow-y-auto focus:outline-none text-gray-200 leading-relaxed no-scrollbar"
          style={{ fontSize: '16px', lineHeight: '1.6' }}
          suppressContentEditableWarning={true}
          data-placeholder={placeholder}
        />
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        [contenteditable] h1 {
          font-size: 2rem;
          font-weight: bold;
          margin: 1rem 0;
          color: #e5e7eb;
        }
        
        [contenteditable] h2 {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0.75rem 0;
          color: #e5e7eb;
        }
        
        [contenteditable] h3 {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 0.5rem 0;
          color: #e5e7eb;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          margin: 0.5rem 0;
          padding-left: 2rem;
        }
        
        [contenteditable] ul li {
          list-style-type: disc;
          margin: 0.25rem 0;
        }
        
        [contenteditable] ol li {
          list-style-type: decimal;
          margin: 0.25rem 0;
        }
        
        [contenteditable] a {
          color: #60a5fa;
          text-decoration: underline;
        }
        
        [contenteditable] a:hover {
          color: #3b82f6;
        }
      `}</style>
    </div>
  );
};

export default Editor;