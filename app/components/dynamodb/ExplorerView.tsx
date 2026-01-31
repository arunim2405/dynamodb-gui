import * as React from 'react'
import { useDynamoDB } from './DynamoDBContext'
import { useTabs } from './TabsContext'
import { DocumentEditor } from './DocumentEditor'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Select } from '@/app/components/ui/select'
import { Badge } from '@/app/components/ui/badge'
import { Spinner } from '@/app/components/ui/spinner'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Collapsible } from '@/app/components/ui/collapsible'
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group'
import { Checkbox } from '@/app/components/ui/checkbox'
import { Play, Plus, X, RotateCcw, ChevronDown, ChevronRight, Copy, Pencil, Trash2, FilePlus, ExternalLink } from 'lucide-react'
import type {
  ScanQueryRequest,
  ScanQueryFilter,
  ScanQueryResult,
  KeyAttributeValue,
} from '@/lib/services/dynamodb-service'

// Sort key operators for Query mode
const SORT_KEY_OPERATORS = [
  { value: 'EQ', label: 'Equal to' },
  { value: 'LE', label: 'Less than or equal to' },
  { value: 'LT', label: 'Less than' },
  { value: 'GE', label: 'Greater than or equal to' },
  { value: 'GT', label: 'Greater than' },
  { value: 'BETWEEN', label: 'Between' },
  { value: 'BEGINS_WITH', label: 'Begins with' },
]

// Filter condition operators
const FILTER_CONDITIONS = [
  { value: 'EQ', label: 'Equal to' },
  { value: 'NE', label: 'Not equal to' },
  { value: 'LT', label: 'Less than' },
  { value: 'LE', label: 'Less than or equal to' },
  { value: 'GT', label: 'Greater than' },
  { value: 'GE', label: 'Greater than or equal to' },
  { value: 'BETWEEN', label: 'Between' },
  { value: 'BEGINS_WITH', label: 'Begins with' },
  { value: 'CONTAINS', label: 'Contains' },
  { value: 'NOT_CONTAINS', label: 'Does not contain' },
  { value: 'EXISTS', label: 'Exists' },
  { value: 'NOT_EXISTS', label: 'Does not exist' },
]

// Attribute types
const ATTRIBUTE_TYPES = [
  { value: 'S', label: 'String' },
  { value: 'N', label: 'Number' },
  { value: 'B', label: 'Binary' },
  { value: 'BOOL', label: 'Boolean' },
  { value: 'NULL', label: 'Null' },
]

// Projection types
const PROJECTION_TYPES = [
  { value: 'ALL', label: 'All attributes' },
  { value: 'KEYS_ONLY', label: 'Keys only' },
  { value: 'INCLUDE', label: 'Include specific attributes' },
]

// Maximum length for tab titles
const MAX_TAB_TITLE_LENGTH = 30

interface FilterRowProps {
  filter: ScanQueryFilter
  index: number
  onChange: (index: number, filter: ScanQueryFilter) => void
  onRemove: (index: number) => void
}

