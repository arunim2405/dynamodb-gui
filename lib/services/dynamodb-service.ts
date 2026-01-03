import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
  type TableDescription,
  type KeySchemaElement,
  type AttributeDefinition,
  type GlobalSecondaryIndexDescription,
  type LocalSecondaryIndexDescription,
} from '@aws-sdk/client-dynamodb'
import {
  DynamoDBDocumentClient,
  ScanCommand,
  QueryCommand,
  PutCommand,
  DeleteCommand,
  type ScanCommandInput,
  type QueryCommandInput,
} from '@aws-sdk/lib-dynamodb'
import { fromIni } from '@aws-sdk/credential-providers'
import { loadSharedConfigFiles } from '@aws-sdk/shared-ini-file-loader'
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts'

// Types for the DynamoDB service
export interface TableInfo {
  name: string
  status: string
  partitionKey: { name: string; type: string } | null
  sortKey: { name: string; type: string } | null
  gsiCount: number
  lsiCount: number
  replicationRegions: string[]
  deletionProtection: boolean
  capacityMode: 'ON_DEMAND' | 'PROVISIONED'
  itemCount: number
  tableSizeBytes: number
}

export interface IndexInfo {
  name: string
  type: 'GSI' | 'LSI'
  partitionKey: { name: string; type: string } | null
  sortKey: { name: string; type: string } | null
  projectionType: string
  status?: string
}

export interface TableDetails {
  table: TableInfo
  indexes: IndexInfo[]
  attributeDefinitions: { name: string; type: string }[]
}

export interface ScanQueryFilter {
  attributeName: string
  condition:
    | 'EQ'
    | 'NE'
    | 'LT'
    | 'LE'
    | 'GT'
    | 'GE'
    | 'BETWEEN'
    | 'BEGINS_WITH'
    | 'CONTAINS'
    | 'NOT_CONTAINS'
    | 'EXISTS'
    | 'NOT_EXISTS'
  type: 'S' | 'N' | 'B' | 'BOOL' | 'NULL'
  value: string
  value2?: string // For BETWEEN condition
}

export interface ScanQueryRequest {
  tableName: string
  indexName?: string
  mode: 'scan' | 'query'
  partitionKeyValue?: string
  sortKeyCondition?: {
    operator: 'EQ' | 'LE' | 'LT' | 'GE' | 'GT' | 'BETWEEN' | 'BEGINS_WITH'
    value: string
    value2?: string // For BETWEEN
  }
  filters: ScanQueryFilter[]
  projectionType: 'ALL' | 'KEYS_ONLY' | 'INCLUDE'
  projectionAttributes?: string[]
  sortDescending?: boolean
  limit?: number
  exclusiveStartKey?: Record<string, unknown>
}

export interface ScanQueryResult {
  items: Record<string, unknown>[]
  count: number
  scannedCount: number
  lastEvaluatedKey?: Record<string, unknown>
}

export interface AWSProfile {
  name: string
  region?: string
  accountId?: string
}

export interface ConnectionInfo {
  profile: string
  region: string
  accountId: string
}

class DynamoDBService {
  private client: DynamoDBClient | null = null
  private docClient: DynamoDBDocumentClient | null = null
  private currentProfile: string = 'default'
  private currentRegion: string = 'us-east-1'

  /**
   * Get available AWS profiles from ~/.aws/credentials and ~/.aws/config
   */
  async getProfiles(): Promise<AWSProfile[]> {
    try {
      const configFiles = await loadSharedConfigFiles()
      const profiles = new Set<string>()

      // Get profiles from credentials file
      if (configFiles.credentialsFile) {
        Object.keys(configFiles.credentialsFile).forEach((p) => profiles.add(p))
      }

      // Get profiles from config file
      if (configFiles.configFile) {
        Object.keys(configFiles.configFile).forEach((p) => {
          // Config file profiles are prefixed with "profile " except for default
          const profileName = p.replace(/^profile /, '')
          profiles.add(profileName)
        })
      }

      const result: AWSProfile[] = []
      for (const name of profiles) {
        const profile: AWSProfile = { name }
        const config = configFiles.configFile?.[name] || configFiles.configFile?.[`profile ${name}`]
        if (config?.region) {
          profile.region = config.region
        }
        result.push(profile)
      }

      return result.length > 0 ? result : [{ name: 'default' }]
    } catch (error) {
      console.error('Error loading AWS profiles:', error)
      return [{ name: 'default' }]
    }
  }

