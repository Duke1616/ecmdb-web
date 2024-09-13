import type * as department from "./types/department"
import instance from "@/utils/hy_service"

/** 查看列表树 */
export function listDepartmentTreeApi() {
  return instance.post<department.department[]>({
    url: "department/list/tree"
  })
}

/** 新增部门 */
export function createDepartmentApi(data: department.createOrUpdateDepartment) {
  return instance.post<number>({
    url: "department/create",
    data: data
  })
}

/** 修改部门 */
export function updateDepartmentApi(data: department.createOrUpdateDepartment) {
  return instance.post<number>({
    url: "department/update",
    data: data
  })
}

/** 删除部门 */
export function deleteDepartmentApi(id: number) {
  return instance.post<number>({
    url: "department/delete",
    data: { id: id }
  })
}
