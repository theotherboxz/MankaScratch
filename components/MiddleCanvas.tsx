'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useWorkspace, CanvasItem, Stroke, StrokePoint } from '@/lib/workspace-context';
import { PlusSquare, Type, Trash2, ChevronLeft, ChevronRight, GripHorizontal, Download, LayoutTemplate, PenTool, Eraser, Undo2, Redo2, MousePointer2, Layers, MoveUp, MoveDown, Highlighter, Minus } from 'lucide-react';
import { motion, useDragControls } from 'motion/react';
import { toJpeg, toPng } from 'html-to-image';
import jsPDF from 'jspdf';

export function MiddleCanvas() {
  const { canvasItems, addCanvasItem, updateCanvasItem, deleteCanvasItem } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [dimensions, setDimensions] = useState({ width: 800, height: 1131 });
  const [currentPage, setCurrentPage] = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showSizeMenu, setShowSizeMenu] = useState(false);
  
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [drawMode, setDrawMode] = useState<boolean>(false);
  const [drawTool, setDrawTool] = useState<'pen' | 'eraser' | 'marker' | 'dashed'>('pen');
  const [penColor, setPenColor] = useState<string>('#000000');
  const [penSize, setPenSize] = useState<number>(3);

  // Trigger when click outside nodes
  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || e.target === containerRef.current?.parentElement) {
      setSelectedItemId(null);
      setDrawMode(false);
    }
  };

  const selectedItem = canvasItems.find(i => i.id === selectedItemId);
  const isPanelSelected = selectedItem?.type === 'panel';

  const triggerUndo = () => {
    window.dispatchEvent(new CustomEvent(`undo-${selectedItemId}`));
  };

  const triggerRedo = () => {
    window.dispatchEvent(new CustomEvent(`redo-${selectedItemId}`));
  };

  const currentPageItems = canvasItems.filter(item => (item.pageIndex || 1) === currentPage);

  // Keyboard Shortcuts (Undo, Redo, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) {
        return;
      }

      if (e.key === 'Backspace' || e.key === 'Delete') {
        if (selectedItemId) {
          deleteCanvasItem(selectedItemId);
          setSelectedItemId(null);
        }
      }

      if (e.ctrlKey || e.metaKey) {
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault();
          if (selectedItemId) {
            window.dispatchEvent(new CustomEvent(`undo-${selectedItemId}`));
          }
        }
        if (e.key === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
          e.preventDefault();
          if (selectedItemId) {
            window.dispatchEvent(new CustomEvent(`redo-${selectedItemId}`));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, deleteCanvasItem]);

  const handleAddPanel = () => {
    const id = Math.random().toString(36).substring(2, 9);
    addCanvasItem({
      type: 'panel',
      x: 50 + Math.random() * 50,
      y: 50 + Math.random() * 50,
      width: 300,
      height: 250,
      content: '', // removed 'Empty Panel' default so we can draw easily without text overlapping
      pageIndex: currentPage,
      strokes: [],
    });
  };

  const handleAddText = () => {
    addCanvasItem({
      type: 'text',
      x: 100 + Math.random() * 50,
      y: 100 + Math.random() * 50,
      width: 150,
      height: 50,
      content: 'Speech / SFX',
      pageIndex: currentPage,
    });
  };

  const handleExport = async (format: 'pdf' | 'png' | 'jpeg') => {
    if (!containerRef.current) return;

    try {
      const exportOptions = {
        quality: 0.95,
        backgroundColor: '#ffffff',
        pixelRatio: 2,
        filter: (node: HTMLElement | Node) => {
          if (node instanceof HTMLElement) {
            return !node.classList.contains('do-not-print');
          }
          return true;
        }
      };

      if (format === 'pdf') {
        const dataUrl = await toJpeg(containerRef.current, exportOptions);
        const pdf = new jsPDF({
          orientation: dimensions.width > dimensions.height ? 'landscape' : 'portrait',
          unit: 'px',
          format: [dimensions.width, dimensions.height]
        });
        pdf.addImage(dataUrl, 'JPEG', 0, 0, dimensions.width, dimensions.height);
        pdf.save(`chapter_page_${currentPage}.pdf`);
      } else if (format === 'png') {
        const dataUrl = await toPng(containerRef.current, exportOptions);
        const link = document.createElement('a');
        link.download = `chapter_page_${currentPage}.png`;
        link.href = dataUrl;
        link.click();
      } else if (format === 'jpeg') {
        const dataUrl = await toJpeg(containerRef.current, exportOptions);
        const link = document.createElement('a');
        link.download = `chapter_page_${currentPage}.jpeg`;
        link.href = dataUrl;
        link.click();
      }
    } catch (error) {
      console.error("Failed to export", error);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-200 dark:bg-slate-950 overflow-hidden relative">
      {/* Top Toolbar */}
      <header className="min-h-14 py-2 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between px-2 sm:px-4 lg:px-6 z-20 shrink-0 gap-y-2 gap-x-1">
        <div className="flex items-center gap-2 mr-4 shrink-0">
          <div className="text-sm font-bold text-slate-800 dark:text-slate-200 hidden sm:block">Draft Editor</div>
          <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full uppercase font-bold">Editing</span>
        </div>
        
        {/* Pagination controls */}
        <div className="flex items-center gap-1 sm:gap-2 mr-auto shrink-0">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-transparent dark:disabled:hover:bg-transparent rounded transition-colors text-slate-600 dark:text-slate-400"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-14 text-center">Page {currentPage}</span>
          <button 
            onClick={() => setCurrentPage(p => p + 1)}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors text-slate-600 dark:text-slate-400"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 sm:gap-2 shrink-0">
          {/* Layer Controls for Selected Item */}
          {selectedItem && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded p-1 border border-slate-200 dark:border-slate-700 mr-2 text-slate-600 dark:text-slate-400">
              <Layers size={14} className="mx-1" />
              <button 
                onClick={() => updateCanvasItem(selectedItem.id, { zIndex: (selectedItem.zIndex || 10) + 1 })}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-xs"
                title="Bring Forward"
              >
                <MoveUp size={14} />
              </button>
              <button 
                onClick={() => updateCanvasItem(selectedItem.id, { zIndex: (selectedItem.zIndex || 10) - 1 })}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-xs"
                title="Send Backward"
              >
                <MoveDown size={14} />
              </button>
            </div>
          )}

          {/* Conditional Draw Controls */}
          {isPanelSelected && (
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded p-1 border border-slate-200 dark:border-slate-700 mr-2">
              <button 
                onClick={() => setDrawMode(!drawMode)}
                className={`p-1.5 rounded transition-colors text-xs font-medium flex items-center gap-1 ${drawMode ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                title="Draw Mode"
              >
                {drawMode ? <PenTool size={14} /> : <MousePointer2 size={14} />} 
                <span className="hidden md:inline">{drawMode ? 'Drawing' : 'Select'}</span>
              </button>
              
              {drawMode && (
                <>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                  <button 
                    onClick={() => setDrawTool('pen')}
                    className={`p-1.5 rounded transition-colors ${drawTool === 'pen' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Pencil"
                  >
                    <PenTool size={14} />
                  </button>
                  <button 
                    onClick={() => setDrawTool('marker')}
                    className={`p-1.5 rounded transition-colors ${drawTool === 'marker' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Marker"
                  >
                    <Highlighter size={14} />
                  </button>
                  <button 
                    onClick={() => setDrawTool('dashed')}
                    className={`p-1.5 rounded transition-colors ${drawTool === 'dashed' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Dashed Line"
                  >
                    <Minus size={14} />
                  </button>
                  {(drawTool === 'pen' || drawTool === 'marker' || drawTool === 'dashed') && (
                    <div className="flex items-center gap-1 mx-1">
                      <input 
                        type="color" 
                        value={penColor} 
                        onChange={(e) => setPenColor(e.target.value)}
                        className="w-5 h-5 rounded cursor-pointer border-0 p-0 overflow-hidden"
                        title="Tool Color"
                      />
                      <input 
                        type="range" 
                        min="1" 
                        max="20" 
                        value={penSize} 
                        onChange={(e) => setPenSize(parseInt(e.target.value))}
                        className="w-16 h-1 bg-slate-300 dark:bg-slate-600 rounded appearance-none cursor-pointer"
                        title="Tool Size"
                      />
                    </div>
                  )}
                  <button 
                    onClick={() => setDrawTool('eraser')}
                    className={`p-1.5 rounded transition-colors ${drawTool === 'eraser' ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                    title="Eraser"
                  >
                    <Eraser size={14} />
                  </button>
                  <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1" />
                  <button onClick={triggerUndo} className="p-1.5 rounded transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" title="Undo"><Undo2 size={14} /></button>
                  <button onClick={triggerRedo} className="p-1.5 rounded transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700" title="Redo"><Redo2 size={14} /></button>
                </>
              )}
            </div>
          )}

          <div className="relative">
            <button 
              onClick={() => setShowSizeMenu(!showSizeMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <LayoutTemplate size={14} /> <span className="hidden md:inline">Size</span>
            </button>
            {showSizeMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowSizeMenu(false)}
                />
                <div className="absolute left-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 w-40 flex flex-col z-50 text-slate-700 dark:text-slate-300">
                  <button onClick={() => { setDimensions({ width: 800, height: 1131 }); setShowSizeMenu(false); }} className="px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700">B4 Standard (1:1.414)</button>
                  <button onClick={() => { setDimensions({ width: 800, height: 1200 }); setShowSizeMenu(false); }} className="px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Classic 2:3</button>
                  <button onClick={() => { setDimensions({ width: 800, height: 800 }); setShowSizeMenu(false); }} className="px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Square 1:1</button>
                  <button onClick={() => { setDimensions({ width: 800, height: 4000 }); setShowSizeMenu(false); }} className="px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700">Webtoon (Long)</button>
                </div>
              </>
            )}
          </div>
          <button 
            onClick={handleAddText}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <Type size={14} /> <span className="hidden md:inline">Add Text</span>
          </button>
          <button 
            onClick={handleAddPanel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            <PlusSquare size={14} /> <span className="hidden md:inline">Add Panel</span>
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              <Download size={14} /> <span className="hidden md:inline">Export</span>
            </button>
            {showExportMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowExportMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded shadow-lg py-1 w-32 flex flex-col z-50 text-slate-700 dark:text-slate-300">
                  <button onClick={() => { handleExport('pdf'); setShowExportMenu(false); }} className="px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700">As PDF</button>
                  <button onClick={() => { handleExport('png'); setShowExportMenu(false); }} className="px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700">As PNG</button>
                  <button onClick={() => { handleExport('jpeg'); setShowExportMenu(false); }} className="px-3 py-1.5 text-left text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-700">As JPEG</button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Board Area */}
      <div 
        className="flex-1 p-8 overflow-auto flex justify-center items-start"
        onClick={handleCanvasClick}
      >
        <div 
          ref={containerRef}
          className="relative bg-white shadow-2xl mx-auto overflow-hidden bg-white" 
          style={{ width: dimensions.width, height: dimensions.height, minHeight: dimensions.height }}
        >
          {currentPageItems.map((item) => (
            <CanvasNode
              key={item.id}
              item={item}
              containerRef={containerRef}
              updateItem={updateCanvasItem}
              deleteItem={deleteCanvasItem}
              isSelected={selectedItemId === item.id}
              onSelect={() => setSelectedItemId(item.id)}
              drawMode={selectedItemId === item.id ? drawMode : false}
              drawTool={drawTool}
              penColor={penColor}
              penSize={penSize}
            />
          ))}
        </div>
      </div>
    </main>
  );
}

function CanvasNode({ 
  item, 
  containerRef, 
  updateItem, 
  deleteItem,
  isSelected,
  onSelect,
  drawMode,
  drawTool,
  penColor,
  penSize
}: { 
  item: CanvasItem;
  containerRef: React.RefObject<HTMLDivElement | null>;
  updateItem: any;
  deleteItem: any;
  isSelected?: boolean;
  onSelect?: () => void;
  drawMode?: boolean;
  drawTool?: 'pen' | 'eraser' | 'marker' | 'dashed';
  penColor?: string;
  penSize?: number;
}) {
  const isText = item.type === 'text';
  const dragControls = useDragControls();
  
  // Local state for smooth resizing
  const [localSize, setLocalSize] = useState({ width: item.width, height: item.height });
  const [isResizing, setIsResizing] = useState(false);

  // Drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [hoverPos, setHoverPos] = useState<{ x: number, y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const handleUndo = () => {
      const strokes = item.strokes || [];
      if (strokes.length > 0) {
        const lastStroke = strokes[strokes.length - 1];
        setRedoStack(prev => [...prev, lastStroke]);
        updateItem(item.id, { strokes: strokes.slice(0, -1) });
      }
    };
    
    const handleRedo = () => {
      if (redoStack.length > 0) {
        const strokeToRestore = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        const strokes = item.strokes || [];
        updateItem(item.id, { strokes: [...strokes, strokeToRestore] });
      }
    };

    window.addEventListener(`undo-${item.id}`, handleUndo);
    window.addEventListener(`redo-${item.id}`, handleRedo);
    
    return () => {
      window.removeEventListener(`undo-${item.id}`, handleUndo);
      window.removeEventListener(`redo-${item.id}`, handleRedo);
    };
  }, [item.id, item.strokes, redoStack, updateItem]);

  const displaySize = isResizing ? localSize : { width: item.width, height: item.height };

  const startResize = (e: React.PointerEvent<HTMLDivElement>, direction: 'e' | 's' | 'se') => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = localSize.width;
    const startH = localSize.height;
    
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    
    const handleMove = (moveEvent: PointerEvent) => {
      let newW = startW;
      let newH = startH;
      
      if (direction === 'e' || direction === 'se') {
        newW = Math.max(50, startW + (moveEvent.clientX - startX));
      }
      if (direction === 's' || direction === 'se') {
        newH = Math.max(30, startH + (moveEvent.clientY - startY));
      }
      setLocalSize({ width: newW, height: newH });
    };
    
    const handleUp = (upEvent: PointerEvent) => {
      target.releasePointerCapture(upEvent.pointerId);
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      setIsResizing(false);
      
      let newW = startW;
      let newH = startH;
      
      if (direction === 'e' || direction === 'se') {
        newW = Math.max(50, startW + (upEvent.clientX - startX));
      }
      if (direction === 's' || direction === 'se') {
        newH = Math.max(30, startH + (upEvent.clientY - startY));
      }
      
      updateItem(item.id, { width: newW, height: newH });
    };
    
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  const getPointerPos = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawMode || isResizing || isText) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(true);
    const pos = getPointerPos(e);
    setCurrentStroke({
      id: Math.random().toString(36).substring(2),
      tool: drawTool || 'pen',
      color: drawTool === 'eraser' ? '#ffffff' : (penColor || '#000000'),
      size: drawTool === 'eraser' ? 20 : (penSize || 3),
      points: [pos]
    });
    setRedoStack([]); // clear redo stack on new draw
  };

  const draw = (e: React.PointerEvent<SVGSVGElement>) => {
    if (drawMode) {
      setHoverPos(getPointerPos(e));
    }
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    e.stopPropagation();
    const pos = getPointerPos(e);
    setCurrentStroke(prev => {
      if (!prev) return null;
      return { ...prev, points: [...prev.points, pos] };
    });
  };

  const stopDrawing = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.type === 'pointerleave' || e.type === 'pointercancel') {
      setHoverPos(null);
    }
    if (!isDrawing || !currentStroke) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDrawing(false);
    
    if (currentStroke.points.length > 0) {
      const strokes = item.strokes || [];
      updateItem(item.id, { strokes: [...strokes, currentStroke] });
    }
    setCurrentStroke(null);
  };

  const renderStroke = (stroke: Stroke) => {
    if (stroke.points.length === 0) return null;
    const pathData = stroke.points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    
    let strokeProps: any = {
      stroke: stroke.color,
      strokeWidth: stroke.size,
      fill: "none",
      strokeLinecap: "round",
      strokeLinejoin: "round",
    };

    if (stroke.tool === 'marker') {
      strokeProps.strokeOpacity = 0.4;
      strokeProps.strokeLinecap = "square";
    } else if (stroke.tool === 'dashed') {
      strokeProps.strokeDasharray = `${Math.max(4, stroke.size * 2)}, ${Math.max(4, stroke.size * 2)}`;
    }

    return (
      <path
        key={stroke.id}
        d={pathData}
        {...strokeProps}
      />
    );
  };

  return (
    <motion.div
      drag={!drawMode}
      dragControls={dragControls}
      dragListener={false} // Only drag using the dedicated handle
      dragConstraints={containerRef}
      dragMomentum={false}
      initial={{ x: item.x, y: item.y }}
      onDragEnd={(e, info) => {
        updateItem(item.id, { 
          x: Math.max(0, item.x + info.offset.x), 
          y: Math.max(0, item.y + info.offset.y) 
        });
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.();
      }}
      className={`absolute group hover:z-[9999] ${isSelected && !isText ? 'ring-2 ring-indigo-500 shadow-xl' : ''}`}
      style={{ width: displaySize.width, height: displaySize.height, zIndex: item.zIndex || 10 }}
    >
      <div className={`w-full h-full relative ${
        isText 
          ? 'bg-transparent flex items-center justify-center' 
          : 'bg-white border-2 border-slate-900 shadow-sm' /* standard manga panel is white bg */
      }`}>
        
        {/* DRAG HANDLE */}
        {!drawMode && isSelected && (
          <div 
            className="do-not-print absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-8 bg-slate-800 text-slate-100 rounded-t-lg shadow-sm opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:bg-slate-700 z-50 flex items-center justify-center pointer-events-auto touch-none"
            onPointerDown={(e) => dragControls.start(e)}
          >
            <GripHorizontal size={20} />
          </div>
        )}

        {isText ? (
          <textarea 
            className="w-full h-full p-2 bg-transparent resize-none outline-none text-slate-800 dark:text-slate-200 text-center font-bold italic text-base pointer-events-auto leading-tight"
            value={item.content}
            onChange={(e) => updateItem(item.id, { content: e.target.value })}
          />
        ) : (
          <div className="w-full h-full flex flex-col pointer-events-none transition-colors relative overflow-hidden">
            {/* Drawing layer */}
            <svg
              ref={svgRef}
              className={`absolute inset-0 w-full h-full ${drawMode ? 'pointer-events-auto touch-none cursor-none' : 'pointer-events-none'}`}
              onPointerDown={startDrawing}
              onPointerMove={draw}
              onPointerUp={stopDrawing}
              onPointerCancel={stopDrawing}
              onPointerLeave={stopDrawing}
              onPointerEnter={(e) => {
                if (drawMode) setHoverPos(getPointerPos(e));
              }}
            >
              {(item.strokes || []).map(renderStroke)}
              {currentStroke && renderStroke(currentStroke)}
              {drawMode && hoverPos && (
                <circle 
                  cx={hoverPos.x} 
                  cy={hoverPos.y} 
                  r={(drawTool === 'eraser' ? 20 : (penSize || 3)) / 2} 
                  fill={drawTool === 'marker' ? (penColor || '#000000') : 'none'}
                  fillOpacity={drawTool === 'marker' ? 0.4 : undefined}
                  stroke={drawTool === 'eraser' ? '#ff4444' : (drawTool === 'marker' ? 'none' : (penColor || '#000000'))} 
                  strokeWidth="1.5" 
                  strokeDasharray={drawTool === 'dashed' ? '3,3' : undefined}
                  className="pointer-events-none opacity-50" 
                />
              )}
            </svg>

            {/* Text Overlay (if user wants to type over draw mode) */}
            <textarea 
              className={`w-full flex-1 bg-transparent border-none outline-none text-slate-600 font-medium text-[11px] p-3 uppercase tracking-tighter text-center focus:text-slate-800 resize-none break-words z-10 ${drawMode ? 'pointer-events-none' : 'pointer-events-auto'}`}
              value={item.content}
              placeholder="Panel Description"
              onChange={(e) => updateItem(item.id, { content: e.target.value })}
            />
          </div>
        )}

        {/* Delete button */}
        {!drawMode && isSelected && (
          <button 
            onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
            className="do-not-print absolute -top-3 -right-3 w-8 h-8 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-slate-700 hover:border-red-200 dark:hover:border-red-500/50 rounded-full shadow-md opacity-100 transition-all pointer-events-auto z-50 touch-none"
          >
            <Trash2 size={16} />
          </button>
        )}

        {/* --- EDGE RESIZING HANDLES --- */}
        {!drawMode && isSelected && (
          <>
            {/* Right Edge */}
            <div 
              className="do-not-print absolute top-0 -right-[15px] w-[30px] h-full cursor-e-resize pointer-events-auto z-40 touch-none flex justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              onPointerDown={(e) => startResize(e, 'e')}
            />
            
            {/* Bottom Edge */}
            <div 
              className="do-not-print absolute -bottom-[15px] left-0 w-full h-[30px] cursor-s-resize pointer-events-auto z-40 touch-none flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
              onPointerDown={(e) => startResize(e, 's')}
            />

            {/* Bottom Right Corner */}
            <div 
              className="do-not-print absolute -bottom-[15px] -right-[15px] w-[40px] h-[40px] cursor-se-resize pointer-events-auto z-50 touch-none flex items-center justify-center bg-slate-800 rounded-full opacity-100 hover:bg-slate-700 shadow-md transition-all border-4 border-white"
              onPointerDown={(e) => startResize(e, 'se')}
            >
              <div className="w-3 h-3 border-r-[2px] border-b-[2px] border-slate-200 pointer-events-none -mt-1 -ml-1" />
            </div>
          </>
        )}

      </div>
    </motion.div>
  );
}
