"use client"

import { parseCSVAction, saveTransactionsAction } from "@/app/(app)/import/csv/actions"
import { FormError } from "@/components/forms/error"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field } from "@/prisma/client"
import { Loader2, Play, Upload } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { startTransition, useActionState, useEffect, useState } from "react"

const MAX_PREVIEW_ROWS = 100

export function ImportCSVTable({ fields }: { fields: Field[] }) {
  const router = useRouter()
  const [parseState, parseAction, isParsing] = useActionState(parseCSVAction, null)
  const [saveState, saveAction, isSaving] = useActionState(saveTransactionsAction, null)

  const [csvSettings, setCSVSettings] = useState({
    skipHeader: true,
  })
  const [csvData, setCSVData] = useState<string[][]>([])
  const [columnMappings, setColumnMappings] = useState<string[]>([])

  useEffect(() => {
    if (parseState?.success && parseState.data) {
      const parsedData = parseState.data as string[][]
      setCSVData(parsedData)
      if (parsedData.length > 0) {
        setColumnMappings(
          parsedData[0].map((value) => {
            const field = fields.find((field) => field.code === value || field.name === value)
            return field?.code || ""
          })
        )
      } else {
        setColumnMappings([])
      }
    }
  }, [parseState, fields])

  useEffect(() => {
    if (saveState?.success) {
      router.push("/transactions")
    }
  }, [saveState, router])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    startTransition(async () => {
      await parseAction(formData)
    })
  }

  const handleMappingChange = (columnIndex: number, fieldCode: string) => {
    setColumnMappings((prev) => {
      const state = [...prev]
      state[columnIndex] = fieldCode
      return state
    })
  }

  const handleSave = async () => {
    if (csvData.length === 0) return

    if (!isAtLeastOneFieldMapped(columnMappings)) {
      alert("请至少映射一个字段")
      return
    }

    const startIndex = csvSettings.skipHeader ? 1 : 0
    const processedRows = csvData.slice(startIndex).map((row) => {
      const processedRow: Record<string, unknown> = {}

      columnMappings.forEach((fieldCode, columnIndex) => {
        if (!fieldCode || !row[columnIndex]) return
        processedRow[fieldCode] = row[columnIndex]
      })

      return processedRow
    })

    const formData = new FormData()
    formData.append("rows", JSON.stringify(processedRows))

    startTransition(async () => {
      await saveAction(formData)
    })
  }

  return (
    <>
      {csvData.length === 0 && (
        <Card className="min-h-[420px]">
          <CardHeader>
            <CardTitle>CSV 导入</CardTitle>
            <CardDescription>上传交易流水文件后，系统将自动解析列结构并进入字段映射流程。</CardDescription>
          </CardHeader>
          <CardContent className="flex h-full flex-col items-center justify-center gap-4">
            <p className="text-sm text-muted-foreground">支持 UTF-8 编码 CSV，建议首行为字段名以提高自动识别准确率。</p>
            <div className="flex flex-wrap items-center gap-3">
              <input type="file" accept=".csv" className="hidden" id="csv-file" onChange={handleFileChange} />
              <Button type="button" onClick={() => document.getElementById("csv-file")?.click()}>
                {isParsing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    选择并解析 CSV
                  </>
                )}
              </Button>
              <Button asChild variant="outline">
                <Link href="/import/jobs">查看导入任务中心</Link>
              </Button>
            </div>
            {parseState?.error && <FormError>{parseState.error}</FormError>}
          </CardContent>
        </Card>
      )}

      {csvData.length > 0 && (
        <div>
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold tracking-tight">CSV 预览与字段映射（共 {csvData.length} 行）</h2>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/import/jobs">导入任务中心</Link>
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    导入中...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    导入 {Math.max(csvData.length - (csvSettings.skipHeader ? 1 : 0), 0)} 条交易
                  </>
                )}
              </Button>
            </div>
          </header>

          {saveState?.error && <FormError>{saveState.error}</FormError>}

          <div className="mb-4 flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="h-4 w-4"
                id="skip-header"
                defaultChecked={csvSettings.skipHeader}
                onChange={(e) => setCSVSettings({ ...csvSettings, skipHeader: e.target.checked })}
              />
              <span>第一行是表头</span>
            </label>
          </div>

          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b bg-muted/40 transition-colors hover:bg-muted/50">
                    {csvData[0].map((_, index) => (
                      <th key={index} className="h-12 min-w-[200px] px-4 text-left align-middle font-medium">
                        <select
                          className="w-full rounded-md border p-2"
                          value={columnMappings[index] || ""}
                          onChange={(e) => handleMappingChange(index, e.target.value)}
                        >
                          <option value="">跳过该列</option>
                          {fields.map((field) => (
                            <option key={field.code} value={field.code}>
                              {field.name}
                            </option>
                          ))}
                        </select>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {csvData.slice(0, MAX_PREVIEW_ROWS).map((row, rowIndex) => (
                    <tr
                      key={rowIndex}
                      className={`border-b transition-colors hover:bg-muted/50 ${
                        rowIndex === 0 && csvSettings.skipHeader ? "line-through text-muted-foreground" : ""
                      }`}
                    >
                      {csvData[0].map((_, colIndex) => (
                        <td key={colIndex} className="p-4 align-middle">
                          {(row[colIndex] || "").toString().slice(0, 256)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {csvData.length > MAX_PREVIEW_ROWS && (
            <p className="mt-4 text-sm text-muted-foreground">
              已展示前 {MAX_PREVIEW_ROWS} 行，剩余 {csvData.length - MAX_PREVIEW_ROWS} 行。
            </p>
          )}
        </div>
      )}
    </>
  )
}

function isAtLeastOneFieldMapped(columnMappings: string[]) {
  return columnMappings.some((mapping) => mapping !== "")
}
