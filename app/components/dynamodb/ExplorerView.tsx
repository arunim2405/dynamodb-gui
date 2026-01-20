import * as React from 'react'
import { useDynamoDB } from './DynamoDBContext'
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
import { Play, Plus, X, RotateCcw, ChevronDown, ChevronRight, Copy, Pencil, Trash2, FilePlus } from 'lucide-react'
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
    <div className="flex items-center gap-2 py-2">
      <Input
        placeholder="Attribute name"
        value={filter.attributeName}
        onChange={(e) => onChange(index, { ...filter, attributeName: e.target.value })}
        className="w-40"
      />
      <Select
        value={filter.condition}
        onChange={(e) => onChange(index, { ...filter, condition: e.target.value as ScanQueryFilter['condition'] })}
        options={FILTER_CONDITIONS}
        className="w-44"
      />
      <Select
        value={filter.type}
        onChange={(e) => onChange(index, { ...filter, type: e.target.value as ScanQueryFilter['type'] })}
        options={ATTRIBUTE_TYPES}
        className="w-28"
      />
      {needsValue && (
        <Input
          placeholder="Value"
          value={filter.value}
          onChange={(e) => onChange(index, { ...filter, value: e.target.value })}
          className="w-40"
        />
      )}
      {needsSecondValue && (
        <>
          <span className="text-muted-foreground text-sm">and</span>
          <Input
            placeholder="Value 2"
            value={filter.value2 || ''}
            onChange={(e) => onChange(index, { ...filter, value2: e.target.value })}
            className="w-40"
          />
        </>
      )}
      <Button variant="outline" size="icon" onClick={() => onRemove(index)}>
        <X className="h-4 w-4" />
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
    <div className="flex items-center gap-2 py-2">
      <div className="w-40">
        <Input
          placeholder="Attribute name"
          value={keyValue.attributeName}
          onChange={(e) => onChange(index, { ...keyValue, attributeName: e.target.value })}
        />
      </div>
      <div className="flex-1">
        <Input
          placeholder="Enter attribute value"
          value={keyValue.value}
          onChange={(e) => onChange(index, { ...keyValue, value: e.target.value })}
        />
      </div>
      <div className="w-28">
        <Select
          value={keyValue.type}
          onChange={(e) => onChange(index, { ...keyValue, type: e.target.value as KeyAttributeValue['type'] })}
          options={ATTRIBUTE_TYPES}
        />
      </div>
      {canRemove && (
        <Button variant="outline" size="icon" onClick={() => onRemove(index)}>
          <X className="h-4 w-4" />
        </Button>
      )}
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
    <div className="flex items-center gap-2 py-2">
      <div className="w-40">
        <Input
          placeholder="Attribute name"
          value={sortCondition.attributeName}
          onChange={(e) => onChange(index, { ...sortCondition, attributeName: e.target.value })}
        />
      </div>
      <div className="w-44">
        <Select
          value={sortCondition.operator}
          onChange={(e) =>
            onChange(index, {
              ...sortCondition,
              operator: e.target.value as SortKeyRowProps['sortCondition']['operator'],
            })
          }
          options={SORT_KEY_OPERATORS}
        />
      </div>
      <div className="flex-1">
        <Input
          placeholder="Enter attribute value"
          value={sortCondition.value}
          onChange={(e) => onChange(index, { ...sortCondition, value: e.target.value })}
        />
      </div>
      {needsSecondValue && (
        <>
          <span className="text-muted-foreground text-sm">and</span>
          <div className="flex-1">
            <Input
              placeholder="Value 2"
              value={sortCondition.value2 || ''}
              onChange={(e) => onChange(index, { ...sortCondition, value2: e.target.value })}
            />
          </div>
        </>
      )}
      <div className="w-28">
        <Select
          value={sortCondition.type}
          onChange={(e) =>
            onChange(index, { ...sortCondition, type: e.target.value as SortKeyRowProps['sortCondition']['type'] })
          }
          options={ATTRIBUTE_TYPES}
        />
      </div>
      {canRemove && (
        <Button variant="outline" size="icon" onClick={() => onRemove(index)}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}

interface JsonTreeViewProps {
  data: Record<string, unknown>
  level?: number
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
      return <span className="text-muted-foreground italic">null</span>
    }

    if (typeof value === 'boolean') {
      return <span className="text-blue-500">{value.toString()}</span>
    }

    if (typeof value === 'number') {
      return <span className="text-green-500">{value}</span>
    }

    if (typeof value === 'string') {
      return <span className="text-amber-500">"{value}"</span>
    }

    if (Array.isArray(value)) {
      const isExpanded = expanded.has(key)
      return (
        <div>
          <button onClick={() => toggleExpand(key)} className="flex items-center gap-1 hover:bg-muted/50 rounded px-1">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="text-muted-foreground">Array [{value.length}]</span>
          </button>
          {isExpanded && (
            <div className="ml-4 border-l pl-2">
              {value.map((item, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-muted-foreground">{i}:</span>
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
          <button onClick={() => toggleExpand(key)} className="flex items-center gap-1 hover:bg-muted/50 rounded px-1">
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span className="text-muted-foreground">Object</span>
          </button>
          {isExpanded && (
            <div className="ml-4 border-l pl-2">
              <JsonTreeView data={value as Record<string, unknown>} level={level + 1} />
            </div>
          )}
        </div>
      )
    }

    return <span>{String(value)}</span>
  }

  return (
    <div className="font-mono text-xs space-y-1">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <span className="text-purple-500 shrink-0">{key}:</span>
          {renderValue(key, value)}
        </div>
      ))}
    </div>
  )
}

export function ExplorerView() {
  const { currentTable, currentTableName } = useDynamoDB()

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
      }
    }
    const index = currentTable.indexes.find((i) => i.name === selectedIndex)
    return index ? { partitionKey: index.partitionKey, sortKey: index.sortKey } : null
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

  // Multi-attribute key handlers
  const addPartitionKeyValue = () => {
    if (partitionKeyValues.length < 4) {
      setPartitionKeyValues([...partitionKeyValues, { attributeName: '', value: '', type: 'S' }])
    }
  }

  const updatePartitionKeyValue = (index: number, keyValue: KeyAttributeValue) => {
    const newValues = [...partitionKeyValues]
    newValues[index] = keyValue
    setPartitionKeyValues(newValues)
  }

  const removePartitionKeyValue = (index: number) => {
    setPartitionKeyValues(partitionKeyValues.filter((_, i) => i !== index))
  }

  const addSortKeyCondition = () => {
    if (sortKeyConditions.length < 4) {
      setSortKeyConditions([...sortKeyConditions, { attributeName: '', operator: 'EQ', value: '', type: 'S' }])
    }
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

  const removeSortKeyCondition = (index: number) => {
    setSortKeyConditions(sortKeyConditions.filter((_, i) => i !== index))
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
      <div className="border-b p-4 space-y-4">
        <Collapsible title={<span className="text-primary font-medium">Scan or query items</span>} defaultOpen>
          <div className="space-y-4">
            {/* Mode Toggle */}
            <RadioGroup value={mode} onValueChange={(v) => setMode(v as 'scan' | 'query')}>
              <RadioGroupItem value="scan" label="Scan" className="w-32" />
              <RadioGroupItem value="query" label="Query" className="w-32" />
            </RadioGroup>

            {/* Table/Index Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Select a table or index</label>
                <Select
                  value={selectedIndex}
                  onChange={(e) => setSelectedIndex(e.target.value)}
                  options={indexOptions}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Select attribute projection</label>
                <Select
                  value={projectionType}
                  onChange={(e) => setProjectionType(e.target.value as typeof projectionType)}
                  options={PROJECTION_TYPES}
                />
              </div>
            </div>

            {/* Query Mode: Key Conditions */}
            {mode === 'query' && currentKeySchema && (
              <div className="space-y-4 pt-4 border-t">
                {/* Multi-Attribute Partition Key */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Partition key
                    <span className="text-muted-foreground text-xs ml-2 font-normal">
                      (up to 4 attributes - see{' '}
                      <a
                        href="https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/GSI.DesignPattern.MultiAttributeKeys.html"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        AWS docs
                      </a>
                      )
                    </span>
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-40">Attribute</div>
                      <div className="flex-1">Value</div>
                      <div className="w-28">Type</div>
                      <div className="w-10"></div>
                    </div>
                    {partitionKeyValues.map((keyValue, index) => (
                      <PartitionKeyRow
                        key={index}
                        keyValue={keyValue}
                        index={index}
                        onChange={updatePartitionKeyValue}
                        onRemove={removePartitionKeyValue}
                        canRemove={partitionKeyValues.length > 1}
                      />
                    ))}
                    {partitionKeyValues.length < 4 && (
                      <Button variant="outline" size="sm" onClick={addPartitionKeyValue}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add partition key attribute
                      </Button>
                    )}
                  </div>
                </div>

                {/* Multi-Attribute Sort Key */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Sort key - <span className="text-muted-foreground italic">optional</span>
                    <span className="text-muted-foreground text-xs ml-2 font-normal">(up to 4 attributes)</span>
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-40">Attribute</div>
                      <div className="w-44">Condition</div>
                      <div className="flex-1">Value</div>
                      <div className="w-28">Type</div>
                      <div className="w-10"></div>
                    </div>
                    {sortKeyConditions.map((sortCondition, index) => (
                      <SortKeyRow
                        key={index}
                        sortCondition={sortCondition}
                        index={index}
                        onChange={updateSortKeyCondition}
                        onRemove={removeSortKeyCondition}
                        canRemove={sortKeyConditions.length > 1}
                      />
                    ))}
                    {sortKeyConditions.length < 4 && (
                      <Button variant="outline" size="sm" onClick={addSortKeyCondition}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add sort key attribute
                      </Button>
                    )}
                    <div className="flex items-center gap-2 pt-2">
                      <Checkbox checked={sortDescending} onCheckedChange={(checked) => setSortDescending(checked)} />
                      <label className="text-sm">Sort descending</label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Collapsible>

        {/* Filters */}
        <Collapsible
          title={
            <span className="text-primary font-medium">
              Filters - <span className="text-muted-foreground italic">optional</span>
            </span>
          }
        >
          <div className="space-y-2">
            {filters.map((filter, index) => (
              <FilterRow key={index} filter={filter} index={index} onChange={updateFilter} onRemove={removeFilter} />
            ))}
            <Button variant="outline" size="sm" onClick={addFilter}>
              <Plus className="h-4 w-4 mr-1" />
              Add filter
            </Button>
          </div>
        </Collapsible>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button
            onClick={() => executeQuery()}
            disabled={
              isLoading ||
              (mode === 'query' &&
                !partitionKeyValue &&
                partitionKeyValues.filter((kv) => kv.attributeName && kv.value).length === 0)
            }
          >
            {isLoading ? (
              <>
                <Spinner className="h-4 w-4 mr-1" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Run
              </>
            )}
          </Button>
          <Button variant="outline" onClick={resetForm}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 border-b">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {results && (
          <div className="p-4">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h3 className="font-medium">Items returned: {results.count}</h3>
                <Badge variant="outline">Scanned: {results.scannedCount}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleCreateItem}>
                  <FilePlus className="h-4 w-4 mr-1" />
                  Create item
                </Button>
                <Button variant="outline" size="sm" onClick={copyResultsToClipboard}>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy JSON
                </Button>
              </div>
            </div>

            {/* Results List */}
            <div className="space-y-2">
              {results.items.map((item, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-3 bg-card hover:bg-muted/50 transition-colors group relative"
                >
                  {/* Item actions */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleEditItem(item)}
                      title="Edit item"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant={deleteConfirm === index ? 'destructive' : 'ghost'}
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => handleDeleteItem(item, index)}
                      title={deleteConfirm === index ? 'Click again to confirm' : 'Delete item'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <JsonTreeView data={item} />
                </div>
              ))}
            </div>

            {/* Load More */}
            {lastEvaluatedKey && (
              <div className="mt-4 text-center">
                <Button variant="outline" onClick={() => executeQuery(true)} disabled={isLoading}>
                  {isLoading ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </div>
        )}

        {!results && !isLoading && !error && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-muted-foreground">
              <p className="mb-2">Configure your {mode === 'scan' ? 'scan' : 'query'} and click Run to see results.</p>
              {mode === 'query' && (
                <p className="text-sm">Query requires at least one partition key attribute with a value.</p>
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
