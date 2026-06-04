import { useTranslation } from 'react-i18next'
import { RegisterForm } from '@/components/auth/register-form'

export function RegisterPage() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="font-heading text-2xl font-semibold">{t('register.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('register.subtitle')}</p>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-xs">
          <RegisterForm />
        </div>
      </div>
    </div>
  )
}
