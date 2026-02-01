import * as React from 'react'
import { useTabs, SessionTab } from './TabsContext'
import { Button } from '@/app/components/ui/button'
import { X, Plus, Database, Table, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

export function TabBar() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTabs()

  const handleNewTab = () => {
    addTab({ title: 'New Session', type: 'tables' })
  }

  const getTabIcon = (tab: SessionTab) => {
    switch (tab.type) {
      case 'tables':
        return <Database className="h-3 w-3" />
      case 'explorer':
        return <Table className="h-3 w-3" />
      case 'item':
        return <FileText className="h-3 w-3" />
    }
  }

  const getTabTitle = (tab: SessionTab) => {
    // Show profile info in tab title for better identification
    const profile = tab.sessionState?.connectionInfo?.profile
    const region = tab.sessionState?.connectionInfo?.region
    if (profile && region) {
      if (tab.type === 'explorer' && tab.tableName) {
        return `${tab.tableName} (${profile})`
      }
      return `${profile} - ${region}`
    }
    return tab.title
  }

  return (
    <div className="flex items-center bg-card/50 border-b border-border/50 px-1 h-9 shrink-0 overflow-x-auto">
      <div className="flex items-center gap-0.5 min-w-0 flex-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              'group flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-t-md cursor-pointer transition-colors min-w-0 max-w-[200px]',
              activeTabId === tab.id
                ? 'bg-background text-foreground border-t border-l border-r border-border/50'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}
            onClick={() => setActiveTab(tab.id)}
          >
            {getTabIcon(tab)}
            <span className="truncate">{getTabTitle(tab)}</span>
            {tabs.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeTab(tab.id)
                }}
                className="opacity-0 group-hover:opacity-100 hover:bg-muted/50 rounded p-0.5 transition-opacity ml-1"
                title="Close tab"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleNewTab}
        className="h-6 w-6 ml-1 text-muted-foreground hover:text-foreground shrink-0"
        title="New tab"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
