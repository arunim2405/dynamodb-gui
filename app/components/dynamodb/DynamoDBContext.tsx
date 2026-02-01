import * as React from 'react'
import type { TableInfo, TableDetails, ConnectionInfo, AWSProfile, ScanQueryResult } from '@/lib/services/dynamodb-service'
import { useTabs } from './TabsContext'
import type { ViewType } from './TabsContext'

// AWS Regions list
export const AWS_REGIONS = [
  { value: 'us-east-1', label: 'US East (N. Virginia)' },
  { value: 'us-east-2', label: 'US East (Ohio)' },
  { value: 'us-west-1', label: 'US West (N. California)' },
  { value: 'us-west-2', label: 'US West (Oregon)' },
  { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
  { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)' },
  { value: 'ap-northeast-2', label: 'Asia Pacific (Seoul)' },
  { value: 'ap-northeast-3', label: 'Asia Pacific (Osaka)' },
  { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  { value: 'ap-southeast-2', label: 'Asia Pacific (Sydney)' },
  { value: 'ca-central-1', label: 'Canada (Central)' },
  { value: 'eu-central-1', label: 'Europe (Frankfurt)' },
  { value: 'eu-west-1', label: 'Europe (Ireland)' },
  { value: 'eu-west-2', label: 'Europe (London)' },
  { value: 'eu-west-3', label: 'Europe (Paris)' },
  { value: 'eu-north-1', label: 'Europe (Stockholm)' },
  { value: 'sa-east-1', label: 'South America (São Paulo)' },
]

interface DynamoDBContextValue {
  // Connection state (from active tab)
  profiles: AWSProfile[]
  selectedProfile: string
  selectedRegion: string
  connectionInfo: ConnectionInfo | null
  isConnecting: boolean
  connectionError: string | null

  // Tables state (from active tab)
  tables: TableInfo[]
  isLoadingTables: boolean
  tablesError: string | null

  // Current table exploration (from active tab)
  currentTable: TableDetails | null
  currentTableName: string | null

  // View state (from active tab)
  currentView: ViewType

  // Query results (from active tab)
  queryResults: ScanQueryResult | null
  lastEvaluatedKey: Record<string, unknown> | undefined

  // Actions
  setSelectedProfile: (profile: string) => void
  setSelectedRegion: (region: string) => void
  connect: () => Promise<void>
  refreshTables: () => Promise<void>
  selectTable: (tableName: string) => Promise<void>
  setCurrentView: (view: ViewType) => void
  goBack: () => void
  setQueryResults: (results: ScanQueryResult | null, lastKey?: Record<string, unknown>) => void
  clearQueryResults: () => void
}

const DynamoDBContext = React.createContext<DynamoDBContextValue | undefined>(undefined)

export function useDynamoDB() {
  const context = React.useContext(DynamoDBContext)
  if (!context) {
    throw new Error('useDynamoDB must be used within a DynamoDBProvider')
  }
  return context
}

interface DynamoDBProviderProps {
  children: React.ReactNode
}

export function DynamoDBProvider({ children }: DynamoDBProviderProps) {
  // Get tabs context for per-tab state
  const { activeTab, activeTabId, updateTab, updateActiveTabSession } = useTabs()
  
  // Global profiles list (shared across all tabs)
  const [profiles, setProfiles] = React.useState<AWSProfile[]>([])
  
  // Loading/error states (local to context, not persisted per tab)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [connectionError, setConnectionError] = React.useState<string | null>(null)
  const [isLoadingTables, setIsLoadingTables] = React.useState(false)
  const [tablesError, setTablesError] = React.useState<string | null>(null)

  // Get session state from active tab (with fallbacks)
  const sessionState = activeTab?.sessionState || {
    selectedProfile: 'default',
    selectedRegion: 'us-east-1',
    connectionInfo: null,
    tables: [],
    currentTable: null,
    currentTableName: null,
    currentView: 'tables' as ViewType,
    queryResults: null,
    lastEvaluatedKey: undefined,
  }

  // Load profiles on mount only
  React.useEffect(() => {
    const loadProfiles = async () => {
      try {
        const profileList = await window.conveyor.dynamodb.getProfiles()
        setProfiles(profileList)
      } catch (error) {
        console.error('Failed to load profiles:', error)
      }
    }
    loadProfiles()
  }, [])

  const setSelectedProfile = React.useCallback((profile: string) => {
    updateActiveTabSession({ selectedProfile: profile })
  }, [updateActiveTabSession])

  const setSelectedRegion = React.useCallback((region: string) => {
    updateActiveTabSession({ selectedRegion: region })
  }, [updateActiveTabSession])

  const connect = async () => {
    setIsConnecting(true)
    setConnectionError(null)
    try {
      const info = await window.conveyor.dynamodb.connect(
        sessionState.selectedProfile, 
        sessionState.selectedRegion
      )
      updateActiveTabSession({ connectionInfo: info })
      await refreshTablesInternal()
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect')
    } finally {
      setIsConnecting(false)
    }
  }

  const refreshTablesInternal = async () => {
    setIsLoadingTables(true)
    setTablesError(null)
    try {
      const tableList = await window.conveyor.dynamodb.getTablesInfo()
      updateActiveTabSession({ tables: tableList })
    } catch (error) {
      setTablesError(error instanceof Error ? error.message : 'Failed to load tables')
    } finally {
      setIsLoadingTables(false)
    }
  }

  const refreshTables = async () => {
    // Reconnect with the current tab's profile/region before refreshing
    if (sessionState.connectionInfo) {
      await window.conveyor.dynamodb.connect(
        sessionState.selectedProfile, 
        sessionState.selectedRegion
      )
    }
    await refreshTablesInternal()
  }

  const selectTable = async (tableName: string) => {
    try {
      // Ensure we're using the correct profile/region for this tab
      if (sessionState.connectionInfo) {
        await window.conveyor.dynamodb.connect(
          sessionState.selectedProfile, 
          sessionState.selectedRegion
        )
      }
      const details = await window.conveyor.dynamodb.getTableDetails(tableName)
      updateActiveTabSession({
        currentTable: details,
        currentTableName: tableName,
        currentView: 'explorer',
      })
      // Update the tab title and type
      updateTab(activeTabId, { title: tableName, type: 'explorer', tableName })
    } catch (error) {
      console.error('Failed to load table details:', error)
    }
  }

  const setCurrentView = React.useCallback((view: ViewType) => {
    updateActiveTabSession({ currentView: view })
  }, [updateActiveTabSession])

  const goBack = React.useCallback(() => {
    updateActiveTabSession({
      currentView: 'tables',
      currentTable: null,
      currentTableName: null,
      queryResults: null,
      lastEvaluatedKey: undefined,
    })
    // Update the tab to show tables
    updateTab(activeTabId, { title: 'Tables', type: 'tables', tableName: undefined })
  }, [updateActiveTabSession, updateTab, activeTabId])

  const setQueryResults = React.useCallback((results: ScanQueryResult | null, lastKey?: Record<string, unknown>) => {
    updateActiveTabSession({
      queryResults: results,
      lastEvaluatedKey: lastKey,
    })
  }, [updateActiveTabSession])

  const clearQueryResults = React.useCallback(() => {
    updateActiveTabSession({
      queryResults: null,
      lastEvaluatedKey: undefined,
    })
  }, [updateActiveTabSession])

  const value: DynamoDBContextValue = {
    profiles,
    selectedProfile: sessionState.selectedProfile,
    selectedRegion: sessionState.selectedRegion,
    connectionInfo: sessionState.connectionInfo,
    isConnecting,
    connectionError,
    tables: sessionState.tables,
    isLoadingTables,
    tablesError,
    currentTable: sessionState.currentTable,
    currentTableName: sessionState.currentTableName,
    currentView: sessionState.currentView,
    queryResults: sessionState.queryResults,
    lastEvaluatedKey: sessionState.lastEvaluatedKey,
    setSelectedProfile,
    setSelectedRegion,
    connect,
    refreshTables,
    selectTable,
    setCurrentView,
    goBack,
    setQueryResults,
    clearQueryResults,
  }

  return <DynamoDBContext.Provider value={value}>{children}</DynamoDBContext.Provider>
}
