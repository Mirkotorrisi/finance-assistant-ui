const LLM_BASE_URL =
  (typeof window === 'undefined'
    ? process.env.LLM_API_BASE_URL
    : process.env.NEXT_PUBLIC_LLM_API_BASE_URL) ?? 'http://localhost:8000'

export const llmService = {
  async searchTransaction(description: string): Promise<string> {
    const res = await fetch(`${LLM_BASE_URL}/search-transaction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ description }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(
        typeof body?.detail === 'string' ? body.detail : `HTTP ${res.status}`,
      )
    }
    const data = await res.json()
    return data.result as string
  },
}
