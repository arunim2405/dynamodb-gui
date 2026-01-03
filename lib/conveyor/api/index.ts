import { electronAPI } from '@electron-toolkit/preload'
import { AppApi } from './app-api'
import { WindowApi } from './window-api'
import { DynamoDBApi } from './dynamodb-api'

export const conveyor = {
  app: new AppApi(electronAPI),
  window: new WindowApi(electronAPI),
  dynamodb: new DynamoDBApi(electronAPI),
}

export type ConveyorApi = typeof conveyor
