function withSearch(path: string, query?: URLSearchParams) {
  const search = query?.toString()
  return `${path}${search ? `?${search}` : ''}`
}

export function publicHotelsPath(query?: URLSearchParams) {
  return withSearch('/hotels', query)
}

export function publicHotelDetailsPath(hotelSlug: string, query?: URLSearchParams) {
  return withSearch(`/hotels/${encodeURIComponent(hotelSlug)}`, query)
}

export function publicBookingPath(hotelSlug: string, query?: URLSearchParams) {
  return withSearch(`/${encodeURIComponent(hotelSlug)}/book`, query)
}
