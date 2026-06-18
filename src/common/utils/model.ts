import type { Model, ModelGroup, listModelsResponseData } from "@/api/cmdb/model/types/model"

export type ModelGroupView = ModelGroup & {
  models: Model[]
}

export const createModelGroups = (groups: ModelGroup[] = [], models: Model[] = []): ModelGroupView[] => {
  const modelByUid = new Map(models.map((model) => [model.uid, model]))
  const modelsByGroupId = new Map<number, Model[]>()

  models.forEach((model) => {
    const groupModels = modelsByGroupId.get(model.group_id) || []
    groupModels.push(model)
    modelsByGroupId.set(model.group_id, groupModels)
  })

  return groups.map((group) => {
    const groupedModels = group.model_uids?.length
      ? group.model_uids.map((uid) => modelByUid.get(uid)).filter((model): model is Model => Boolean(model))
      : modelsByGroupId.get(group.group_id) || []

    return {
      ...group,
      models: groupedModels
    }
  })
}

export const createModelListView = (data: listModelsResponseData): ModelGroupView[] =>
  createModelGroups(data.groups || [], data.models || [])
