import { NextRequest, NextResponse } from 'next/server'
import { getChatsByUserId, createChat } from '@/lib/db/repositories/chat'

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId')
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const chats = await getChatsByUserId(userId)
    return NextResponse.json(chats)
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId, title } = await req.json()
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    const chat = await createChat(userId, title)
    return NextResponse.json(chat)
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}
