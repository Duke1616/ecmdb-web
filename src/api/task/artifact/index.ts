import instance, { API_SERVICE } from "@@/utils/service"
import type {
  ActivateArtifactReq,
  ArtifactRelease,
  ArtifactReleaseList,
  ArtifactStatus,
  ArtifactTarget,
  ListArtifactsReq,
  PublishArtifactReq
} from "./types/artifact"

const ARTIFACT_API_PREFIX = `${API_SERVICE.TASK}/artifact`

/** 发布并激活目标代码树的最新制品。 */
export function publishArtifactApi(data: PublishArtifactReq) {
  return instance.post<ArtifactRelease>({
    url: `${ARTIFACT_API_PREFIX}/publish`,
    data
  })
}

/** 查询目标的制品发布记录。 */
export function listArtifactsApi(data: ListArtifactsReq) {
  return instance.post<ArtifactReleaseList>({
    url: `${ARTIFACT_API_PREFIX}/list`,
    data
  })
}

/** 激活指定制品版本。 */
export function activateArtifactApi(data: ActivateArtifactReq) {
  return instance.post<void>({
    url: `${ARTIFACT_API_PREFIX}/activate`,
    data
  })
}

/** 查询目标的当前制品状态。 */
export function artifactStatusApi(data: ArtifactTarget) {
  return instance.post<ArtifactStatus>({
    url: `${ARTIFACT_API_PREFIX}/status`,
    data
  })
}