  /**
   * Initialize the DynamoDB client with a specific profile and region
   */
  async connect(profile: string, region: string): Promise<ConnectionInfo> {
    try {
      const credentials = fromIni({ profile })

      this.client = new DynamoDBClient({
        region,
        credentials,
      })

      this.docClient = DynamoDBDocumentClient.from(this.client, {
        marshallOptions: {
          removeUndefinedValues: true,
          convertClassInstanceToMap: true,
        },
        unmarshallOptions: {
          wrapNumbers: false,
        },
      })

      this.currentProfile = profile
      this.currentRegion = region

      // Verify credentials by getting caller identity
      const stsClient = new STSClient({ region, credentials })
      const identity = await stsClient.send(new GetCallerIdentityCommand({}))

      return {
        profile,
        region,
        accountId: identity.Account || 'Unknown',
      }
    } catch (error) {
      this.client = null
      this.docClient = null
      throw new Error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get current connection info
   */
  getConnectionInfo(): { profile: string; region: string } | null {
    if (!this.client) return null
    return {
      profile: this.currentProfile,
      region: this.currentRegion,
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.client !== null && this.docClient !== null
  }

  /**
   * List all DynamoDB tables
   */
  async listTables(): Promise<string[]> {
    if (!this.client) {
      throw new Error('Not connected to AWS. Please connect first.')
    }

    const tables: string[] = []
    let lastEvaluatedTableName: string | undefined

    do {
      const command = new ListTablesCommand({
        ExclusiveStartTableName: lastEvaluatedTableName,
        Limit: 100,
      })

      const response = await this.client.send(command)
      if (response.TableNames) {
        tables.push(...response.TableNames)
      }
      lastEvaluatedTableName = response.LastEvaluatedTableName
    } while (lastEvaluatedTableName)

    return tables
  }

  /**
   * Get detailed information about all tables
   */
  async getTablesInfo(): Promise<TableInfo[]> {
    const tableNames = await this.listTables()
    const tableInfoPromises = tableNames.map((name) => this.getTableInfo(name))
    return Promise.all(tableInfoPromises)
  }

  /**
   * Get information about a specific table
   */
  async getTableInfo(tableName: string): Promise<TableInfo> {
    if (!this.client) {
      throw new Error('Not connected to AWS. Please connect first.')
    }

    const command = new DescribeTableCommand({ TableName: tableName })
    const response = await this.client.send(command)
    const table = response.Table!

    return this.parseTableDescription(table)
  }

  /**
   * Get detailed information about a table including indexes
   */
  async getTableDetails(tableName: string): Promise<TableDetails> {
    if (!this.client) {
      throw new Error('Not connected to AWS. Please connect first.')
    }

    const command = new DescribeTableCommand({ TableName: tableName })
    const response = await this.client.send(command)
    const table = response.Table!

    const tableInfo = this.parseTableDescription(table)
    const indexes = this.parseIndexes(table)
    const attributeDefinitions = (table.AttributeDefinitions || []).map((attr) => ({
      name: attr.AttributeName!,
      type: attr.AttributeType!,
    }))

    return {
      table: tableInfo,
      indexes,
      attributeDefinitions,
    }
  }

  /**
   * Execute a scan or query operation
   */
  async scanOrQuery(request: ScanQueryRequest): Promise<ScanQueryResult> {
    if (!this.docClient) {
      throw new Error('Not connected to AWS. Please connect first.')
    }

    // Get table details to understand the key schema
    const tableDetails = await this.getTableDetails(request.tableName)
    let keySchema: {
      partitionKey: { name: string; type: string } | null
      sortKey: { name: string; type: string } | null
    }

    if (request.indexName) {
      const index = tableDetails.indexes.find((i) => i.name === request.indexName)
      if (!index) {
        throw new Error(`Index ${request.indexName} not found`)
      }
      keySchema = { partitionKey: index.partitionKey, sortKey: index.sortKey }
    } else {
      keySchema = { partitionKey: tableDetails.table.partitionKey, sortKey: tableDetails.table.sortKey }
    }

    if (request.mode === 'query') {
      return this.executeQuery(request, keySchema)
    } else {
      return this.executeScan(request)
    }
  }

  private async executeQuery(
    request: ScanQueryRequest,
    keySchema: { partitionKey: { name: string; type: string } | null; sortKey: { name: string; type: string } | null }
  ): Promise<ScanQueryResult> {
    if (!keySchema.partitionKey) {
      throw new Error('Cannot determine partition key for this table/index')
    }

    if (!request.partitionKeyValue) {
      throw new Error('Partition key value is required for Query operations')
    }

    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, unknown> = {}
    let keyConditionExpression = ''

    // Partition key condition
    const pkName = `#pk`
    const pkValue = `:pkval`
    expressionAttributeNames[pkName] = keySchema.partitionKey.name
    expressionAttributeValues[pkValue] = this.coerceValue(request.partitionKeyValue, keySchema.partitionKey.type)
    keyConditionExpression = `${pkName} = ${pkValue}`

    // Sort key condition (if provided)
    if (request.sortKeyCondition && keySchema.sortKey) {
      const skName = `#sk`
      const skValue = `:skval`
      expressionAttributeNames[skName] = keySchema.sortKey.name
      expressionAttributeValues[skValue] = this.coerceValue(request.sortKeyCondition.value, keySchema.sortKey.type)

      switch (request.sortKeyCondition.operator) {
        case 'EQ':
          keyConditionExpression += ` AND ${skName} = ${skValue}`
          break
        case 'LT':
          keyConditionExpression += ` AND ${skName} < ${skValue}`
          break
        case 'LE':
          keyConditionExpression += ` AND ${skName} <= ${skValue}`
          break
        case 'GT':
          keyConditionExpression += ` AND ${skName} > ${skValue}`
          break
        case 'GE':
          keyConditionExpression += ` AND ${skName} >= ${skValue}`
          break
        case 'BEGINS_WITH':
          keyConditionExpression += ` AND begins_with(${skName}, ${skValue})`
          break
        case 'BETWEEN': {
          const skValue2 = `:skval2`
          expressionAttributeValues[skValue2] = this.coerceValue(
            request.sortKeyCondition.value2!,
            keySchema.sortKey.type
          )
          keyConditionExpression += ` AND ${skName} BETWEEN ${skValue} AND ${skValue2}`
          break
        }
      }
    }

    // Build filter expression
    const filterResult = this.buildFilterExpression(request.filters, Object.keys(expressionAttributeNames).length)
    if (filterResult.expression) {
      Object.assign(expressionAttributeNames, filterResult.names)
      Object.assign(expressionAttributeValues, filterResult.values)
    }

    // Build projection expression
    const projectionResult = this.buildProjectionExpression(request, Object.keys(expressionAttributeNames).length)
    if (projectionResult.expression) {
      Object.assign(expressionAttributeNames, projectionResult.names)
    }

    const params: QueryCommandInput = {
      TableName: request.tableName,
      IndexName: request.indexName,
      KeyConditionExpression: keyConditionExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ScanIndexForward: !request.sortDescending,
      Limit: request.limit,
      ExclusiveStartKey: request.exclusiveStartKey as Record<string, unknown> | undefined,
    }

    if (filterResult.expression) {
      params.FilterExpression = filterResult.expression
    }

    if (projectionResult.expression) {
      params.ProjectionExpression = projectionResult.expression
    }

    const command = new QueryCommand(params)
    const response = await this.docClient!.send(command)

    return {
      items: (response.Items || []) as Record<string, unknown>[],
      count: response.Count || 0,
      scannedCount: response.ScannedCount || 0,
      lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown> | undefined,
    }
  }

  private async executeScan(request: ScanQueryRequest): Promise<ScanQueryResult> {
    const expressionAttributeNames: Record<string, string> = {}
    const expressionAttributeValues: Record<string, unknown> = {}

    // Build filter expression
    const filterResult = this.buildFilterExpression(request.filters, 0)
    if (filterResult.expression) {
      Object.assign(expressionAttributeNames, filterResult.names)
      Object.assign(expressionAttributeValues, filterResult.values)
    }

    // Build projection expression
    const projectionResult = this.buildProjectionExpression(request, Object.keys(expressionAttributeNames).length)
    if (projectionResult.expression) {
      Object.assign(expressionAttributeNames, projectionResult.names)
    }

    const params: ScanCommandInput = {
      TableName: request.tableName,
      IndexName: request.indexName,
      Limit: request.limit,
      ExclusiveStartKey: request.exclusiveStartKey as Record<string, unknown> | undefined,
    }

    if (filterResult.expression) {
      params.FilterExpression = filterResult.expression
      params.ExpressionAttributeNames = expressionAttributeNames
      params.ExpressionAttributeValues = expressionAttributeValues
    }

    if (projectionResult.expression) {
      params.ProjectionExpression = projectionResult.expression
      params.ExpressionAttributeNames = { ...params.ExpressionAttributeNames, ...projectionResult.names }
    }

    const command = new ScanCommand(params)
    const response = await this.docClient!.send(command)

    return {
      items: (response.Items || []) as Record<string, unknown>[],
      count: response.Count || 0,
      scannedCount: response.ScannedCount || 0,
      lastEvaluatedKey: response.LastEvaluatedKey as Record<string, unknown> | undefined,
    }
  }

  private buildFilterExpression(
    filters: ScanQueryFilter[],
    startIndex: number
  ): {
    expression: string
    names: Record<string, string>
    values: Record<string, unknown>
  } {
    if (filters.length === 0) {
      return { expression: '', names: {}, values: {} }
    }

    const names: Record<string, string> = {}
    const values: Record<string, unknown> = {}
    const conditions: string[] = []

    filters.forEach((filter, index) => {
      const attrName = `#attr${startIndex + index}`
      const attrValue = `:val${startIndex + index}`
      names[attrName] = filter.attributeName

      let condition = ''
      switch (filter.condition) {
        case 'EQ':
          values[attrValue] = this.coerceValue(filter.value, filter.type)
          condition = `${attrName} = ${attrValue}`
          break
        case 'NE':
          values[attrValue] = this.coerceValue(filter.value, filter.type)
          condition = `${attrName} <> ${attrValue}`
          break
        case 'LT':
          values[attrValue] = this.coerceValue(filter.value, filter.type)
          condition = `${attrName} < ${attrValue}`
          break
        case 'LE':
          values[attrValue] = this.coerceValue(filter.value, filter.type)
          condition = `${attrName} <= ${attrValue}`
          break
        case 'GT':
          values[attrValue] = this.coerceValue(filter.value, filter.type)
          condition = `${attrName} > ${attrValue}`
          break
        case 'GE':
          values[attrValue] = this.coerceValue(filter.value, filter.type)
          condition = `${attrName} >= ${attrValue}`
          break
        case 'BETWEEN': {
          values[attrValue] = this.coerceValue(filter.value, filter.type)
          const attrValue2 = `:val${startIndex + index}_2`
          values[attrValue2] = this.coerceValue(filter.value2!, filter.type)
          condition = `${attrName} BETWEEN ${attrValue} AND ${attrValue2}`
          break
        }
        case 'BEGINS_WITH':
          values[attrValue] = filter.value
          condition = `begins_with(${attrName}, ${attrValue})`
          break
        case 'CONTAINS':
          values[attrValue] = filter.value
          condition = `contains(${attrName}, ${attrValue})`
          break
        case 'NOT_CONTAINS':
          values[attrValue] = filter.value
          condition = `NOT contains(${attrName}, ${attrValue})`
          break
        case 'EXISTS':
          condition = `attribute_exists(${attrName})`
          break
        case 'NOT_EXISTS':
          condition = `attribute_not_exists(${attrName})`
          break
      }

      conditions.push(condition)
    })

    return {
      expression: conditions.join(' AND '),
      names,
      values,
    }
  }

  private buildProjectionExpression(
    request: ScanQueryRequest,
    startIndex: number
  ): {
    expression: string
    names: Record<string, string>
  } {
    if (request.projectionType === 'ALL' || !request.projectionAttributes?.length) {
      return { expression: '', names: {} }
    }

    const names: Record<string, string> = {}
    const projections: string[] = []

    request.projectionAttributes.forEach((attr, index) => {
      const attrName = `#proj${startIndex + index}`
      names[attrName] = attr
      projections.push(attrName)
    })

    return {
      expression: projections.join(', '),
      names,
    }
  }

  private coerceValue(value: string, type: string): unknown {
    switch (type) {
      case 'N':
        return Number(value)
      case 'BOOL':
        return value.toLowerCase() === 'true'
      case 'NULL':
        return null
      default:
        return value
    }
  }

  private parseTableDescription(table: TableDescription): TableInfo {
    const keySchema = table.KeySchema || []
    const attributeDefinitions = table.AttributeDefinitions || []

    const getKeyInfo = (
      keyType: 'HASH' | 'RANGE'
    ): {
      name: string
      type: string
    } | null => {
      const key = keySchema.find((k: KeySchemaElement) => k.KeyType === keyType)
      if (!key) return null

      const attr = attributeDefinitions.find((a: AttributeDefinition) => a.AttributeName === key.AttributeName)
      return {
        name: key.AttributeName!,
        type: attr?.AttributeType || 'S',
      }
    }

    const gsiCount = table.GlobalSecondaryIndexes?.length || 0
    const lsiCount = table.LocalSecondaryIndexes?.length || 0

    const replicationRegions = table.Replicas?.map((r) => r.RegionName!).filter(Boolean) || []

    const capacityMode: 'ON_DEMAND' | 'PROVISIONED' =
      table.BillingModeSummary?.BillingMode === 'PAY_PER_REQUEST' ? 'ON_DEMAND' : 'PROVISIONED'

    return {
      name: table.TableName!,
      status: table.TableStatus || 'UNKNOWN',
      partitionKey: getKeyInfo('HASH'),
      sortKey: getKeyInfo('RANGE'),
      gsiCount,
      lsiCount,
      replicationRegions,
      deletionProtection: table.DeletionProtectionEnabled || false,
      capacityMode,
      itemCount: table.ItemCount || 0,
      tableSizeBytes: table.TableSizeBytes || 0,
    }
  }

  /**
   * Put (create or update) an item in a DynamoDB table
   */
  async putItem(tableName: string, item: Record<string, unknown>): Promise<void> {
    if (!this.docClient) {
      throw new Error('Not connected to AWS. Please connect first.')
    }

    const command = new PutCommand({
      TableName: tableName,
      Item: item,
    })

    await this.docClient.send(command)
  }

  /**
   * Delete an item from a DynamoDB table
   */
  async deleteItem(tableName: string, key: Record<string, unknown>): Promise<void> {
    if (!this.docClient) {
      throw new Error('Not connected to AWS. Please connect first.')
    }

    const command = new DeleteCommand({
      TableName: tableName,
      Key: key,
    })

    await this.docClient.send(command)
  }

  private parseIndexes(table: TableDescription): IndexInfo[] {
    const attributeDefinitions = table.AttributeDefinitions || []
    const indexes: IndexInfo[] = []

    const getKeyFromSchema = (
      keySchema: KeySchemaElement[] | undefined,
      keyType: 'HASH' | 'RANGE'
    ): { name: string; type: string } | null => {
      const key = keySchema?.find((k) => k.KeyType === keyType)
      if (!key) return null

      const attr = attributeDefinitions.find((a) => a.AttributeName === key.AttributeName)
      return {
        name: key.AttributeName!,
        type: attr?.AttributeType || 'S',
      }
    }

    // Parse GSIs
    table.GlobalSecondaryIndexes?.forEach((gsi: GlobalSecondaryIndexDescription) => {
      indexes.push({
        name: gsi.IndexName!,
        type: 'GSI',
        partitionKey: getKeyFromSchema(gsi.KeySchema, 'HASH'),
        sortKey: getKeyFromSchema(gsi.KeySchema, 'RANGE'),
        projectionType: gsi.Projection?.ProjectionType || 'ALL',
        status: gsi.IndexStatus,
      })
    })

    // Parse LSIs
    table.LocalSecondaryIndexes?.forEach((lsi: LocalSecondaryIndexDescription) => {
      indexes.push({
        name: lsi.IndexName!,
        type: 'LSI',
        partitionKey: getKeyFromSchema(lsi.KeySchema, 'HASH'),
        sortKey: getKeyFromSchema(lsi.KeySchema, 'RANGE'),
        projectionType: lsi.Projection?.ProjectionType || 'ALL',
      })
    })

    return indexes
  }
}

// Export singleton instance
export const dynamoDBService = new DynamoDBService()
