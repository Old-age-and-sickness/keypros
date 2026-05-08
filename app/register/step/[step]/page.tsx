import { notFound } from 'next/navigation'
import RegisterStepClient from './RegisterStepClient'

export default async function RegisterStepPage({
  params,
}: {
  params: Promise<{ step: string }>
}) {
  const { step } = await params
  const stepNum = Number(step)

  if (!stepNum || stepNum < 1 || stepNum > 5) notFound()

  return <RegisterStepClient step={stepNum} />
}
