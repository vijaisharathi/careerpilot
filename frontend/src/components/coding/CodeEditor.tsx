import React, { useState, useRef, useEffect } from 'react';
import { Copy, RotateCcw, Check, Code2, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '../common/Button';
import { SupportedLanguage } from '../../types/coding.types';

export interface CodeEditorProps {
  language: SupportedLanguage;
  code: string;
  onChange: (value: string) => void;
  onLanguageChange?: (language: SupportedLanguage) => void;
  starterCode?: string;
  readOnly?: boolean;
  className?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  language,
  code,
  onChange,
  onLanguageChange,
  starterCode,
  readOnly = false,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = code.split('\n');
  const lineCount = Math.max(lines.length, 18);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleReset = () => {
    if (!starterCode) return;
    if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
      const ok = window.confirm('Reset code to starter template?');
      if (!ok) return;
    }
    onChange(starterCode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;

      // Insert 4 spaces
      const updated = code.substring(0, start) + '    ' + code.substring(end);
      onChange(updated);

      // Set cursor position after the 4 spaces
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop;
    }
  };

  return (
    <div className={`flex flex-col rounded-xl border border-slate-800 bg-slate-950 overflow-hidden shadow-lg ${className}`}>
      {/* Editor Header Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Code2 className="h-4 w-4 text-emerald-400" />
          {onLanguageChange ? (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value as SupportedLanguage)}
              disabled={readOnly}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-0.5 text-xs font-sans outline-none focus:border-emerald-500 cursor-pointer"
            >
              <option value="python">Python 3.10</option>
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="java">Java 17 (OpenJDK)</option>
              <option value="cpp">C++ (GCC 11)</option>
            </select>
          ) : (
            <span className="font-semibold text-slate-200 capitalize">{language} Solution</span>
          )}
          <span className="text-[11px] text-slate-500">
            ({lines.length} lines, {code.length} chars)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {starterCode && (
            <button
              type="button"
              onClick={handleReset}
              disabled={readOnly}
              className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
              title="Reset to starter code"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
            title="Copy code"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body: Line numbers + Monospace Textarea */}
      <div className="relative flex flex-1 font-mono text-xs sm:text-sm bg-slate-950 min-h-[360px]">
        {/* Line Numbers Gutter */}
        <div
          ref={lineNumbersRef}
          aria-hidden="true"
          className="select-none py-3 pl-3 pr-2 text-right bg-slate-950 border-r border-slate-800/80 text-slate-600 font-mono text-xs overflow-hidden w-12 shrink-0 leading-5"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i + 1} className="h-5">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Code Input */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          readOnly={readOnly}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 w-full p-3 bg-transparent text-emerald-300 placeholder-slate-600 outline-none resize-none leading-5 font-mono overflow-auto selection:bg-emerald-900/60 selection:text-white"
          placeholder={`# Enter your ${language} solution here...`}
        />
      </div>
    </div>
  );
};

