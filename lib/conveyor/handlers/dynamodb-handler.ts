import { handle } from '@/lib/main/shared'
import { dynamoDBService, type ScanQueryRequest } from '@/lib/services/dynamodb-service'

export const registerDynamoDBHandlers = () => {
  // Connection operations
  handle('dynamodb-get-profiles', async () => {
    return dynamoDBService.getProfiles()
  })

  handle('dynamodb-connect', async (profile: string, region: string) => {
    return dynamoDBService.connect(profile, region)
  })

  handle('dynamodb-get-connection', () => {
    return dynamoDBService.getConnectionInfo()
  })

  handle('dynamodb-is-connected', () => {
    return dynamoDBService.isConnected()
  })

  // Table operations
  handle('dynamodb-list-tables', async () => {
    return dynamoDBService.listTables()
  })

  handle('dynamodb-get-tables-info', async () => {
    return dynamoDBService.getTablesInfo()
  })

  handle('dynamodb-get-table-details', async (tableName: string) => {
    return dynamoDBService.getTableDetails(tableName)
  })

  // Scan/Query operations
  handle('dynamodb-scan-query', async (request: ScanQueryRequest) => {
    return dynamoDBService.scanOrQuery(request)
  })
}
