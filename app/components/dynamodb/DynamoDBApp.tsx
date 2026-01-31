import * as React from 'react'
import { DynamoDBProvider, useDynamoDB } from './DynamoDBContext'
import { TabsProvider, useTabs } from './TabsContext'
import { TabBar } from './TabBar'
import { ConnectionHeader } from './ConnectionHeader'
import { TablesView } from './TablesView'
import { ExplorerView } from './ExplorerView'
import { DocumentEditor } from './DocumentEditor'

function TabContent() {
  const { currentView, currentTableName } = useDynamoDB()
  const { tabs, activeTabId } = useTabs()

  const activeTab = tabs.find((t) => t.id === activeTabId)

  // Render item tab content
  if (activeTab?.type === 'item') {
    return (
      <ItemTabView
        tableName={activeTab.tableName || ''}
        item={activeTab.item || null}
        isNew={activeTab.isNew}
      />
    )
  }

  // Render normal content based on context
  return (
    <>
      {currentView === 'tables' && <TablesView />}
      {currentView === 'explorer' && <ExplorerView />}
    </>
  )
}

interface ItemTabViewProps {
  tableName: string
  item: Record<string, unknown> | null
  isNew?: boolean
}

function ItemTabView({ tableName, item, isNew }: ItemTabViewProps) {
  const { removeTab, activeTabId } = useTabs()

  const handleSave = async (updatedItem: Record<string, unknown>) => {
    await window.conveyor.dynamodb.putItem(tableName, updatedItem)
  }

  const handleClose = () => {
    removeTab(activeTabId)
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4">
      <DocumentEditor
        isOpen={true}
        onClose={handleClose}
        tableName={tableName}
        item={item}
        onSave={handleSave}
        isNew={isNew}
        inline={true}
      />
    </div>
  )
}

function DynamoDBContent() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ConnectionHeader />
      <TabBar />
      <TabContent />
    </div>
  )
}

export function DynamoDBApp() {
  return (
    <TabsProvider>
      <DynamoDBProvider>
        <DynamoDBContent />
      </DynamoDBProvider>
    </TabsProvider>
  )
}
