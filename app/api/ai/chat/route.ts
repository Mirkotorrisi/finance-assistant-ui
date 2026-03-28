import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { tools } from '@/lib/ai/tools'

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

// Marker used to embed ui_metadata from the Python agent inside a plain text stream.
// ChatContainer parses this marker out of assistant messages and renders the
// appropriate UI component via UIRenderer.
export const UI_METADATA_MARKER = '__UI_METADATA__:'

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // When PYTHON_AGENT_URL is configured, proxy the request to the LangGraph
    // agent instead of calling OpenAI directly.
    const pythonAgentUrl = process.env.PYTHON_AGENT_URL
    if (pythonAgentUrl) {
      return await proxyToPythonAgent(pythonAgentUrl, messages)
    }

    // Convert UI messages to the format expected by streamText
    const formattedMessages = messages.map((msg) => {
      // Extract text content from parts if present
      if (msg.parts && Array.isArray(msg.parts)) {
        const textParts = msg.parts.filter((part: { type: string }) => part.type === 'text')
        const content = textParts.map((part: { text: string }) => part.text).join('')
        return {
          role: msg.role,
          content,
        }
      }
      // Otherwise use content directly if available
      return {
        role: msg.role,
        content: msg.content || '',
      }
    })

    const result = await streamText({
      model: openai('gpt-4o'),
      messages: formattedMessages,
      system: 'You are a helpful financial assistant. You help users understand their finances, analyze transactions, and provide financial insights.',
      tools,
      onFinish: (result) => {
        console.log('Finish event:', {
          text: result.text,
          toolCalls: result.toolCalls,
          toolResults: result.toolResults,
        })
      }
    })

    return result.toTextStreamResponse()
  } catch (error) {
    console.error('AI Chat Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

/**
 * Forward the chat request to the Python LangGraph agent.
 *
 * The agent returns `{ text: string, ui_metadata?: UIContract }`.
 * We encode `ui_metadata` into the plain-text stream using the
 * UI_METADATA_MARKER so that ChatContainer can detect and render it.
 */
async function proxyToPythonAgent(agentUrl: string, messages: unknown[]) {
  let response: Response
  try {
    response = await fetch(`${agentUrl}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    })
  } catch (err) {
    throw new Error(
      `Failed to connect to Python agent at ${agentUrl}: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  if (!response.ok) {
    throw new Error(`Python agent returned status ${response.status}`)
  }

  let agentData: { text: string; ui_metadata?: unknown }
  try {
    agentData = await response.json()
  } catch (err) {
    throw new Error(
      `Python agent returned invalid JSON response: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  // Append the ui_metadata JSON to the text using the shared marker so that
  // ChatContainer can reliably split content from UI instructions.
  let outputText = agentData.text ?? ''
  if (agentData.ui_metadata) {
    outputText += `\n\n${UI_METADATA_MARKER}${JSON.stringify(agentData.ui_metadata)}`
  }

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(outputText))
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
