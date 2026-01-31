import * as React from 'react'
import type { TableInfo, TableDetails, ConnectionInfo } from '@/lib/services/dynamodb-service'

export type ViewType = 'tables' | 'explorer'

// Default connection values
export const DEFAULT_PROFILE = 'default'
export const DEFAULT_REGION = 'us-east-1'

// Session state that is stored per-tab
export interface TabSessionState {
  // Connection state
  selectedProfile: string
  selectedRegion: string
  connectionInfo: ConnectionInfo | null
  
  // Tables state
  tables: TableInfo[]
  
  // Current table exploration
  currentTable: TableDetails | null
  currentTableName: string | null
  
  // View state
  currentView: ViewType
}

export interface SessionTab {
  id: string
  title: string
  type: 'tables' | 'explorer' | 'item'
  // For explorer tabs
  tableName?: string
  // For item tabs
  item?: Record<string, unknown>
  isNew?: boolean
  // Session state for this tab
  sessionState: TabSessionState
}

// Default session state for new tabs
const createDefaultSessionState = (): TabSessionState => ({
  selectedProfile: DEFAULT_PROFILE,
  selectedRegion: DEFAULT_REGION,
  connectionInfo: null,
  tables: [],
  currentTable: null,
  currentTableName: null,
  currentView: 'tables',
})

interface TabsContextValue {
  tabs: SessionTab[]
  activeTabId: string
  activeTab: SessionTab | undefined
  addTab: (tab: Omit<SessionTab, 'id' | 'sessionState'> & { sessionState?: Partial<TabSessionState> }) => string
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<SessionTab>) => void
  updateActiveTabSession: (updates: Partial<TabSessionState>) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

export function useTabs() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error('useTabs must be used within a TabsProvider')
  }
  return context
}

interface TabsProviderProps {
  children: React.ReactNode
}

let tabIdCounter = 0

interface TabsState {
  tabs: SessionTab[]
  activeTabId: string
}

export function TabsProvider({ children }: TabsProviderProps) {
  const [state, setState] = React.useState<TabsState>({
    tabs: [{ id: 'main', title: 'Tables', type: 'tables', sessionState: createDefaultSessionState() }],
    activeTabId: 'main',
  })

  const { tabs, activeTabId } = state
  const activeTab = React.useMemo(() => tabs.find((t) => t.id === activeTabId), [tabs, activeTabId])

  const addTab = React.useCallback((tab: Omit<SessionTab, 'id' | 'sessionState'> & { sessionState?: Partial<TabSessionState> }) => {
    const id = `tab-${++tabIdCounter}`
    const newTab: SessionTab = {
      ...tab,
      id,
      sessionState: { ...createDefaultSessionState(), ...tab.sessionState },
    }
    // Update both tabs and activeTabId atomically in a single state update
    setState((prev) => ({
      tabs: [...prev.tabs, newTab],
      activeTabId: id,
    }))
    return id
  }, [])

  const removeTab = React.useCallback((id: string) => {
    setState((prev) => {
      const newTabs = prev.tabs.filter((t) => t.id !== id)
      let newActiveTabId = prev.activeTabId
      
      // If we're closing the active tab, switch to the previous tab or the first one
      if (id === prev.activeTabId && newTabs.length > 0) {
        const closedIndex = prev.tabs.findIndex((t) => t.id === id)
        const newActiveIndex = Math.max(0, closedIndex - 1)
        newActiveTabId = newTabs[newActiveIndex]?.id || newTabs[0].id
      }
      
      // Don't allow closing the last tab
      if (newTabs.length === 0) {
        return {
          tabs: [{ id: 'main', title: 'Tables', type: 'tables' as const, sessionState: createDefaultSessionState() }],
          activeTabId: 'main',
        }
      }
      
      return { tabs: newTabs, activeTabId: newActiveTabId }
    })
  }, [])

  const setActiveTab = React.useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeTabId: id }))
  }, [])

  const updateTab = React.useCallback((id: string, updates: Partial<SessionTab>) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }))
  }, [])

  const updateActiveTabSession = React.useCallback((updates: Partial<TabSessionState>) => {
    setState((prev) => ({
      ...prev,
      tabs: prev.tabs.map((t) => 
        t.id === prev.activeTabId 
          ? { ...t, sessionState: { ...t.sessionState, ...updates } } 
          : t
      ),
    }))
  }, [])

  const value: TabsContextValue = {
    tabs,
    activeTabId,
    activeTab,
    addTab,
    removeTab,
    setActiveTab,
    updateTab,
    updateActiveTabSession,
  }

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}
