export type RaffleStatus = 'draft' | 'active' | 'closed'
export type TicketStatus = 'reserved' | 'paid'

export type Raffle = {
  id: string
  owner_id: string
  slug: string
  title: string
  description: string | null
  draw_rules: string | null
  prize: string | null
  price: number
  currency: string
  total_numbers: number
  draw_date: string | null
  contact_name: string | null
  contact_whatsapp: string | null
  payment_info: string | null
  max_per_person: number
  status: RaffleStatus
  created_at: string
  updated_at: string
}

export type Ticket = {
  id: string
  raffle_id: string
  number: number
  buyer_name: string
  buyer_whatsapp: string
  status: TicketStatus
  note: string | null
  reserved_at: string
  paid_at: string | null
}

export type PublicTicket = {
  raffle_id: string
  number: number
  status: TicketStatus
}

export const RAFFLE_STATUS_LABEL: Record<RaffleStatus, string> = {
  draft: 'Borrador',
  active: 'Publicada',
  closed: 'Cerrada',
}
