import * as React from 'react'
import { DynamoDBProvider, useDynamoDB } from './DynamoDBContext'
import { ConnectionHeader } from './ConnectionHeader'
import { TablesView } from './TablesView'
import { ExplorerView } from './ExplorerView'

function DynamoDBContent() {
  const { currentView } = useDynamoDB()

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ConnectionHeader />
      {currentView === 'tables' && <TablesView />}
      {currentView === 'explorer' && <ExplorerView />}
    </div>
  )
}

export function DynamoDBApp() {
  return (
    <DynamoDBProvider>
      <DynamoDBContent />
    </DynamoDBProvider>
  )
}
