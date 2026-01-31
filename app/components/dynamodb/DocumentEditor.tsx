import * as React from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { json, jsonParseLinter } from '@codemirror/lang-json'
import { linter, lintGutter } from '@codemirror/lint'
import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import { Button } from '@/app/components/ui/button'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Spinner } from '@/app/components/ui/spinner'
import { Switch } from '@/app/components/ui/switch'
import { X, Copy, AlertCircle, CheckCircle2 } from 'lucide-react'

// Custom dark theme that bundles properly with Electron
const darkTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: '#23262e',
      color: '#d5ced9',
    },
    '.cm-content': {
      caretColor: '#f39c12',
      fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
      fontSize: '13px',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#f39c12',
    },
    // Improved selection highlight - more visible blue/purple tint
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: '#264f78 !important',
    },
    '.cm-selectionBackground': {
      backgroundColor: '#264f78 !important',
    },
    '.cm-activeLine': {
      backgroundColor: '#2a2e38',
    },
    '.cm-gutters': {
      backgroundColor: '#23262e',
      color: '#5c6370',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#2a2e38',
    },
    '.cm-lineNumbers .cm-gutterElement': {
      padding: '0 8px 0 16px',
    },
    '.cm-foldGutter .cm-gutterElement': {
      padding: '0 4px',
    },
    '.cm-tooltip': {
      backgroundColor: '#2a2e38',
      border: '1px solid #3d4455',
      color: '#d5ced9',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: '#3d4455',
      },
    },
    '.cm-panels': {
      backgroundColor: '#23262e',
      color: '#d5ced9',
    },
    // Search match highlight - much more prominent yellow/orange
    '.cm-searchMatch': {
      backgroundColor: '#9e6a03',
      outline: '1px solid #f39c12',
    },
    '.cm-searchMatch.cm-searchMatch-selected': {
      backgroundColor: '#f39c12',
      color: '#000',
    },
    // Selection match highlighting
    '.cm-selectionMatch': {
      backgroundColor: '#515c6a',
    },
  },
  { dark: true }
)

// Syntax highlighting colors
const darkHighlighting = HighlightStyle.define([
  { tag: tags.keyword, color: '#c74ded' },
  { tag: tags.operator, color: '#c74ded' },
  { tag: tags.special(tags.variableName), color: '#ffe261' },
  { tag: tags.typeName, color: '#ffe261' },
  { tag: tags.atom, color: '#96e072' },
  { tag: tags.number, color: '#f39c12' },
  { tag: tags.definition(tags.variableName), color: '#ffe261' },
  { tag: tags.string, color: '#96e072' },
  { tag: tags.special(tags.string), color: '#96e072' },
  { tag: tags.comment, color: '#5c6370', fontStyle: 'italic' },
  { tag: tags.variableName, color: '#ee5d43' },
  { tag: tags.tagName, color: '#ee5d43' },
  { tag: tags.bracket, color: '#d5ced9' },
  { tag: tags.meta, color: '#5c6370' },
  { tag: tags.attributeName, color: '#ffe261' },
  { tag: tags.propertyName, color: '#00e8c6' },
  { tag: tags.className, color: '#ffe261' },
  { tag: tags.labelName, color: '#ffe261' },
  { tag: tags.invalid, color: '#ee5d43' },
  { tag: tags.bool, color: '#f39c12' },
  { tag: tags.null, color: '#f39c12' },
])

const customTheme = [darkTheme, syntaxHighlighting(darkHighlighting)]

interface DocumentEditorProps {
  isOpen: boolean
  onClose: () => void
  tableName: string
  item: Record<string, unknown> | null
  onSave: (item: Record<string, unknown>) => Promise<void>
  isNew?: boolean
  inline?: boolean
}

// Helper to convert a value to DynamoDB format
function convertValueToDynamoDB(value: unknown): unknown {
  if (value === null) {
    return { NULL: true }
  }
  if (typeof value === 'string') {
    return { S: value }
  }
  if (typeof value === 'number') {
    return { N: String(value) }
  }
  if (typeof value === 'boolean') {
    return { BOOL: value }
  }
  if (Array.isArray(value)) {
    return { L: value.map(convertValueToDynamoDB) }
  }
  if (typeof value === 'object') {
    const converted: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      converted[k] = convertValueToDynamoDB(v)
    }
    return { M: converted }
  }
  return { S: String(value) }
}

// Convert standard JSON to DynamoDB format for display
function convertToDynamoDBFormat(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    result[key] = convertValueToDynamoDB(value)
  }
  return result
}

