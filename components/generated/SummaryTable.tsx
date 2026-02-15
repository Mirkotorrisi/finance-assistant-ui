import { TableContract } from '@/lib/schemas/generated-ui'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SummaryTableProps {
  contract: TableContract
}

export function SummaryTable({ contract }: SummaryTableProps) {
  const { data, metadata } = contract

  const formatCellValue = (value: unknown): string => {
    if (value === null || value === undefined) return '-'
    if (typeof value === 'number') {
      // Basic number formatting
      return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
    }
    return String(value)
  }

  const getAlignment = (align?: 'left' | 'center' | 'right'): string => {
    switch (align) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  return (
    <Card>
      {(metadata?.title || metadata?.description) && (
        <CardHeader>
          {metadata?.title && <CardTitle>{metadata.title}</CardTitle>}
          {metadata?.description && (
            <CardDescription>{metadata.description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {data.columns.map((column) => (
                  <TableHead
                    key={column.key}
                    className={getAlignment(column.align)}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map((row, rowIndex) => {
                // Use a unique identifier from the row if available, otherwise fall back to index
                const rowKey = ('id' in row && typeof row.id === 'string') ? row.id : rowIndex
                return (
                  <TableRow key={rowKey}>
                    {data.columns.map((column) => (
                      <TableCell
                        key={column.key}
                        className={getAlignment(column.align)}
                      >
                        {formatCellValue(row[column.key])}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
