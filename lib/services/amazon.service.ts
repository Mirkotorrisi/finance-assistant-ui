import type { AmazonJobStatus, AmazonUploadJobResponse } from '@/lib/types/amazon'

const LLM_API_BASE_URL = process.env.NEXT_PUBLIC_LLM_API_BASE_URL ?? 'http://localhost:8000'

export const amazonService = {
  async upload(file: File): Promise<AmazonUploadJobResponse> {
    const formData = new FormData()
    formData.append('file', file)

    const res = await fetch(`${LLM_API_BASE_URL}/amazon/upload`, {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.detail ?? `Upload failed (HTTP ${res.status})`)
    }

    return res.json()
  },

  async getJobStatus(jobId: string): Promise<AmazonJobStatus> {
    const res = await fetch(`${LLM_API_BASE_URL}/amazon/jobs/${jobId}`)
    if (!res.ok) {
      throw new Error(`Failed to fetch job status (HTTP ${res.status})`)
    }
    return res.json()
  },
}
