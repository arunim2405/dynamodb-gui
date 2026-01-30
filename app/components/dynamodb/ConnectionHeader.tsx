import * as React from 'react'
import { useDynamoDB, AWS_REGIONS } from './DynamoDBContext'
import { Button } from '@/app/components/ui/button'
import { Select } from '@/app/components/ui/select'
import { Spinner } from '@/app/components/ui/spinner'
import { Alert, AlertDescription } from '@/app/components/ui/alert'
import { Database, RefreshCw, ChevronLeft } from 'lucide-react'

export function ConnectionHeader() {
  const {
    profiles,
    selectedProfile,
    selectedRegion,
    connectionInfo,
    isConnecting,
    connectionError,
    setSelectedProfile,
    setSelectedRegion,
    connect,
    refreshTables,
    isLoadingTables,
    currentView,
    currentTableName,
    goBack,
  } = useDynamoDB()

  const profileOptions = profiles.map((p) => ({ value: p.name, label: p.name }))
  const regionOptions = AWS_REGIONS.map((r) => ({ value: r.value, label: `${r.value} - ${r.label}` }))

  return (
    <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
      {/* Top connection bar */}
      <div className="flex items-center gap-4 px-4 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-primary/10">
            <Database className="h-4 w-4 text-primary" />
          </div>
          <span className="font-semibold text-sm tracking-tight">DynamoDB Desktop</span>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Profile:</span>
            <Select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              options={profileOptions}
              className="w-36 h-8 text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Region:</span>
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              options={regionOptions}
              className="w-52 h-8 text-xs"
            />
          </div>

          <Button onClick={connect} disabled={isConnecting} size="sm" className="h-8">
            {isConnecting ? (
              <>
                <Spinner className="h-3.5 w-3.5" />
                Connecting...
              </>
            ) : connectionInfo ? (
              'Reconnect'
            ) : (
              'Connect'
            )}
          </Button>

          {connectionInfo && (
            <Button onClick={refreshTables} disabled={isLoadingTables} variant="outline" size="sm" className="h-8 w-8 p-0">
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingTables ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Connection status */}
      {connectionInfo && (
        <div className="px-4 py-1.5 bg-muted/30 border-t border-border/30 text-xs text-muted-foreground flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
            <span>
              Connected to <span className="text-foreground font-medium">{connectionInfo.profile}</span> in <span className="text-foreground font-medium">{connectionInfo.region}</span>
            </span>
          </div>
          <span className="text-border">|</span>
          <span>Account: <span className="font-mono text-foreground/80">{connectionInfo.accountId}</span></span>
        </div>
      )}

      {/* Breadcrumb for explorer view */}
      {currentView === 'explorer' && currentTableName && (
        <div className="px-4 py-2 border-t border-border/30 flex items-center gap-2 bg-muted/20">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1 h-7 text-xs text-muted-foreground hover:text-foreground">
            <ChevronLeft className="h-3.5 w-3.5" />
            Tables
          </Button>
          <span className="text-border">/</span>
          <span className="font-medium text-sm">{currentTableName}</span>
        </div>
      )}

      {/* Error display */}
      {connectionError && (
        <div className="px-4 py-2 border-t border-border/30">
          <Alert variant="destructive">
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
