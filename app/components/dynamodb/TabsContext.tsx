import * as React from 'react'

export interface SessionTab {
  id: string
  title: string
  type: 'tables' | 'explorer' | 'item'
  // For explorer tabs
  tableName?: string
  // For item tabs
  item?: Record<string, unknown>
  isNew?: boolean
}

interface TabsContextValue {
  tabs: SessionTab[]
  activeTabId: string
  addTab: (tab: Omit<SessionTab, 'id'>) => string
  removeTab: (id: string) => void
  setActiveTab: (id: string) => void
  updateTab: (id: string, updates: Partial<SessionTab>) => void
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

export function TabsProvider({ children }: TabsProviderProps) {
  const [tabs, setTabs] = React.useState<SessionTab[]>([
    { id: 'main', title: 'Tables', type: 'tables' }
  ])
  const [activeTabId, setActiveTabId] = React.useState('main')

  const addTab = React.useCallback((tab: Omit<SessionTab, 'id'>) => {
    const id = `tab-${++tabIdCounter}`
    const newTab: SessionTab = { ...tab, id }
    setTabs((prev) => [...prev, newTab])
    setActiveTabId(id)
    return id
  }, [])

  const removeTab = React.useCallback((id: string) => {
    setTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== id)
      // If we're closing the active tab, switch to the previous tab or the first one
      if (id === activeTabId && newTabs.length > 0) {
        const closedIndex = prev.findIndex((t) => t.id === id)
        const newActiveIndex = Math.max(0, closedIndex - 1)
        setActiveTabId(newTabs[newActiveIndex]?.id || newTabs[0].id)
      }
      // Don't allow closing the last tab
      if (newTabs.length === 0) {
        return [{ id: 'main', title: 'Tables', type: 'tables' as const }]
      }
      return newTabs
    })
  }, [activeTabId])

  const setActiveTab = React.useCallback((id: string) => {
    setActiveTabId(id)
  }, [])

  const updateTab = React.useCallback((id: string, updates: Partial<SessionTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    )
  }, [])

  const value: TabsContextValue = {
    tabs,
    activeTabId,
    addTab,
    removeTab,
    setActiveTab,
    updateTab,
  }

  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>
}
