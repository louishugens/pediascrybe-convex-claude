"use client"

import type React from "react"

import { useChat } from "@ai-sdk/react"
import { useState, useRef, useEffect, useMemo, useCallback } from "react"
import { Send, Bot, User, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DefaultChatTransport } from "ai"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Link from "next/link"
import ChatGrowthChart from "./chat-growth-chart"
import ChartSelector from "./chart-selector";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from '@/components/ai-elements/reasoning';
import { Response } from '@/components/ai-elements/response';
import { useSubscriptionGuard } from '@/hooks/use-subscription-guard';

interface ChatProps {
  patientId: string
  firstname: string
  lastname: string
}

export default function Chat({ patientId, firstname, lastname }: ChatProps) {
  const [input, setInput] = useState("")
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { requireSubscription } = useSubscriptionGuard()

  // Memoize transport to prevent recreating on every render
  const transport = useMemo(() => new DefaultChatTransport({
    api: `/api/ai/chat/${patientId}`,
  }), [patientId])

  const { messages, sendMessage, status } = useChat({
    transport,
  })

  // Handle chart selection from the chart selector - memoized to prevent recreation
  const handleChartSelect = useCallback((chartType: string) => {
    // Check subscription before using ScrybeGPT
    if (!requireSubscription("use ScrybeGPT")) return
    
    sendMessage({ text: `Show me the ${chartType} growth chart` })
  }, [sendMessage, requireSubscription])

  const isLoading = status === "submitted" || status === "streaming"

  // Auto-scroll to bottom when new messages arrive
  // Use messages.length as dependency instead of messages object to reduce re-runs
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, 100)
    
    return () => clearTimeout(timeoutId)
  }, [messages.length])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    
    // Check subscription before using ScrybeGPT
    if (!requireSubscription("use ScrybeGPT")) return

    sendMessage({ text: input })
    setInput("")
  }, [input, isLoading, sendMessage, requireSubscription])

  // Memoize complex className calculations
  const messageContainerClasses = useMemo(() => ({
    user: "bg-primary text-primary-foreground ml-12",
    assistant: "bg-muted text-foreground mr-12",
    assistantProse: `
      prose prose-sm max-w-none text-foreground
      prose-headings:text-foreground prose-headings:font-bold prose-headings:mt-6 prose-headings:mb-3
      prose-h1:text-xl prose-h1:font-bold prose-h1:border-b prose-h1:border-border prose-h1:pb-2
      prose-h2:text-lg prose-h2:font-bold prose-h2:mt-5 prose-h2:mb-2
      prose-h3:text-base prose-h3:font-semibold prose-h3:mt-4 prose-h3:mb-2
      prose-h4:text-sm prose-h4:font-semibold prose-h4:mt-3 prose-h4:mb-1
      prose-p:text-foreground prose-p:leading-relaxed prose-p:mb-3
      prose-strong:text-foreground prose-strong:font-semibold
      prose-em:text-muted-foreground prose-em:italic
      prose-ul:text-foreground prose-ul:my-3 prose-ul:pl-2
      prose-ol:text-foreground prose-ol:my-3 prose-ol:pl-2 prose-ol:list-decimal
      prose-li:text-foreground prose-li:mb-1 prose-li:leading-relaxed
      prose-ul>li:list-disc prose-ul>li:ml-0
      prose-ol>li:list-decimal prose-ol>li:ml-0
      prose-code:text-foreground prose-code:bg-secondary prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
      prose-pre:bg-secondary prose-pre:text-foreground prose-pre:p-3 prose-pre:rounded-lg prose-pre:overflow-x-auto
      prose-blockquote:border-l-4 prose-blockquote:border-border prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-muted-foreground
    `.replace(/\s+/g, ' ').trim(),
    tableStyles: "[&_table]:border-separate [&_table]:border-spacing-0 [&_table]:border [&_table]:border-border [&_table]:rounded-md [&_table]:overflow-hidden [&_table]:w-full [&_table]:my-4 [&_th]:border-b [&_th]:border-r [&_th]:border-border [&_th]:bg-muted [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-foreground [&_th:first-child]:pl-4 [&_th:last-child]:border-r-0 [&_td]:border-b [&_td]:border-r [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-foreground [&_td:first-child]:pl-4 [&_td:last-child]:border-r-0 [&_tr:last-child_td]:border-b-0"
  }), [])

  return (
    <Card className="flex flex-col h-full w-full py-0 mx-auto bg-card shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b bg-linear-to-r from-primary/5 to-primary/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">ScrybeGPT</h3>
            <p className="text-sm text-muted-foreground">AI Medical Assistant</p>
            <p className="text-sm">
              <span className="font-bold">Patient:</span> {firstname} {lastname}
            </p>
          </div>
        </div>
        <Link href={`/user/patients/${patientId}`} className="ml-2">
          <button className="flex items-center justify-center w-8 h-8 rounded-full bg-card border border-border hover:bg-muted transition">
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
        </Link>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-medium text-foreground mb-2">Welcome to ScrybeGPT</h4>
              <p className="text-sm text-muted-foreground">Ask me anything about this patient's medical information.</p>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              {message.role === "assistant" && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={`${
                  // Check if message has a growth chart or chart selector to make it wider
                  message.parts.some(part => 
                    (part.type === "tool-displayGrowthChart" || part.type === "tool-selectGrowthChart") && 
                    (part as any).state === "output-available"
                  ) ? "w-[95%]" : "max-w-[80%]"
                } rounded-2xl px-4 py-3 ${
                  message.role === "user" ? messageContainerClasses.user : messageContainerClasses.assistant
                }`}
              >
                <div className="space-y-2">
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      if (message.role === "assistant") {
                        return (
                          <div
                            key={index}
                            className={`${messageContainerClasses.assistantProse} ${messageContainerClasses.tableStyles}`}
                          >
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                // Custom components for better rendering
                                h1: ({ children }) => <h1 className="text-xl font-bold border-b border-border pb-2 mb-4 mt-6">{children}</h1>,
                                h2: ({ children }) => <h2 className="text-lg font-bold mb-2 mt-5">{children}</h2>,
                                h3: ({ children }) => <h3 className="text-base font-semibold mb-2 mt-4">{children}</h3>,
                                h4: ({ children }) => <h4 className="text-sm font-semibold mb-1 mt-3">{children}</h4>,
                                p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                                ul: ({ children }) => <ul className="list-disc list-outside ml-2 my-3 space-y-1">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal list-outside ml-2 my-3 space-y-1">{children}</ol>,
                                li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                                em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
                                code: ({ children }) => <code className="bg-secondary text-foreground px-1.5 py-0.5 rounded text-xs font-mono">{children}</code>,
                                pre: ({ children }) => <pre className="bg-secondary text-foreground p-3 rounded-lg overflow-x-auto my-3 text-sm">{children}</pre>,
                                blockquote: ({ children }) => <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground my-3">{children}</blockquote>,
                              }}
                            >
                              {part.text}
                            </ReactMarkdown>
                          </div>
                          // <Response>
                          //   {part.text}
                          // </Response>
                        )
                      } else {
                        return (
                          <p key={index} className="text-sm leading-relaxed whitespace-pre-wrap">
                            {part.text}
                          </p>
                        )
                      }
                    } else if (part.type === "tool-selectGrowthChart") {
                      // Handle chart selector tool calls
                      if (part.state === "input-streaming" || part.state === "input-available") {
                        return (
                          <div key={index} className="text-sm text-muted-foreground italic">
                            Analyzing available growth charts...
                          </div>
                        )
                      } else if (part.state === "output-available") {
                        const output = part.output as any;
                        if (output?.type === "chartSelector") {
                          return (
                            <div key={index} className="mt-4 mb-3">
                              <ChartSelector data={output} onChartSelect={handleChartSelect} />
                            </div>
                          )
                        } else if (output?.error) {
                          return (
                            <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              Chart Selection Error: {output.error}
                            </div>
                          )
                        }
                      } else if (part.state === "output-error") {
                        return (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            Error analyzing charts: {part.errorText}
                          </div>
                        )
                      }
                    } else if (part.type === "tool-displayGrowthChart") {
                      // Handle growth chart tool calls
                      if (part.state === "input-streaming" || part.state === "input-available") {
                        const input = part.input as { chartType?: string } | undefined;
                        return (
                          <div key={index} className="text-sm text-muted-foreground italic">
                            Generating {input?.chartType || 'growth'} chart...
                          </div>
                        )
                      } else if (part.state === "output-available") {
                        const output = part.output as any;
                        if (output?.type === "growthChart") {
                          return (
                            <div key={index} className="mt-4 mb-3">
                              <ChatGrowthChart data={output} />
                            </div>
                          )
                        } else if (output?.error) {
                          return (
                            <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                              Chart Error: {output.error}
                            </div>
                          )
                        }
                      } else if (part.state === "output-error") {
                        return (
                          <div key={index} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                            Error generating chart: {part.errorText}
                          </div>
                        )
                      }
                    } 
                    else if (part.type === "reasoning") {
                      console.log(part)
                      return (
                        null
                        // <Reasoning
                        //   key={`${message.id}-${index}`}
                        //   className="w-full"
                        //   isStreaming={status === 'streaming'}
                        // >
                        //   <ReasoningTrigger />
                        //   <ReasoningContent>{part.text}</ReasoningContent>
                        // </Reasoning>
                      )
                    }
                    return (
                      <p key={index} className="text-sm text-muted-foreground italic">
                        ScrybeGPT
                        {/* {part.type} */}
                      </p>
                    )
                  })}
                </div>
              </div>

              {message.role === "user" && (
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-8 h-8 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  <Bot className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-4 py-3 mr-12">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-muted/50 p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this patient..."
            disabled={isLoading}
            className="flex-1 rounded-full border-input focus:border-primary focus:ring-primary"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-full px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          ScrybeGPT can make mistakes. Please verify important medical information.
        </p>
      </div>
    </Card>
  )
}