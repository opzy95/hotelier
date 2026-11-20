import { publicApiRequest } from '../api'

export type PublicPlanPrice = {
  amount: number
  currency: string
  billingInterval: string
}

export type PublicPlan = {
  id: string
  code: string
  name: string
  description: string
  trialDays: number
  features: string[]
  prices: PublicPlanPrice[]
}

export type PublicPlanOption = {
  key: string
  id: string
  code: string
  name: string
  description: string
  trialDays: number
  features: string[]
  price?: PublicPlanPrice
}

function isPlanDefinition(value: unknown): value is {
  id: string
  code: string
  name: string
  description: string
  trial_days: number
  sort_order: number
  features: Record<string, boolean>
} {
  if (typeof value !== 'object' || value === null) return false
  if (!('id' in value) || !('code' in value) || !('name' in value) || !('description' in value) || !('trial_days' in value) || !('sort_order' in value) || !('features' in value)) return false
  if (typeof value.features !== 'object' || value.features === null || Array.isArray(value.features)) return false

  return typeof value.id === 'string'
    && value.id.length > 0
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && typeof value.description === 'string'
    && typeof value.trial_days === 'number'
    && Number.isFinite(value.trial_days)
    && typeof value.sort_order === 'number'
    && Number.isFinite(value.sort_order)
    && Object.values(value.features).every((feature) => typeof feature === 'boolean')
}

function isPlanPrice(value: unknown): value is {
  plan_code: string
  billing_interval: string
  amount: number
  currency: string
} {
  if (typeof value !== 'object' || value === null) return false
  if (!('plan_code' in value) || !('billing_interval' in value) || !('amount' in value) || !('currency' in value)) return false

  return typeof value.plan_code === 'string'
    && typeof value.billing_interval === 'string'
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && typeof value.currency === 'string'
}

export function parsePublicPlans(payload: unknown): PublicPlan[] {
  if (typeof payload !== 'object' || payload === null || !('plans' in payload) || !Array.isArray(payload.plans) || !('plan_prices' in payload) || !Array.isArray(payload.plan_prices)) {
    throw new Error('The hotel API returned an invalid plans response.')
  }
  if (!payload.plans.every(isPlanDefinition) || !payload.plan_prices.every(isPlanPrice)) {
    throw new Error('The hotel API returned an invalid plans response.')
  }

  const pricesByPlan = new Map<string, PublicPlanPrice[]>()
  for (const price of payload.plan_prices) {
    const prices = pricesByPlan.get(price.plan_code) ?? []
    prices.push({
      amount: price.amount,
      currency: price.currency,
      billingInterval: price.billing_interval,
    })
    pricesByPlan.set(price.plan_code, prices)
  }

  return [...payload.plans]
    .sort((left, right) => left.sort_order - right.sort_order)
    .map((plan) => ({
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      trialDays: plan.trial_days,
      features: Object.entries(plan.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature.replace(/_/g, ' ')),
      prices: pricesByPlan.get(plan.code) ?? [],
    }))
}

export async function fetchPublicPlans() {
  const payload = await publicApiRequest<unknown>('/public/plans')
  return parsePublicPlans(payload)
}

export function getPublicPlanOptions(plans: PublicPlan[]): PublicPlanOption[] {
  return plans.flatMap((plan) => {
    const options = plan.prices.length > 0
      ? [...plan.prices].sort((left, right) => Number(right.billingInterval.match(/^\d+/)?.[0] ?? 0) - Number(left.billingInterval.match(/^\d+/)?.[0] ?? 0))
      : [undefined]

    return options.map((price) => ({
      key: `${plan.code}-${price?.billingInterval ?? 'trial'}`,
      id: plan.id,
      code: plan.code,
      name: plan.name,
      description: plan.description,
      trialDays: plan.trialDays,
      features: plan.features,
      price,
    }))
  })
}

export function formatPlanPrice(price: PublicPlanPrice) {
  const fractionDigits = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.currency,
  }).resolvedOptions().maximumFractionDigits ?? 2
  const formattedPrice = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: price.currency,
    maximumFractionDigits: 2,
  }).format(price.amount / (10 ** fractionDigits))
  const months = Number(price.billingInterval.match(/^\d+/)?.[0])
  const interval = Number.isFinite(months)
    ? `${months} ${months === 1 ? 'month' : 'months'}`
    : price.billingInterval.replace(/_/g, ' ')
  return `${formattedPrice} / ${interval}`
}
