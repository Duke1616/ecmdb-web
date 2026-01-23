export interface PutPresignedUrlReq {
  object_name: string
  bucket: string
  prefix?: string
}

export interface GetPresignedUrlReq {
  object_name: string
  bucket: string
  prefix?: string
}

export interface RemoveObjectReq {
  object_name: string
  bucket: string
  prefix?: string
}

export interface PresignedUrlRes {
  url: string
  bucket: string
  object_name: string
}