function FilterRow({ filter, index, onChange, onRemove }: FilterRowProps) {
  const needsValue = !['EXISTS', 'NOT_EXISTS'].includes(filter.condition)
  const needsSecondValue = filter.condition === 'BETWEEN'

  return (
    <div className="flex items-center gap-2 py-1.5">
      <Input
        placeholder="Attribute name"
        value={filter.attributeName}
        onChange={(e) => onChange(index, { ...filter, attributeName: e.target.value })}
        className="w-36 h-8 text-xs"
      />
      <Select
        value={filter.condition}
        onChange={(e) => onChange(index, { ...filter, condition: e.target.value as ScanQueryFilter['condition'] })}
        options={FILTER_CONDITIONS}
        className="w-40 h-8 text-xs"
      />
      <Select
        value={filter.type}
        onChange={(e) => onChange(index, { ...filter, type: e.target.value as ScanQueryFilter['type'] })}
        options={ATTRIBUTE_TYPES}
        className="w-24 h-8 text-xs"
      />
      {needsValue && (
        <Input
          placeholder="Value"
          value={filter.value}
          onChange={(e) => onChange(index, { ...filter, value: e.target.value })}
          className="w-36 h-8 text-xs"
        />
      )}
      {needsSecondValue && (
        <>
          <span className="text-muted-foreground text-xs">and</span>
          <Input
            placeholder="Value 2"
            value={filter.value2 || ''}
            onChange={(e) => onChange(index, { ...filter, value2: e.target.value })}
            className="w-36 h-8 text-xs"
          />
        </>
      )}
      <Button variant="ghost" size="icon" onClick={() => onRemove(index)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// Interface and component for multi-attribute partition key
interface PartitionKeyRowProps {
  keyValue: KeyAttributeValue
  index: number
  onChange: (index: number, keyValue: KeyAttributeValue) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

function PartitionKeyRow({ keyValue, index, onChange, onRemove, canRemove }: PartitionKeyRowProps) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="flex-1">
        <Input placeholder="Attribute name" value={keyValue.attributeName} disabled className="bg-muted/30 h-8 text-xs" />
      </div>
      <div className="flex-1">
        <Input
          placeholder="Enter attribute value"
          value={keyValue.value}
          onChange={(e) => onChange(index, { ...keyValue, value: e.target.value })}
          className="h-8 text-xs"
        />
      </div>
    </div>
  )
}

// Interface and component for multi-attribute sort key
interface SortKeyRowProps {
  sortCondition: {
    attributeName: string
    operator: 'EQ' | 'LE' | 'LT' | 'GE' | 'GT' | 'BETWEEN' | 'BEGINS_WITH'
    value: string
    value2?: string
    type: 'S' | 'N' | 'B' | 'BOOL' | 'NULL'
  }
  index: number
  onChange: (index: number, sortCondition: SortKeyRowProps['sortCondition']) => void
  onRemove: (index: number) => void
  canRemove: boolean
}

function SortKeyRow({ sortCondition, index, onChange, onRemove, canRemove }: SortKeyRowProps) {
  const needsSecondValue = sortCondition.operator === 'BETWEEN'

  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="w-36">
        <Input placeholder="Attribute name" value={sortCondition.attributeName} disabled className="bg-muted/30 h-8 text-xs" />
      </div>
      <div className="w-40">
        <Select
          value={sortCondition.operator}
          onChange={(e) =>
            onChange(index, {
              ...sortCondition,
              operator: e.target.value as SortKeyRowProps['sortCondition']['operator'],
            })
          }
          options={SORT_KEY_OPERATORS}
          className="h-8 text-xs"
        />
      </div>
      <div className="flex-1">
        <Input
          placeholder="Enter attribute value"
          value={sortCondition.value}
          onChange={(e) => onChange(index, { ...sortCondition, value: e.target.value })}
          className="h-8 text-xs"
        />
      </div>
      {needsSecondValue && (
        <>
          <span className="text-muted-foreground text-xs">and</span>
          <div className="flex-1">
            <Input
              placeholder="Value 2"
              value={sortCondition.value2 || ''}
              onChange={(e) => onChange(index, { ...sortCondition, value2: e.target.value })}
              className="h-8 text-xs"
            />
          </div>
        </>
      )}
    </div>
  )
}

interface JsonTreeViewProps {
  data: Record<string, unknown>
  level?: number
}

// Helper component for copyable values
function CopyableValue({ value, displayValue, className }: { value: string; displayValue: React.ReactNode; className?: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <span
      onClick={handleCopy}
      className={`cursor-pointer hover:bg-muted/50 rounded px-0.5 -mx-0.5 transition-colors select-text ${className || ''}`}
      title={copied ? 'Copied!' : 'Click to copy'}
    >
      {displayValue}
      {copied && <span className="ml-1 text-green-500 text-[10px]">✓</span>}
    </span>
  )
}

function JsonTreeView({ data, level = 0 }: JsonTreeViewProps) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set())

  const toggleExpand = (key: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const renderValue = (key: string, value: unknown): React.ReactNode => {
    if (value === null) {
      return <CopyableValue value="null" displayValue={<span className="text-muted-foreground/70 italic">null</span>} />
    }

    if (typeof value === 'boolean') {
      return <CopyableValue value={value.toString()} displayValue={<span className="text-sky-400">{value.toString()}</span>} />
    }

    if (typeof value === 'number') {
      return <CopyableValue value={value.toString()} displayValue={<span className="text-emerald-400">{value}</span>} />
    }

    if (typeof value === 'string') {
      return <CopyableValue value={value} displayValue={<span className="text-amber-400">"{value}"</span>} />
    }

    if (Array.isArray(value)) {
      const isExpanded = expanded.has(key)
      return (
        <div>
          <button onClick={() => toggleExpand(key)} className="flex items-center gap-1 hover:bg-muted/30 rounded px-1 -ml-1 transition-colors">
            {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <span className="text-muted-foreground">Array [{value.length}]</span>
          </button>
          {isExpanded && (
            <div className="ml-4 border-l border-border/50 pl-3 mt-1">
              {value.map((item, i) => (
                <div key={i} className="flex gap-2 py-0.5">
                  <span className="text-muted-foreground/70 select-text">{i}:</span>
                  {renderValue(`${key}.${i}`, item)}
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (typeof value === 'object') {
      const isExpanded = expanded.has(key)
      return (
        <div>
          <button onClick={() => toggleExpand(key)} className="flex items-center gap-1 hover:bg-muted/30 rounded px-1 -ml-1 transition-colors">
            {isExpanded ? <ChevronDown className="h-3 w-3 text-muted-foreground" /> : <ChevronRight className="h-3 w-3 text-muted-foreground" />}
            <span className="text-muted-foreground">Object</span>
          </button>
          {isExpanded && (
            <div className="ml-4 border-l border-border/50 pl-3 mt-1">
              <JsonTreeView data={value as Record<string, unknown>} level={level + 1} />
            </div>
          )}
        </div>
      )
    }

    return <CopyableValue value={String(value)} displayValue={<span>{String(value)}</span>} />
  }

  return (
    <div className="font-mono text-xs space-y-0.5 leading-relaxed select-text">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <CopyableValue value={key} displayValue={<span className="text-violet-400 shrink-0">{key}:</span>} />
          {renderValue(key, value)}
        </div>
      ))}
    </div>
  )
}

export function ExplorerView() {
  const { currentTable, currentTableName, selectedProfile, selectedRegion, connectionInfo } = useDynamoDB()
  const { addTab } = useTabs()

  // Query state
  const [mode, setMode] = React.useState<'scan' | 'query'>('scan')
  const [selectedIndex, setSelectedIndex] = React.useState<string>('')
  const [projectionType, setProjectionType] = React.useState<'ALL' | 'KEYS_ONLY' | 'INCLUDE'>('ALL')
  const [partitionKeyValue, setPartitionKeyValue] = React.useState('')
  const [sortKeyOperator, setSortKeyOperator] = React.useState<string>('EQ')
  const [sortKeyValue, setSortKeyValue] = React.useState('')
  const [sortKeyValue2, setSortKeyValue2] = React.useState('')
  const [sortDescending, setSortDescending] = React.useState(false)
  const [filters, setFilters] = React.useState<ScanQueryFilter[]>([])
  const [limit] = React.useState<number>(50)

  // Multi-attribute key state
  const [partitionKeyValues, setPartitionKeyValues] = React.useState<KeyAttributeValue[]>([
    { attributeName: '', value: '', type: 'S' },
  ])
  const [sortKeyConditions, setSortKeyConditions] = React.useState<
    {
      attributeName: string
      operator: 'EQ' | 'LE' | 'LT' | 'GE' | 'GT' | 'BETWEEN' | 'BEGINS_WITH'
      value: string
      value2?: string
      type: 'S' | 'N' | 'B' | 'BOOL' | 'NULL'
    }[]
  >([{ attributeName: '', operator: 'EQ', value: '', type: 'S' }])

  // Results state
  const [results, setResults] = React.useState<ScanQueryResult | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [lastEvaluatedKey, setLastEvaluatedKey] = React.useState<Record<string, unknown> | undefined>()

  // Document editor state
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [editingItem, setEditingItem] = React.useState<Record<string, unknown> | null>(null)
  const [isNewItem, setIsNewItem] = React.useState(false)
  const [deleteConfirm, setDeleteConfirm] = React.useState<number | null>(null)

  // Get current key schema based on selected index
  const currentKeySchema = React.useMemo(() => {
    if (!currentTable) return null
    if (!selectedIndex || selectedIndex === currentTableName) {
      return {
        partitionKey: currentTable.table.partitionKey,
        sortKey: currentTable.table.sortKey,
        partitionKeys: currentTable.table.partitionKeys || [],
        sortKeys: currentTable.table.sortKeys || [],
      }
    }
    const index = currentTable.indexes.find((i) => i.name === selectedIndex)
    return index
      ? {
          partitionKey: index.partitionKey,
          sortKey: index.sortKey,
          partitionKeys: index.partitionKeys || [],
          sortKeys: index.sortKeys || [],
        }
      : null
  }, [currentTable, selectedIndex, currentTableName])

  // Build index options
  const indexOptions = React.useMemo(() => {
    if (!currentTable) return []
    const options = [{ value: currentTableName || '', label: `Table - ${currentTableName}` }]
    currentTable.indexes.forEach((index) => {
      options.push({
        value: index.name,
        label: `${index.type} - ${index.name}`,
      })
    })
    return options
  }, [currentTable, currentTableName])

  // Set default index
  React.useEffect(() => {
    if (currentTableName && !selectedIndex) {
      setSelectedIndex(currentTableName)
    }
  }, [currentTableName, selectedIndex])

  // Sync partition and sort key values with the selected index's schema
  React.useEffect(() => {
    if (currentKeySchema && mode === 'query') {
      // Initialize partition key values based on schema
      const pkKeys = currentKeySchema.partitionKeys
      if (pkKeys && pkKeys.length > 0) {
        setPartitionKeyValues(
          pkKeys.map((key) => ({
            attributeName: key.name,
            value: '',
            type: key.type as 'S' | 'N' | 'B' | 'BOOL' | 'NULL',
          }))
        )
      } else {
        // Fallback to empty state if no multi-attribute keys
        setPartitionKeyValues([{ attributeName: '', value: '', type: 'S' }])
      }

      // Initialize sort key conditions based on schema
      const skKeys = currentKeySchema.sortKeys
      if (skKeys && skKeys.length > 0) {
        setSortKeyConditions(
          skKeys.map((key) => ({
            attributeName: key.name,
            operator: 'EQ' as const,
            value: '',
            type: key.type as 'S' | 'N' | 'B' | 'BOOL' | 'NULL',
          }))
        )
      } else {
        // Fallback to empty state if no multi-attribute keys
        setSortKeyConditions([{ attributeName: '', operator: 'EQ', value: '', type: 'S' }])
      }
    }
  }, [selectedIndex, currentKeySchema, mode])

  const addFilter = () => {
    setFilters([...filters, { attributeName: '', condition: 'EQ', type: 'S', value: '' }])
  }

  const updateFilter = (index: number, filter: ScanQueryFilter) => {
    const newFilters = [...filters]
    newFilters[index] = filter
    setFilters(newFilters)
  }

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index))
  }

  const updatePartitionKeyValue = (index: number, keyValue: KeyAttributeValue) => {
    const newValues = [...partitionKeyValues]
    newValues[index] = keyValue
    setPartitionKeyValues(newValues)
  }

  const updateSortKeyCondition = (
    index: number,
    sortCondition: {
      attributeName: string
      operator: 'EQ' | 'LE' | 'LT' | 'GE' | 'GT' | 'BETWEEN' | 'BEGINS_WITH'
      value: string
      value2?: string
      type: 'S' | 'N' | 'B' | 'BOOL' | 'NULL'
    }
  ) => {
    const newConditions = [...sortKeyConditions]
    newConditions[index] = sortCondition
    setSortKeyConditions(newConditions)
  }

  const resetForm = () => {
    setMode('scan')
    setSelectedIndex(currentTableName || '')
    setProjectionType('ALL')
    setPartitionKeyValue('')
    setSortKeyOperator('EQ')
    setSortKeyValue('')
    setSortKeyValue2('')
    setSortDescending(false)
    setFilters([])
    // Reset will re-trigger the useEffect to populate from schema
    setPartitionKeyValues([{ attributeName: '', value: '', type: 'S' }])
    setSortKeyConditions([{ attributeName: '', operator: 'EQ', value: '', type: 'S' }])
    setResults(null)
    setError(null)
    setLastEvaluatedKey(undefined)
  }

  const executeQuery = async (loadMore = false) => {
    if (!currentTableName) return

    setIsLoading(true)
    setError(null)

    try {
      // Ensure we're using the correct AWS session for this tab
      // The singleton service might be connected to a different profile/region
      if (connectionInfo) {
        try {
          await window.conveyor.dynamodb.connect(selectedProfile, selectedRegion)
        } catch (connectError) {
          throw new Error(`Failed to connect to AWS profile "${selectedProfile}" in region "${selectedRegion}": ${connectError instanceof Error ? connectError.message : 'Unknown error'}`)
        }
      }

      const request: ScanQueryRequest = {
        tableName: currentTableName,
        indexName: selectedIndex !== currentTableName ? selectedIndex : undefined,
        mode,
        projectionType,
        filters: filters.filter((f) => f.attributeName),
        sortDescending,
        limit,
        exclusiveStartKey: loadMore ? lastEvaluatedKey : undefined,
      }

      if (mode === 'query') {
        // Use multi-attribute keys if available, otherwise use legacy single key
        const validPartitionKeyValues = partitionKeyValues.filter((kv) => kv.attributeName && kv.value)
        const validSortKeyConditions = sortKeyConditions.filter((sc) => sc.attributeName && sc.value)

        if (validPartitionKeyValues.length > 0) {
          request.partitionKeyValues = validPartitionKeyValues
        } else if (partitionKeyValue) {
          // Fallback to legacy single partition key
          request.partitionKeyValue = partitionKeyValue
        }

        if (validSortKeyConditions.length > 0) {
          request.sortKeyConditions = validSortKeyConditions
        } else if (sortKeyValue && currentKeySchema?.sortKey) {
          // Fallback to legacy single sort key
          request.sortKeyCondition = {
            operator: sortKeyOperator as 'EQ' | 'LE' | 'LT' | 'GE' | 'GT' | 'BETWEEN' | 'BEGINS_WITH',
            value: sortKeyValue,
            value2: sortKeyOperator === 'BETWEEN' ? sortKeyValue2 : undefined,
          }
        }
      }

      const result = await window.conveyor.dynamodb.scanQuery(request)

      if (loadMore && results) {
        setResults({
          ...result,
          items: [...results.items, ...result.items],
          count: results.count + result.count,
          scannedCount: results.scannedCount + result.scannedCount,
        })
      } else {
        setResults(result)
      }
      setLastEvaluatedKey(result.lastEvaluatedKey)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Query failed')
    } finally {
      setIsLoading(false)
    }
  }

  const copyResultsToClipboard = () => {
    if (results) {
      navigator.clipboard.writeText(JSON.stringify(results.items, null, 2))
    }
  }

  // Document editor handlers
  const handleEditItem = (item: Record<string, unknown>) => {
    setEditingItem(item)
    setIsNewItem(false)
    setEditorOpen(true)
  }

  const handleOpenInNewTab = (item: Record<string, unknown>) => {
    if (!currentTableName) return
    // Get item identifier for title (first key or first attribute)
    const partitionKey = currentTable?.table.partitionKey?.name
    const itemTitle = partitionKey && item[partitionKey] 
      ? `${currentTableName}: ${String(item[partitionKey]).substring(0, MAX_TAB_TITLE_LENGTH)}`
      : `${currentTableName}: Item`
    addTab({
      title: itemTitle,
      type: 'item',
      tableName: currentTableName,
      item: item,
      isNew: false,
    })
  }

  const handleCreateItem = () => {
    setEditingItem(null)
    setIsNewItem(true)
    setEditorOpen(true)
  }

  const handleCloseEditor = () => {
    setEditorOpen(false)
    setEditingItem(null)
    setIsNewItem(false)
  }

  const handleSaveItem = async (item: Record<string, unknown>) => {
    if (!currentTableName) throw new Error('No table selected')
    // Ensure we're using the correct AWS session for this tab
    if (connectionInfo) {
      try {
        await window.conveyor.dynamodb.connect(selectedProfile, selectedRegion)
      } catch (connectError) {
        throw new Error(`Failed to connect to AWS profile "${selectedProfile}" in region "${selectedRegion}": ${connectError instanceof Error ? connectError.message : 'Unknown error'}`)
      }
    }
    await window.conveyor.dynamodb.putItem(currentTableName, item)
    // Refresh results after saving
    await executeQuery()
  }

  const handleDeleteItem = async (item: Record<string, unknown>, index: number) => {
    if (!currentTableName || !currentTable) return

    // Show delete confirmation
    if (deleteConfirm !== index) {
      setDeleteConfirm(index)
      return
    }

    // Build the key from the item using the table's key schema
    const key: Record<string, unknown> = {}
    if (currentTable.table.partitionKey) {
      key[currentTable.table.partitionKey.name] = item[currentTable.table.partitionKey.name]
    }
    if (currentTable.table.sortKey) {
      key[currentTable.table.sortKey.name] = item[currentTable.table.sortKey.name]
    }

    try {
      // Ensure we're using the correct AWS session for this tab
      if (connectionInfo) {
        try {
          await window.conveyor.dynamodb.connect(selectedProfile, selectedRegion)
        } catch (connectError) {
          throw new Error(`Failed to connect to AWS profile "${selectedProfile}" in region "${selectedRegion}": ${connectError instanceof Error ? connectError.message : 'Unknown error'}`)
        }
      }
      await window.conveyor.dynamodb.deleteItem(currentTableName, key)
      // Remove from local results
      if (results) {
        setResults({
          ...results,
          items: results.items.filter((_, i) => i !== index),
          count: results.count - 1,
        })
      }
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  // Reset delete confirmation when clicking elsewhere
  React.useEffect(() => {
    if (deleteConfirm !== null) {
      const handler = () => setDeleteConfirm(null)
      const timeout = setTimeout(handler, 3000) // Auto-reset after 3 seconds
      return () => clearTimeout(timeout)
    }
    return undefined
  }, [deleteConfirm])

  if (!currentTable) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Query Builder */}
      <div className="border-b border-border/50 px-5 py-4 space-y-3 bg-card/20 max-h-[50vh] overflow-y-auto shrink-0">
        <Collapsible title={<span className="text-primary font-medium text-sm">Scan or query items</span>} defaultOpen>
          <div className="space-y-4">
            {/* Mode Toggle */}
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'scan' | 'query')}>
              <RadioGroupItem value="scan" label="Scan" className="w-28 h-8 text-xs" />
              <RadioGroupItem value="query" label="Query" className="w-28 h-8 text-xs" />
            </RadioGroup>

            {/* Table/Index Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wide">Table or Index</label>
                <Select
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(e.target.value)}
                  options={indexOptions}
                  className="h-8 text-xs"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block text-muted-foreground uppercase tracking-wide">Attribute Projection</label>
                <Select
                  value={projectionType}
                  onChange={(e) => setProjectionType(e.target.value as typeof projectionType)}
                  options={PROJECTION_TYPES}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Query Mode: Key Conditions */}
            {mode === 'query' && currentKeySchema && (
              <div className="space-y-4 pt-4 border-t border-border/30">
                {/* Multi-Attribute Partition Key */}
                <div className="bg-muted/20 rounded-md p-3 border border-border/30">
                  <label className="text-xs font-medium mb-2 block text-foreground">
                    Partition key
                    {currentKeySchema.partitionKeys && currentKeySchema.partitionKeys.length > 1 && (
                      <span className="text-muted-foreground text-xs ml-2 font-normal">
                        (multi-attribute - see{' '}
                        <a
                          href="https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.DesignPattern.MultiAttributeKeys.html"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline hover:text-primary/80"
                        >
                          AWS docs
                        </a>
                        )
                      </span>
                    )}
                  </label>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground/70 uppercase tracking-wide">
                      <div className="flex-1">Attribute</div>
                      <div className="flex-1">Value</div>
                    </div>
                    {partitionKeyValues.map((keyValue, index) => (
                      <PartitionKeyRow
                        key={index}
                        keyValue={keyValue}
                        index={index}
                        onChange={updatePartitionKeyValue}
                        onRemove={() => {}}
                        canRemove={false}
                      />
                    ))}
                  </div>
                </div>

                {/* Multi-Attribute Sort Key */}
                {sortKeyConditions.length > 0 && sortKeyConditions[0].attributeName && (
                  <div className="bg-muted/20 rounded-md p-3 border border-border/30">
                    <label className="text-xs font-medium mb-2 block text-foreground">
                      Sort key <span className="text-muted-foreground italic font-normal">— optional</span>
                      {currentKeySchema.sortKeys && currentKeySchema.sortKeys.length > 1 && (
                        <span className="text-muted-foreground text-xs ml-2 font-normal">(multi-attribute)</span>
                      )}
                    </label>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/70 uppercase tracking-wide">
                        <div className="w-36">Attribute</div>
                        <div className="w-40">Condition</div>
                        <div className="flex-1">Value</div>
                      </div>
                      {sortKeyConditions.map((sortCondition, index) => (
                        <SortKeyRow
                          key={index}
                          sortCondition={sortCondition}
                          index={index}
                          onChange={updateSortKeyCondition}
                          onRemove={() => {}}
                          canRemove={false}
                        />
                      ))}
                      <div className="flex items-center gap-2 pt-2">
                        <Checkbox checked={sortDescending} onCheckedChange={(checked) => setSortDescending(checked)} />
                        <label className="text-xs text-muted-foreground">Sort descending</label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Collapsible>

        {/* Filters */}
        <Collapsible
          title={
            <span className="text-primary font-medium text-sm">
              Filters <span className="text-muted-foreground italic font-normal text-xs">— optional</span>
            </span>
          }
        >
          <div className="space-y-1">
            {filters.map((filter, index) => (
              <FilterRow key={index} filter={filter} index={index} onChange={updateFilter} onRemove={removeFilter} />
            ))}
            <Button variant="ghost" size="sm" onClick={addFilter} className="h-7 text-xs text-muted-foreground hover:text-foreground mt-1">
              <Plus className="h-3.5 w-3.5" />
              Add filter
            </Button>
          </div>
        </Collapsible>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={() => executeQuery()}
            disabled={
              isLoading ||
              (mode === 'query' &&
                !partitionKeyValue &&
                partitionKeyValues.filter((kv) => kv.attributeName && kv.value).length === 0)
            }
            size="sm"
            className="h-8"
          >
            {isLoading ? (
              <>
                <Spinner className="h-3.5 w-3.5" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run
              </>
            )}
          </Button>
          <Button variant="outline" onClick={resetForm} size="sm" className="h-8">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-3 border-b border-border/50">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {results && (
          <div className="px-5 py-4">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-medium">Items returned: <span className="text-primary tabular-nums">{results.count}</span></h3>
                <Badge variant="outline" className="text-xs">Scanned: {results.scannedCount}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCreateItem} className="h-7 text-xs">
                  <FilePlus className="h-3.5 w-3.5" />
                  Create item
                </Button>
                <Button variant="ghost" size="sm" onClick={copyResultsToClipboard} className="h-7 text-xs text-muted-foreground hover:text-foreground">
                  <Copy className="h-3.5 w-3.5" />
                  Copy JSON
                </Button>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-2">
              {results.items.map((item, index) => (
                <div
                  key={index}
                  className="border border-border/40 rounded-md p-3 bg-card/50 hover:bg-muted/30 hover:border-border/60 transition-all group relative"
                >
                  {/* Item actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleOpenInNewTab(item)}
                      title="Open in new tab"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEditItem(item)}
                      title="Edit item"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant={deleteConfirm === index ? 'destructive' : 'ghost'}
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteItem(item, index)}
                      title={deleteConfirm === index ? 'Click again to confirm' : 'Delete item'}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <JsonTreeView data={item} />
                </div>
              ))}
            </div>

            {/* Load More */}
            {lastEvaluatedKey && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => executeQuery(true)} disabled={isLoading} size="sm" className="h-8">
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}

        {!results && !isLoading && !error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[200px]">
            <div className="text-muted-foreground">
              <p className="text-sm mb-1">Configure your {mode === 'scan' ? 'scan' : 'query'} and click Run to see results.</p>
              {mode === 'query' && (
                <p className="text-xs text-muted-foreground/70">Query requires at least one partition key attribute with a value.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Document Editor Modal */}
      <DocumentEditor
        isOpen={editorOpen}
        onClose={handleCloseEditor}
        tableName={currentTableName || ''}
        item={editingItem}
        onSave={handleSaveItem}
        isNew={isNewItem}
      />
    </div>
  )
}
