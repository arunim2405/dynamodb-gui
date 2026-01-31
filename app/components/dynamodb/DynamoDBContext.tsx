import * as React from 'react'
import type { TableInfo, TableDetails, ConnectionInfo, AWSProfile } from '@/lib/services/dynamodb-service'
import { useTabs } from './TabsContext'

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

export type ViewType = 'tables' | 'explorer'

interface DynamoDBContextValue {
  // Connection state
  profiles: AWSProfile[]
  selectedProfile: string
  selectedRegion: string
  connectionInfo: ConnectionInfo | null
  isConnecting: boolean
  connectionError: string | null

  // Tables state
  tables: TableInfo[]
  isLoadingTables: boolean
  tablesError: string | null

  // Current table exploration
  currentTable: TableDetails | null
  currentTableName: string | null

  // View state
  currentView: ViewType

  // Actions
  setSelectedProfile: (profile: string) => void
  setSelectedRegion: (region: string) => void
  connect: () => Promise<void>
  refreshTables: () => Promise<void>
  selectTable: (tableName: string) => Promise<void>
  setCurrentView: (view: ViewType) => void
  goBack: () => void
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
  // Get tabs context for updating tab titles
  const { activeTabId, updateTab } = useTabs()
  
  // Connection state
  const [profiles, setProfiles] = React.useState<AWSProfile[]>([])
  const [selectedProfile, setSelectedProfile] = React.useState('default')
  const [selectedRegion, setSelectedRegion] = React.useState('us-east-1')
  const [connectionInfo, setConnectionInfo] = React.useState<ConnectionInfo | null>(null)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [connectionError, setConnectionError] = React.useState<string | null>(null)

  // Tables state
  const [tables, setTables] = React.useState<TableInfo[]>([])
  const [isLoadingTables, setIsLoadingTables] = React.useState(false)
  const [tablesError, setTablesError] = React.useState<string | null>(null)

  // Current table exploration
  const [currentTable, setCurrentTable] = React.useState<TableDetails | null>(null)
  const [currentTableName, setCurrentTableName] = React.useState<string | null>(null)

  // View state
  const [currentView, setCurrentView] = React.useState<ViewType>('tables')

  // Load profiles on mount
  React.useEffect(() => {
    loadProfiles()
  }, [])

  const loadProfiles = async () => {
    try {
      const profileList = await window.conveyor.dynamodb.getProfiles()
      setProfiles(profileList)
      if (profileList.length > 0) {
        const defaultProfile = profileList.find((p) => p.name === 'default') || profileList[0]
        setSelectedProfile(defaultProfile.name)
        if (defaultProfile.region) {
          setSelectedRegion(defaultProfile.region)
        }
      }
    } catch (error) {
      console.error('Failed to load profiles:', error)
    }
  }

  const connect = async () => {
    setIsConnecting(true)
    setConnectionError(null)
    try {
      const info = await window.conveyor.dynamodb.connect(selectedProfile, selectedRegion)
      setConnectionInfo(info)
      await refreshTables()
    } catch (error) {
      setConnectionError(error instanceof Error ? error.message : 'Failed to connect')
    } finally {
      setIsConnecting(false)
    }
  }

  const refreshTables = async () => {
    setIsLoadingTables(true)
    setTablesError(null)
    try {
      const tableList = await window.conveyor.dynamodb.getTablesInfo()
      setTables(tableList)
    } catch (error) {
      setTablesError(error instanceof Error ? error.message : 'Failed to load tables')
    } finally {
      setIsLoadingTables(false)
    }
  }

  const selectTable = async (tableName: string) => {
    try {
      const details = await window.conveyor.dynamodb.getTableDetails(tableName)
      setCurrentTable(details)
      setCurrentTableName(tableName)
      setCurrentView('explorer')
      // Update the active tab title and type
      updateTab(activeTabId, { title: tableName, type: 'explorer', tableName })
    } catch (error) {
      console.error('Failed to load table details:', error)
    }
  }

  const goBack = () => {
    setCurrentView('tables')
    setCurrentTable(null)
    setCurrentTableName(null)
    // Update the active tab to show tables
    updateTab(activeTabId, { title: 'Tables', type: 'tables', tableName: undefined })
  }

  const value: DynamoDBContextValue = {
    profiles,
    selectedProfile,
    selectedRegion,
    connectionInfo,
    isConnecting,
    connectionError,
    tables,
    isLoadingTables,
    tablesError,
    currentTable,
    currentTableName,
    currentView,
    setSelectedProfile,
    setSelectedRegion,
    connect,
    refreshTables,
    selectTable,
    setCurrentView,
    goBack,
  }

  return <DynamoDBContext.Provider value={value}>{children}</DynamoDBContext.Provider>
}
