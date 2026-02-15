import { signIn } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="p-8 w-96">
        <h1 className="text-2xl font-bold mb-6 text-center">
          Financial Assistant
        </h1>
        <div className="space-y-4">
          <form
            action={async () => {
              'use server'
              await signIn('github', { redirectTo: '/chat' })
            }}
          >
            <Button type="submit" className="w-full">
              Sign in with GitHub
            </Button>
          </form>
          
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/chat' })
            }}
          >
            <Button type="submit" variant="outline" className="w-full">
              Sign in with Google
            </Button>
          </form>
        </div>
      </Card>
    </div>
  )
}
