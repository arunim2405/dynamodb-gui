import { z } from 'zod'

// Schema for key attribute value (multi-attribute key support)
const keyAttributeValueSchema = z.object({
  attributeName: z.string(),
  value: z.string(),
  type: z.enum(['S', 'N', 'B', 'BOOL', 'NULL']),
})

// Schema for table key info
const keyInfoSchema = z
  .object({
    name: z.string(),
    type: z.string(),
  })
  .nullable()

// Schema for key info array (multi-attribute support)
const keyInfoArraySchema = z.array(
  z.object({
    name: z.string(),
    type: z.string(),
  })
)

// Schema for table information
const tableInfoSchema = z.object({
  name: z.string(),
  status: z.string(),
  partitionKey: keyInfoSchema,
  sortKey: keyInfoSchema,
  partitionKeys: keyInfoArraySchema,
  sortKeys: keyInfoArraySchema,
  gsiCount: z.number(),
  lsiCount: z.number(),
  replicationRegions: z.array(z.string()),
  deletionProtection: z.boolean(),
  capacityMode: z.enum(['ON_DEMAND', 'PROVISIONED']),
  itemCount: z.number(),
  tableSizeBytes: z.number(),
})

// Schema for index information
const indexInfoSchema = z.object({
  name: z.string(),
  type: z.enum(['GSI', 'LSI']),
  partitionKey: keyInfoSchema,
  sortKey: keyInfoSchema,
  partitionKeys: keyInfoArraySchema,
  sortKeys: keyInfoArraySchema,
  projectionType: z.string(),
  status: z.string().optional(),
})

// Schema for table details
const tableDetailsSchema = z.object({
  table: tableInfoSchema,
  indexes: z.array(indexInfoSchema),
  attributeDefinitions: z.array(
    z.object({
      name: z.string(),
      type: z.string(),
    })
  ),
})

// Schema for AWS profile
const awsProfileSchema = z.object({
  name: z.string(),
  region: z.string().optional(),
  accountId: z.string().optional(),
})

// Schema for connection info
const connectionInfoSchema = z.object({
  profile: z.string(),
  region: z.string(),
  accountId: z.string(),
})

// Schema for scan/query filter
const scanQueryFilterSchema = z.object({
  attributeName: z.string(),
  condition: z.enum([
    'EQ',
    'NE',
    'LT',
    'LE',
    'GT',
    'GE',
    'BETWEEN',
    'BEGINS_WITH',
    'CONTAINS',
    'NOT_CONTAINS',
    'EXISTS',
    'NOT_EXISTS',
  ]),
  type: z.enum(['S', 'N', 'B', 'BOOL', 'NULL']),
  value: z.string(),
  value2: z.string().optional(),
})

// Schema for sort key condition
const sortKeyConditionSchema = z.object({
  operator: z.enum(['EQ', 'LE', 'LT', 'GE', 'GT', 'BETWEEN', 'BEGINS_WITH']),
  value: z.string(),
  value2: z.string().optional(),
})

// Schema for multi-attribute sort key condition
const multiAttributeSortKeyConditionSchema = z.object({
  attributeName: z.string(),
  operator: z.enum(['EQ', 'LE', 'LT', 'GE', 'GT', 'BETWEEN', 'BEGINS_WITH']),
  value: z.string(),
  value2: z.string().optional(),
  type: z.enum(['S', 'N', 'B', 'BOOL', 'NULL']),
})

// Schema for scan/query request
const scanQueryRequestSchema = z.object({
  tableName: z.string(),
  indexName: z.string().optional(),
  mode: z.enum(['scan', 'query']),
  // Legacy single partition key value (for backward compatibility)
  partitionKeyValue: z.string().optional(),
  // Multi-attribute partition key values (up to 4 attributes)
  partitionKeyValues: z.array(keyAttributeValueSchema).max(4).optional(),
  // Legacy single sort key condition (for backward compatibility)
  sortKeyCondition: sortKeyConditionSchema.optional(),
  // Multi-attribute sort key conditions (up to 4 attributes)
  sortKeyConditions: z.array(multiAttributeSortKeyConditionSchema).max(4).optional(),
  filters: z.array(scanQueryFilterSchema),
  projectionType: z.enum(['ALL', 'KEYS_ONLY', 'INCLUDE']),
  projectionAttributes: z.array(z.string()).optional(),
  sortDescending: z.boolean().optional(),
  limit: z.number().optional(),
  exclusiveStartKey: z.record(z.string(), z.unknown()).optional(),
})

// Schema for scan/query result
const scanQueryResultSchema = z.object({
  items: z.array(z.record(z.string(), z.unknown())),
  count: z.number(),
  scannedCount: z.number(),
  lastEvaluatedKey: z.record(z.string(), z.unknown()).optional(),
})

export const dynamoDBIpcSchema = {
  // Connection operations
  'dynamodb-get-profiles': {
    args: z.tuple([]),
    return: z.array(awsProfileSchema),
  },
  'dynamodb-connect': {
    args: z.tuple([z.string(), z.string()]), // profile, region
    return: connectionInfoSchema,
  },
  'dynamodb-get-connection': {
    args: z.tuple([]),
    return: z
      .object({
        profile: z.string(),
        region: z.string(),
      })
      .nullable(),
  },
  'dynamodb-is-connected': {
    args: z.tuple([]),
    return: z.boolean(),
  },

  // Table operations
  'dynamodb-list-tables': {
    args: z.tuple([]),
    return: z.array(z.string()),
  },
  'dynamodb-get-tables-info': {
    args: z.tuple([]),
    return: z.array(tableInfoSchema),
  },
  'dynamodb-get-table-details': {
    args: z.tuple([z.string()]), // tableName
    return: tableDetailsSchema,
  },

  // Scan/Query operations
  'dynamodb-scan-query': {
    args: z.tuple([scanQueryRequestSchema]),
    return: scanQueryResultSchema,
  },

  // Item operations
  'dynamodb-put-item': {
    args: z.tuple([z.string(), z.record(z.string(), z.unknown())]), // tableName, item
    return: z.void(),
  },
  'dynamodb-delete-item': {
    args: z.tuple([z.string(), z.record(z.string(), z.unknown())]), // tableName, key
    return: z.void(),
  },
}
