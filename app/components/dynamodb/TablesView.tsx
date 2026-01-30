import * as React from 'react'
import { useDynamoDB } from './DynamoDBContext'
import { Input } from '@/app/components/ui/input'
import { Button } from '@/app/components/ui/button'
import { Badge } from '@/app/components/ui/badge'
import { Spinner } from '@/app/components/ui/spinner'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '@/app/components/ui/dropdown-menu'
import { Search, Plus, ChevronDown, Star, StarOff, Shield, ShieldOff, ArrowUpDown } from 'lucide-react'
import type { TableInfo } from '@/lib/services/dynamodb-service'

type SortField = 'name' | 'status' | 'gsiCount' | 'capacityMode'
type SortDirection = 'asc' | 'desc'

export function TablesView() {
  const { tables, isLoadingTables, tablesError, connectionInfo, selectTable, connect } = useDynamoDB()
  const [searchQuery, setSearchQuery] = React.useState('')
  const [sortField, setSortField] = React.useState<SortField>('name')
  const [sortDirection, setSortDirection] = React.useState<SortDirection>('asc')
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set())

  // Filter and sort tables
  const filteredTables = React.useMemo(() => {
    const result = tables.filter((table) => table.name.toLowerCase().includes(searchQuery.toLowerCase()))

    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name)
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        case 'gsiCount':
          comparison = a.gsiCount + a.lsiCount - (b.gsiCount + b.lsiCount)
          break
        case 'capacityMode':
          comparison = a.capacityMode.localeCompare(b.capacityMode)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })

    // Sort favorites to top
    result.sort((a, b) => {
      const aFav = favorites.has(a.name) ? 0 : 1
      const bFav = favorites.has(b.name) ? 0 : 1
      return aFav - bFav
    })

    return result
  }, [tables, searchQuery, sortField, sortDirection, favorites])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const toggleFavorite = (tableName: string) => {
    setFavorites((prev) => {
      const next = new Set(prev)
      if (next.has(tableName)) {
        next.delete(tableName)
      } else {
        next.add(tableName)
      }
      return next
    })
  }

  const formatKeyInfo = (table: TableInfo) => {
    const parts: string[] = []
    if (table.partitionKey) {
      parts.push(`${table.partitionKey.name} (${table.partitionKey.type})`)
    }
    return parts.join(' | ')
  }

  const formatSortKeyInfo = (table: TableInfo) => {
    if (table.sortKey) {
      return `${table.sortKey.name} (${table.sortKey.type})`
    }
    return '-'
  }

  if (!connectionInfo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center p-8">
        <div className="p-4 rounded-full bg-muted">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Connect to AWS</h2>
          <p className="text-muted-foreground max-w-md">
            Select your AWS profile and region, then click Connect to view your DynamoDB tables.
          </p>
        </div>
        <Button onClick={connect} size="lg">
          Connect to DynamoDB
        </Button>
      </div>
    )
  }

  if (isLoadingTables) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="h-8 w-8 mb-4" />
          <p className="text-muted-foreground">Loading tables...</p>
        </div>
      </div>
    )
  }

  if (tablesError) {
    return (
      <div className="flex-1 p-6">
        <Alert variant="destructive">
          <AlertDescription>{tablesError}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Toolbar */}
      <div className="flex items-center gap-4 px-5 py-3 border-b border-border/50 shrink-0 bg-card/30">
        <h1 className="text-base font-semibold tracking-tight">Tables ({filteredTables.length})</h1>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Find tables..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-8"
          />
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <DropdownMenu
            trigger={
              <Button variant="outline" size="sm">
                Actions <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-70" />
              </Button>
            }
            align="right"
          >
            <DropdownMenuItem onClick={() => {}}>Create table</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {}} destructive>
              Delete selected
            </DropdownMenuItem>
          </DropdownMenu>

          <Button size="sm">
            <Plus className="h-4 w-4" />
            Create table
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full caption-bottom text-sm">
          <thead className="[&_tr]:border-b sticky top-0 bg-background z-10">
            <tr className="border-b border-border/50 bg-muted/30">
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider w-12"></th>
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
                <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  Name
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </button>
              </th>
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
                <button onClick={() => toggleSort('status')} className="flex items-center gap-1.5 hover:text-foreground transition-colors">
                  Status
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </button>
              </th>
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Partition Key</th>
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Sort Key</th>
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
                <button
                  onClick={() => toggleSort('gsiCount')}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  Indexes
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </button>
              </th>
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Replication</th>
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Protection</th>
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">Favorite</th>
              <th className="h-9 px-4 text-left align-middle font-medium text-muted-foreground text-xs uppercase tracking-wider">
                <button
                  onClick={() => toggleSort('capacityMode')}
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  Capacity
                  <ArrowUpDown className="h-3 w-3 opacity-50" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="[&_tr:last-child]:border-0">
            {filteredTables.length === 0 ? (
              <tr className="border-b border-border/30">
                <td colSpan={10} className="p-4 h-24 text-center text-muted-foreground">
                  {searchQuery ? 'No tables match your search.' : 'No tables found.'}
                </td>
              </tr>
            ) : (
              filteredTables.map((table, index) => (
                <tr
                  key={table.name}
                  className={`border-b border-border/30 transition-colors hover:bg-accent/50 cursor-pointer ${
                    index % 2 === 0 ? 'bg-transparent' : 'bg-muted/20'
                  }`}
                >
                  <td className="px-4 py-2.5 align-middle">
                    <input type="checkbox" className="rounded border-border" />
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <button
                      onClick={() => selectTable(table.name)}
                      className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                    >
                      {table.name}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <Badge variant={table.status === 'ACTIVE' ? 'default' : 'secondary'}>{table.status}</Badge>
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted/50 text-primary/90">{formatKeyInfo(table)}</code>
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    {formatSortKeyInfo(table) !== '-' ? (
                      <code className="font-mono text-xs px-1.5 py-0.5 rounded bg-muted/50 text-primary/90">{formatSortKeyInfo(table)}</code>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-middle text-center">
                    <span className="tabular-nums">{table.gsiCount + table.lsiCount}</span>
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    {table.replicationRegions.length > 0 ? (
                      <Badge variant="outline">{table.replicationRegions.length} Region(s)</Badge>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    {table.deletionProtection ? (
                      <div className="flex items-center gap-1.5 text-success">
                        <Shield className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">On</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground/60">
                        <ShieldOff className="h-3.5 w-3.5" />
                        <span className="text-xs">Off</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(table.name)
                      }}
                      className="hover:text-warning transition-colors p-1 rounded hover:bg-muted/50"
                    >
                      {favorites.has(table.name) ? (
                        <Star className="h-4 w-4 fill-warning text-warning" />
                      ) : (
                        <StarOff className="h-4 w-4 text-muted-foreground/50" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 align-middle">
                    <Badge variant="outline">{table.capacityMode === 'ON_DEMAND' ? 'On-demand' : 'Provisioned'}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-5 py-2 text-xs text-muted-foreground shrink-0 bg-card/30">
        Showing {filteredTables.length} of {tables.length} tables
      </div>
    </div>
  )
}
