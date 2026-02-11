export const IMPORT_ERROR_CODE = {
  csvFormat: "CSV_FORMAT",
  fieldMapping: "FIELD_MAPPING",
  dbConstraint: "DB_CONSTRAINT",
  unknown: "UNKNOWN",
  missingInputRows: "MISSING_INPUT_ROWS",
} as const

export type ImportErrorCode = (typeof IMPORT_ERROR_CODE)[keyof typeof IMPORT_ERROR_CODE]

export function classifyImportError(rawError: unknown): {
  code: ImportErrorCode
  message: string
  retriable: boolean
  hint: string
} {
  const message = String(rawError)
  const lower = message.toLowerCase()

  if (lower.includes("missing input rows artifact") || lower.includes("missing input rows")) {
    return {
      code: IMPORT_ERROR_CODE.missingInputRows,
      message,
      retriable: true,
      hint: "任务缺少输入工件，请重新上传 CSV 或重新触发导入。",
    }
  }

  if (lower.includes("invalid") || lower.includes("csv") || lower.includes("parse")) {
    return {
      code: IMPORT_ERROR_CODE.csvFormat,
      message,
      retriable: false,
      hint: "请检查 CSV 文件编码、表头和日期/金额格式是否符合模板。",
    }
  }

  if (lower.includes("field") || lower.includes("mapping") || lower.includes("enum")) {
    return {
      code: IMPORT_ERROR_CODE.fieldMapping,
      message,
      retriable: false,
      hint: "请确认字段映射配置和可选值是否合法。",
    }
  }

  if (lower.includes("unique constraint") || lower.includes("foreign key") || lower.includes("constraint")) {
    return {
      code: IMPORT_ERROR_CODE.dbConstraint,
      message,
      retriable: false,
      hint: "数据库约束冲突，请检查重复数据、关联对象和组织权限。",
    }
  }

  return {
    code: IMPORT_ERROR_CODE.unknown,
    message,
    retriable: true,
    hint: "未知错误，可稍后重试；若持续失败请联系管理员排查服务日志。",
  }
}
