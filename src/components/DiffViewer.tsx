import React, { useState } from 'react';
import * as Diff from 'diff';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-typescript';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-css';
import 'ace-builds/src-noconflict/mode-html';
import 'ace-builds/src-noconflict/theme-monokai';

interface FileDiff {
  fileName: string;
  oldContent: string;
  newContent: string;
  language?: string;
}

interface DiffViewerProps {
  files: FileDiff[];
  onAddComment?: (fileName: string, line: number) => void;
  showAddCommentButtons?: boolean;
}

interface DiffLine {
  type: 'add' | 'remove' | 'unchanged';
  oldLineNumber: number | null;
  newLineNumber: number | null;
  content: string;
}

/**
 * DiffViewer Component
 * 
 * Displays file diffs with syntax highlighting using Ace Editor
 * Supports '+' buttons to add inline comments
 */
export const DiffViewer: React.FC<DiffViewerProps> = ({
  files,
  onAddComment,
  showAddCommentButtons = false,
}) => {
  const [selectedFile, setSelectedFile] = useState(files[0]?.fileName || '');
  const [viewMode, setViewMode] = useState<'sideBySide' | 'unified'>('sideBySide');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());

  const currentFile = files.find(f => f.fileName === selectedFile);

  if (!currentFile) {
    return (
      <div className="diff-viewer empty">
        <p>No files to compare</p>
      </div>
    );
  }

  // Generate diff using the diff library
  const diffResult = Diff.diffLines(currentFile.oldContent, currentFile.newContent);
  
  // Convert diff to line-by-line format
  const diffLines: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;

  diffResult.forEach(part => {
    const lines = part.value.split('\n');
    // Remove empty last line if exists
    if (lines[lines.length - 1] === '') lines.pop();

    lines.forEach(line => {
      if (part.added) {
        diffLines.push({
          type: 'add',
          oldLineNumber: null,
          newLineNumber: newLine++,
          content: line,
        });
      } else if (part.removed) {
        diffLines.push({
          type: 'remove',
          oldLineNumber: oldLine++,
          newLineNumber: null,
          content: line,
        });
      } else {
        diffLines.push({
          type: 'unchanged',
          oldLineNumber: oldLine++,
          newLineNumber: newLine++,
          content: line,
        });
      }
    });
  });

  // Group consecutive unchanged lines for collapsing
  const groupedLines: Array<{ type: 'changes' | 'unchanged'; lines: DiffLine[]; startIndex: number }> = [];
  let currentGroup: DiffLine[] = [];
  let currentType: 'changes' | 'unchanged' | null = null;
  let groupStartIndex = 0;

  diffLines.forEach((line, index) => {
    const lineType = line.type === 'unchanged' ? 'unchanged' : 'changes';
    
    if (lineType !== currentType) {
      if (currentGroup.length > 0) {
        groupedLines.push({ type: currentType!, lines: currentGroup, startIndex: groupStartIndex });
      }
      currentGroup = [line];
      currentType = lineType;
      groupStartIndex = index;
    } else {
      currentGroup.push(line);
    }
  });

  if (currentGroup.length > 0) {
    groupedLines.push({ type: currentType!, lines: currentGroup, startIndex: groupStartIndex });
  }

  const handleAddComment = (lineNumber: number) => {
    if (onAddComment) {
      onAddComment(selectedFile, lineNumber);
    }
  };

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="diff-viewer">
      {/* File tabs */}
      {files.length > 1 && (
        <div className="diff-file-tabs">
          {files.map(file => (
            <button
              key={file.fileName}
              className={`file-tab ${selectedFile === file.fileName ? 'active' : ''}`}
              onClick={() => setSelectedFile(file.fileName)}
            >
              {file.fileName}
            </button>
          ))}
        </div>
      )}

      {/* View mode toggle */}
      <div className="diff-controls">
        <div className="view-mode-toggle">
          <button
            className={viewMode === 'sideBySide' ? 'active' : ''}
            onClick={() => setViewMode('sideBySide')}
          >
            Side by Side
          </button>
          <button
            className={viewMode === 'unified' ? 'active' : ''}
            onClick={() => setViewMode('unified')}
          >
            Unified
          </button>
        </div>
      </div>

      {/* Diff content */}
      <div className={`diff-content ${viewMode}`}>
        {viewMode === 'sideBySide' ? (
          <div className="side-by-side-diff">
            <div className="diff-column old">
              <div className="column-header">Original</div>
              <div className="diff-lines">
                {diffLines.map((line, index) => (
                  line.type !== 'add' && (
                    <div key={index} className={`diff-line ${line.type}`}>
                      <span className="line-number">{line.oldLineNumber || ''}</span>
                      <span className="line-content">{line.content || ' '}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
            <div className="diff-column new">
              <div className="column-header">Modified</div>
              <div className="diff-lines">
                {diffLines.map((line, index) => (
                  line.type !== 'remove' && (
                    <div key={index} className={`diff-line ${line.type}`}>
                      <span className="line-number">{line.newLineNumber || ''}</span>
                      <span className="line-content">{line.content || ' '}</span>
                      {showAddCommentButtons && line.type === 'add' && line.newLineNumber && (
                        <button
                          className="add-comment-btn"
                          onClick={() => handleAddComment(line.newLineNumber!)}
                          title="Add comment at this line"
                        >
                          +
                        </button>
                      )}
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="unified-diff">
            {groupedLines.map((group, groupIndex) => (
              <div key={groupIndex} className="diff-group">
                {group.type === 'unchanged' && group.lines.length > 6 ? (
                  <div className="collapsed-section">
                    <button
                      className="expand-btn"
                      onClick={() => toggleSection(groupIndex)}
                    >
                      {expandedSections.has(groupIndex)
                        ? `▼ Hide ${group.lines.length} unchanged lines`
                        : `▶ Show ${group.lines.length} unchanged lines`}
                    </button>
                    {expandedSections.has(groupIndex) &&
                      group.lines.map((line, lineIndex) => (
                        <div key={lineIndex} className={`diff-line ${line.type}`}>
                          <span className="line-numbers">
                            <span className="old-line-num">{line.oldLineNumber || ''}</span>
                            <span className="new-line-num">{line.newLineNumber || ''}</span>
                          </span>
                          <span className="line-prefix">{' '}</span>
                          <span className="line-content">{line.content || ' '}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  group.lines.map((line, lineIndex) => (
                    <div key={lineIndex} className={`diff-line ${line.type}`}>
                      <span className="line-numbers">
                        <span className="old-line-num">{line.oldLineNumber || ''}</span>
                        <span className="new-line-num">{line.newLineNumber || ''}</span>
                      </span>
                      <span className="line-prefix">
                        {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                      </span>
                      <span className="line-content">{line.content || ' '}</span>
                      {showAddCommentButtons && line.type === 'add' && line.newLineNumber && (
                        <button
                          className="add-comment-btn"
                          onClick={() => handleAddComment(line.newLineNumber!)}
                          title="Add comment at this line"
                        >
                          +
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .diff-viewer {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          background: white;
          overflow: hidden;
        }

        .diff-file-tabs {
          display: flex;
          gap: 4px;
          padding: 8px 12px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
        }

        .file-tab {
          padding: 8px 16px;
          background: transparent;
          border: none;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
          font-size: 13px;
          color: #666;
          transition: all 0.2s;
        }

        .file-tab:hover {
          background: rgba(102, 126, 234, 0.1);
        }

        .file-tab.active {
          background: white;
          color: #667eea;
          font-weight: 600;
        }

        .diff-controls {
          padding: 12px;
          background: #f9f9f9;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
        }

        .view-mode-toggle {
          display: flex;
          gap: 0;
          border: 1px solid #ddd;
          border-radius: 6px;
          overflow: hidden;
        }

        .view-mode-toggle button {
          padding: 6px 12px;
          background: white;
          border: none;
          cursor: pointer;
          font-size: 12px;
          color: #666;
          transition: all 0.2s;
        }

        .view-mode-toggle button:not(:last-child) {
          border-right: 1px solid #ddd;
        }

        .view-mode-toggle button.active {
          background: #667eea;
          color: white;
        }

        .diff-content {
          overflow: auto;
          max-height: 600px;
        }

        .side-by-side-diff {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2px;
          background: #e0e0e0;
        }

        .diff-column {
          background: white;
          overflow-x: auto;
        }

        .column-header {
          padding: 8px 12px;
          background: #f5f5f5;
          border-bottom: 1px solid #e0e0e0;
          font-weight: 600;
          font-size: 13px;
          color: #333;
          position: sticky;
          top: 0;
          z-index: 10;
        }

        .diff-lines {
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          font-size: 13px;
        }

        .diff-line {
          display: flex;
          align-items: center;
          padding: 2px 8px;
          line-height: 1.5;
          position: relative;
        }

        .diff-line.add {
          background: #e6ffed;
        }

        .diff-line.remove {
          background: #ffebe9;
        }

        .diff-line.unchanged {
          background: white;
        }

        .line-number {
          display: inline-block;
          width: 50px;
          text-align: right;
          padding-right: 12px;
          color: #999;
          user-select: none;
          flex-shrink: 0;
        }

        .line-content {
          flex: 1;
          white-space: pre;
          overflow-x: auto;
        }

        .add-comment-btn {
          position: absolute;
          right: 8px;
          width: 24px;
          height: 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          line-height: 1;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .diff-line:hover .add-comment-btn {
          opacity: 1;
        }

        .add-comment-btn:hover {
          background: #5568d3;
        }

        .unified-diff {
          font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
          font-size: 13px;
        }

        .diff-group {
          margin: 0;
        }

        .collapsed-section {
          background: #f5f5f5;
          border-top: 1px solid #e0e0e0;
          border-bottom: 1px solid #e0e0e0;
        }

        .expand-btn {
          width: 100%;
          padding: 8px;
          background: #f5f5f5;
          border: none;
          cursor: pointer;
          text-align: left;
          color: #667eea;
          font-size: 12px;
          font-weight: 600;
        }

        .expand-btn:hover {
          background: #ebebeb;
        }

        .line-numbers {
          display: inline-flex;
          gap: 8px;
          width: 100px;
          flex-shrink: 0;
          user-select: none;
        }

        .old-line-num,
        .new-line-num {
          width: 40px;
          text-align: right;
          color: #999;
        }

        .line-prefix {
          display: inline-block;
          width: 20px;
          text-align: center;
          font-weight: bold;
          flex-shrink: 0;
        }

        .diff-line.add .line-prefix {
          color: #22863a;
        }

        .diff-line.remove .line-prefix {
          color: #cb2431;
        }

        .diff-viewer.empty {
          padding: 40px;
          text-align: center;
          color: #999;
        }
      `}</style>
    </div>
  );
};

export default DiffViewer;



