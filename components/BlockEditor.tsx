'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Plus,
  GripVertical,
  Trash2,
  Type,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Image,
  Link2,
  Code,
  Quote,
  Table,
  MoreHorizontal,
} from 'lucide-react';

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'bulletList'
  | 'numberedList'
  | 'checklist'
  | 'image'
  | 'link'
  | 'code'
  | 'quote'
  | 'divider';

export type Block = {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean;
  url?: string;
};

type BlockEditorProps = {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  placeholder?: string;
};

const BLOCK_TYPES = [
  { type: 'paragraph', icon: Type, label: '段落' },
  { type: 'heading1', icon: Heading1, label: '标题 1' },
  { type: 'heading2', icon: Heading2, label: '标题 2' },
  { type: 'bulletList', icon: List, label: '无序列表' },
  { type: 'numberedList', icon: ListOrdered, label: '有序列表' },
  { type: 'checklist', icon: CheckSquare, label: '待办事项' },
  { type: 'quote', icon: Quote, label: '引用' },
  { type: 'code', icon: Code, label: '代码块' },
  { type: 'image', icon: Image, label: '图片' },
  { type: 'link', icon: Link2, label: '链接' },
] as const;

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export function BlockEditor({ blocks, onChange, placeholder }: BlockEditorProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowBlockMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addBlock = (type: BlockType, afterId?: string) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
      checked: type === 'checklist' ? false : undefined,
    };

    if (afterId) {
      const index = blocks.findIndex((b) => b.id === afterId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      onChange(newBlocks);
    } else {
      onChange([...blocks, newBlock]);
    }

    setShowBlockMenu(null);
    setTimeout(() => setActiveBlockId(newBlock.id), 50);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    onChange(
      blocks.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return;
    onChange(blocks.filter((b) => b.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent, block: Block) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock('paragraph', block.id);
    }

    if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
      e.preventDefault();
      const index = blocks.findIndex((b) => b.id === block.id);
      deleteBlock(block.id);
      if (index > 0) {
        setActiveBlockId(blocks[index - 1].id);
      }
    }
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    onChange(newBlocks);
  };

  const renderBlockContent = (block: Block, index: number) => {
    const baseInputClass =
      'w-full bg-transparent border-none outline-none text-white font-space-mono resize-none overflow-hidden';

    switch (block.type) {
      case 'heading1':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            onKeyDown={(e) => handleKeyDown(e, block)}
            onFocus={() => setActiveBlockId(block.id)}
            placeholder="标题 1"
            className={`${baseInputClass} font-sora text-2xl font-bold placeholder:text-gray-600`}
          />
        );

      case 'heading2':
        return (
          <input
            type="text"
            value={block.content}
            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
            onKeyDown={(e) => handleKeyDown(e, block)}
            onFocus={() => setActiveBlockId(block.id)}
            placeholder="标题 2"
            className={`${baseInputClass} font-sora text-xl font-semibold placeholder:text-gray-600`}
          />
        );

      case 'bulletList':
        return (
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 mt-1">•</span>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, block)}
              onFocus={() => setActiveBlockId(block.id)}
              placeholder="列表项"
              className={`${baseInputClass} text-sm placeholder:text-gray-600`}
            />
          </div>
        );

      case 'numberedList':
        return (
          <div className="flex items-start gap-3">
            <span className="text-indigo-400 mt-0.5 font-space-mono text-sm min-w-[20px]">
              {index + 1}.
            </span>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, block)}
              onFocus={() => setActiveBlockId(block.id)}
              placeholder="列表项"
              className={`${baseInputClass} text-sm placeholder:text-gray-600`}
            />
          </div>
        );

      case 'checklist':
        return (
          <div className="flex items-start gap-3">
            <button
              onClick={() => updateBlock(block.id, { checked: !block.checked })}
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 ${
                block.checked
                  ? 'bg-indigo-500 border-indigo-500'
                  : 'border-gray-500 hover:border-indigo-400'
              }`}
            >
              {block.checked && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, block)}
              onFocus={() => setActiveBlockId(block.id)}
              placeholder="待办事项"
              className={`${baseInputClass} text-sm placeholder:text-gray-600 ${
                block.checked ? 'line-through text-gray-500' : ''
              }`}
            />
          </div>
        );

      case 'quote':
        return (
          <div className="border-l-4 border-indigo-500/50 pl-4">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              onKeyDown={(e) => handleKeyDown(e, block)}
              onFocus={() => setActiveBlockId(block.id)}
              placeholder="引用内容..."
              rows={2}
              className={`${baseInputClass} text-sm text-gray-300 italic placeholder:text-gray-600`}
            />
          </div>
        );

      case 'code':
        return (
          <div className="rounded-lg bg-gray-900/50 p-4 border border-white/5">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              onFocus={() => setActiveBlockId(block.id)}
              placeholder="// 代码..."
              rows={4}
              className={`${baseInputClass} text-sm font-mono text-green-400 placeholder:text-gray-600`}
            />
          </div>
        );

      case 'image':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={block.url || ''}
              onChange={(e) => updateBlock(block.id, { url: e.target.value })}
              onFocus={() => setActiveBlockId(block.id)}
              placeholder="输入图片 URL..."
              className={`${baseInputClass} text-sm placeholder:text-gray-600 px-3 py-2 bg-white/5 rounded-lg border border-white/10`}
            />
            {block.url && (
              <img
                src={block.url}
                alt=""
                className="max-w-full rounded-lg border border-white/10"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <input
              type="text"
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              placeholder="图片说明（可选）"
              className={`${baseInputClass} text-xs text-gray-400 placeholder:text-gray-600`}
            />
          </div>
        );

      case 'link':
        return (
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-lg border border-white/10">
            <Link2 size={18} className="text-indigo-400 flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <input
                type="text"
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                onFocus={() => setActiveBlockId(block.id)}
                placeholder="链接标题"
                className={`${baseInputClass} text-sm placeholder:text-gray-600`}
              />
              <input
                type="text"
                value={block.url || ''}
                onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                placeholder="https://..."
                className={`${baseInputClass} text-xs text-indigo-400 placeholder:text-gray-600`}
              />
            </div>
          </div>
        );

      case 'divider':
        return <div className="w-full h-px bg-white/10 my-4" />;

      default:
        return (
          <textarea
            value={block.content}
            onChange={(e) => {
              updateBlock(block.id, { content: e.target.value });
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            onKeyDown={(e) => handleKeyDown(e, block)}
            onFocus={() => setActiveBlockId(block.id)}
            placeholder={placeholder || '输入文字，按 Enter 添加新块...'}
            rows={1}
            className={`${baseInputClass} text-sm placeholder:text-gray-600 leading-relaxed`}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={`group relative flex items-start gap-2 py-1.5 px-2 -mx-2 rounded-lg transition-colors ${
            activeBlockId === block.id ? 'bg-white/[0.03]' : 'hover:bg-white/[0.02]'
          } ${draggedBlockId === block.id ? 'opacity-50' : ''}`}
          draggable
          onDragStart={() => setDraggedBlockId(block.id)}
          onDragEnd={() => setDraggedBlockId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (draggedBlockId && draggedBlockId !== block.id) {
              const fromIndex = blocks.findIndex((b) => b.id === draggedBlockId);
              const toIndex = blocks.findIndex((b) => b.id === block.id);
              moveBlock(fromIndex, toIndex);
            }
          }}
        >
          {/* 左侧操作按钮 */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pt-1">
            {/* 添加块按钮 */}
            <div className="relative" ref={showBlockMenu === block.id ? menuRef : null}>
              <button
                onClick={() =>
                  setShowBlockMenu(showBlockMenu === block.id ? null : block.id)
                }
                className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
              >
                <Plus size={16} />
              </button>

              {/* 块类型菜单 */}
              {showBlockMenu === block.id && (
                <div className="absolute left-0 top-full mt-1 w-48 rounded-xl bg-gray-900 border border-white/10 shadow-xl overflow-hidden z-50">
                  <div className="p-2 border-b border-white/5">
                    <span className="text-xs font-space-mono text-gray-500 uppercase">
                      添加块
                    </span>
                  </div>
                  <div className="p-1 max-h-64 overflow-y-auto">
                    {BLOCK_TYPES.map((bt) => (
                      <button
                        key={bt.type}
                        onClick={() => addBlock(bt.type as BlockType, block.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm font-space-mono text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                      >
                        <bt.icon size={16} />
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 拖拽手柄 */}
            <button className="p-1 rounded hover:bg-white/10 text-gray-500 hover:text-white transition-colors cursor-grab active:cursor-grabbing">
              <GripVertical size={16} />
            </button>
          </div>

          {/* 块内容 */}
          <div className="flex-1 min-w-0">{renderBlockContent(block, index)}</div>

          {/* 右侧删除按钮 */}
          <button
            onClick={() => deleteBlock(block.id)}
            className="p-1 rounded hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 pt-1"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}

      {/* 添加新块按钮 */}
      <button
        onClick={() => addBlock('paragraph')}
        className="w-full py-3 rounded-lg border border-dashed border-white/10 hover:border-white/20 text-gray-500 hover:text-gray-400 transition-all flex items-center justify-center gap-2 font-space-mono text-sm mt-4"
      >
        <Plus size={16} />
        添加内容块
      </button>
    </div>
  );
}
