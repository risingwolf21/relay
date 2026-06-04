import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4">
      <h1 className="font-heading text-4xl font-bold text-muted-foreground">404</h1>
      <p className="text-muted-foreground">{t('pages.notFound')}</p>
      <Button onClick={() => navigate('/dashboard')}>{t('pages.goToDashboard')}</Button>
    </div>
  )
}
