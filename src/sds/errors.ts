export interface ScheduleDataSetParseErrorContext {
  lineNumber?: number
  line?: string
  recordType?: string
  field?: string
  cause?: unknown
}

export class ScheduleDataSetParseError extends Error {
  readonly lineNumber: number | undefined
  readonly line: string | undefined
  readonly recordType: string | undefined
  readonly field: string | undefined

  constructor(message: string, ctx: ScheduleDataSetParseErrorContext = {}) {
    super(message, ctx.cause ? { cause: ctx.cause } : undefined)
    this.name = 'ScheduleDataSetParseError'
    this.lineNumber = ctx.lineNumber
    this.line = ctx.line
    this.recordType = ctx.recordType
    this.field = ctx.field
  }
}
