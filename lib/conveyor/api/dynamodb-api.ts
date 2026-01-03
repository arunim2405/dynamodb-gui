import { ConveyorApi } from '@/lib/preload/shared'
import type {
  TableInfo,
  TableDetails,
  ScanQueryRequest,
  ScanQueryResult,
  AWSProfile,
  ConnectionInfo,
} from '@/lib/services/dynamodb-service'

export class DynamoDBApi extends ConveyorApi {
  // Connection operations
  getProfiles = (): Promise<AWSProfile[]> => this.invoke('dynamodb-get-profiles')

  connect = (profile: string, region: string): Promise<ConnectionInfo> =>
    this.invoke('dynamodb-connect', profile, region)

  getConnection = (): Promise<{ profile: string; region: string } | null> => this.invoke('dynamodb-get-connection')

  isConnected = (): Promise<boolean> => this.invoke('dynamodb-is-connected')

  // Table operations
  listTables = (): Promise<string[]> => this.invoke('dynamodb-list-tables')

  getTablesInfo = (): Promise<TableInfo[]> => this.invoke('dynamodb-get-tables-info')

  getTableDetails = (tableName: string): Promise<TableDetails> => this.invoke('dynamodb-get-table-details', tableName)

  // Scan/Query operations
  scanQuery = (request: ScanQueryRequest): Promise<ScanQueryResult> => this.invoke('dynamodb-scan-query', request)

  // Item operations
  putItem = (tableName: string, item: Record<string, unknown>): Promise<void> =>
    this.invoke('dynamodb-put-item', tableName, item)

  deleteItem = (tableName: string, key: Record<string, unknown>): Promise<void> =>
    this.invoke('dynamodb-delete-item', tableName, key)
}
