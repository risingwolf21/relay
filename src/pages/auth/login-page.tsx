import { LoginForm } from '@/components/auth/login-form'

export function LoginPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to your Relay account</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-xs">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