export function DocumentEditor({ isOpen, onClose, tableName, item, onSave, isNew = false, inline = false }: DocumentEditorProps) {
  const [content, setContent] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [hasValidationErrors, setHasValidationErrors] = React.useState(false)
  const [viewDynamoDBJson, setViewDynamoDBJson] = React.useState(false)
  const [cursorPosition, setCursorPosition] = React.useState({ line: 1, col: 1 })

  // Initialize content when item changes
  React.useEffect(() => {
    if (item) {
      const formattedJson = viewDynamoDBJson
        ? JSON.stringify(convertToDynamoDBFormat(item), null, 2)
        : JSON.stringify(item, null, 2)
      setContent(formattedJson)
    } else {
      setContent('{\n  \n}')
    }
    setError(null)
    setSuccess(false)
  }, [item, viewDynamoDBJson])

  // Check for JSON validity
  React.useEffect(() => {
    try {
      if (content.trim()) {
        JSON.parse(content)
        setHasValidationErrors(false)
      }
    } catch {
      setHasValidationErrors(true)
    }
  }, [content])

  const handleContentChange = (value: string) => {
    setContent(value)
    setError(null)
    setSuccess(false)
  }

  const validateAndParse = (): Record<string, unknown> | null => {
    try {
      const parsed = JSON.parse(content)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new Error('Document must be a JSON object')
      }
      return parsed
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
      return null
    }
  }

  const handleSave = async () => {
    if (hasValidationErrors) {
      setError('Please fix JSON syntax errors before saving')
      return
    }

    const parsed = validateAndParse()
    if (!parsed) return

    setIsLoading(true)
    setError(null)

    try {
      await onSave(parsed)
      setSuccess(true)
      //   setTimeout(() => {
      //     onClose()
      //   }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDocument = () => {
    try {
      const parsed = JSON.parse(content)
      setContent(JSON.stringify(parsed, null, 2))
    } catch {
      // Ignore formatting errors
    }
  }

  // CodeMirror extensions
  const extensions = React.useMemo(
    () => [
      json(),
      linter(jsonParseLinter()),
      lintGutter(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.selectionSet) {
          const pos = update.state.selection.main.head
          const line = update.state.doc.lineAt(pos)
          setCursorPosition({
            line: line.number,
            col: pos - line.from + 1,
          })
        }
      }),
    ],
    []
  )

  if (!isOpen) return null

  // Shared content for both modal and inline modes
  const editorContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">{isNew ? 'Create Item' : 'Edit Item'}</h2>
          <span className="text-sm text-muted-foreground">
            Table: <span className="font-medium text-foreground">{tableName}</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={viewDynamoDBJson} onCheckedChange={setViewDynamoDBJson} />
            <span className="text-sm text-muted-foreground">View DynamoDB JSON</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy to clipboard">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Validation Errors Banner */}
      {hasValidationErrors && (
        <div className="px-6 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2 text-destructive text-sm shrink-0">
          <AlertCircle className="h-4 w-4" />
          <span>JSON syntax error detected</span>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <CodeMirror
          value={content}
          onChange={handleContentChange}
          extensions={extensions}
          height={inline ? '100%' : 'auto'}
          theme={customTheme}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightActiveLine: true,
            foldGutter: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: false,
            highlightSelectionMatches: true,
            tabSize: 2,
          }}
        />
      </div>

      {/* Status Bar */}
      <div className="px-6 py-2 border-t bg-muted/30 flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span>JSON</span>
        <span>•</span>
        <span>
          Ln {cursorPosition.line}, Col {cursorPosition.col}
        </span>
        {!hasValidationErrors && content.length > 0 && (
          <>
            <span>•</span>
            <span className="text-green-500 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Valid JSON
            </span>
          </>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="px-6 py-3 border-t shrink-0">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {success && (
        <div className="px-6 py-3 border-t shrink-0">
          <Alert variant="success">
            <AlertDescription>Document saved successfully!</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-end gap-3 px-6 py-4 border-t shrink-0">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          {inline ? 'Close' : 'Cancel'}
        </Button>
        <Button variant="outline" onClick={formatDocument} disabled={isLoading}>
          Format
        </Button>
        <Button onClick={handleSave} disabled={isLoading || hasValidationErrors}>
          {isLoading ? (
            <>
              <Spinner className="h-4 w-4 mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>
      </div>
    </>
  )

  // Inline mode: render directly without modal wrapper
  if (inline) {
    return (
      <div className="flex-1 flex flex-col bg-background rounded-lg border overflow-hidden">
        {editorContent}
      </div>
    )
  }

  // Modal mode: render with backdrop and centering
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-50 w-full max-w-4xl max-h-[90vh] flex flex-col bg-background rounded-lg border shadow-xl">
        {editorContent}
      </div>
    </div>
  )
}
