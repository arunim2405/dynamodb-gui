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
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Top connection bar */}
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary" />
          <span className="font-semibold text-lg">DynamoDB Desktop</span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Profile:</span>
            <Select
              value={selectedProfile}
              onChange={(e) => setSelectedProfile(e.target.value)}
              options={profileOptions}
              className="w-40"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Region:</span>
            <Select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              options={regionOptions}
              className="w-60"
            />
          </div>

          <Button onClick={connect} disabled={isConnecting} size="sm">
            {isConnecting ? (
              <>
                <Spinner className="h-4 w-4" />
                Connecting...
              </>
            ) : connectionInfo ? (
              'Reconnect'
            ) : (
              'Connect'
            )}
          </Button>

          {connectionInfo && (
            <Button onClick={refreshTables} disabled={isLoadingTables} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 ${isLoadingTables ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Connection status */}
      {connectionInfo && (
        <div className="px-4 py-1.5 bg-muted/50 border-t text-xs text-muted-foreground flex items-center gap-4">
          <span>
            Connected to <strong>{connectionInfo.profile}</strong> in <strong>{connectionInfo.region}</strong>
          </span>
          <span className="text-muted-foreground/50">|</span>
          <span>Account: {connectionInfo.accountId}</span>
        </div>
      )}

      {/* Breadcrumb for explorer view */}
      {currentView === 'explorer' && currentTableName && (
        <div className="px-4 py-2 border-t flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goBack} className="gap-1">
            <ChevronLeft className="h-4 w-4" />
            Tables
          </Button>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium">{currentTableName}</span>
        </div>
      )}

      {/* Error display */}
      {connectionError && (
        <div className="px-4 py-2 border-t">
          <Alert variant="destructive">
            <AlertDescription>{connectionError}</AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}
