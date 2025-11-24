'use client'

import { useState, useEffect } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/utils/currency'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Transaction {
  id: string
  date: string // ISO string from API
  patientName: string
  serviceName: string
  price: number
  currency: string
}

export default function TransactionsPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState({ amount: 0, currency: 'USD' })

  useEffect(() => {
    async function fetchTransactions() {
      setLoading(true)
      try {
        const dateStr = format(selectedDate, 'yyyy-MM-dd')
        console.log('Client: Fetching transactions for date:', dateStr)
        const response = await fetch(`/api/transactions?date=${dateStr}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error('Client: API error:', response.status, errorData)
          throw new Error(`Failed to fetch transactions: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('Client: Received data:', data)
        console.log('Client: Transactions count:', data.transactions?.length || 0)
        
        setTransactions(data.transactions || [])
        
        // Calculate total
        if (data.transactions && data.transactions.length > 0) {
          const primaryCurrency = data.transactions[0]?.currency || 'USD'
          const totalAmount = data.transactions.reduce((sum: number, t: Transaction) => {
            // Only sum if same currency, otherwise use first currency
            return sum + t.price
          }, 0)
          setTotal({ amount: totalAmount, currency: primaryCurrency })
        } else {
          setTotal({ amount: 0, currency: 'USD' })
        }
      } catch (error) {
        console.error('Client: Error fetching transactions:', error)
        setTransactions([])
        setTotal({ amount: 0, currency: 'USD' })
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [selectedDate])

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Transactions</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[280px] justify-start text-left font-normal",
                !selectedDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              disabled={(date) => date > new Date()}
              defaultMonth={selectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Transactions for {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found for this date
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Patient Name</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const transactionDate = new Date(transaction.date)
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">
                          {format(transactionDate, 'HH:mm')}
                        </TableCell>
                        <TableCell>{transaction.patientName}</TableCell>
                        <TableCell>{transaction.serviceName}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(transaction.price, transaction.currency)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-lg font-bold">
                    {formatCurrency(total.amount, total.currency)}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

