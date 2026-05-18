import { AppAtmosphere } from '@/components/layout/AppAtmosphere'

type NightAtmosphereProps = {
  className?: string
}

export function NightAtmosphere({ className = '' }: NightAtmosphereProps) {
  return <AppAtmosphere className={className} intensity="marketing" />
}
