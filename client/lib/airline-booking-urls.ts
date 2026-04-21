/**
 * Official booking or homepage URLs for airlines (IATA code → URL).
 * "Book on [Airline]" opens this so users can complete booking on the airline's site.
 */
export const AIRLINE_BOOKING_URLS: Record<string, string> = {
  AC: "https://www.aircanada.com/ca/en/aco/home/book.html",
  UA: "https://www.united.com/en/us/book-flight",
  AA: "https://www.aa.com/booking/find-flights",
  DL: "https://www.delta.com/flight-search",
  BA: "https://www.britishairways.com/travel/book/public/en_us",
  LH: "https://www.lufthansa.com/us/en/book-a-flight",
  AF: "https://www.airfrance.com/us/en/home/pageRedirected/book-a-flight.html",
  KL: "https://www.klm.com/en/book-a-flight",
  EK: "https://www.emirates.com/us/english/book/",
  QR: "https://www.qatarairways.com/en/book.html",
  SQ: "https://www.singaporeair.com/en_UK/book/book-flights/",
  CX: "https://www.cathaypacific.com/cx/en_US/book.html",
  JL: "https://www.jal.co.jp/en/book/",
  NH: "https://www.ana.co.jp/en/us/book/",
  WN: "https://www.southwest.com/air/booking/",
  B6: "https://www.jetblue.com/booking/flights",
  AS: "https://www.alaskaair.com/planbook",
  F9: "https://www.flyfrontier.com/booking/",
  NK: "https://www.spirit.com/book/flights",
  ZZ: "https://www.google.com/travel/flights",
}

export function getAirlineBookingUrl(iataCode: string): string {
  const code = (iataCode || "").toUpperCase()
  return (
    AIRLINE_BOOKING_URLS[code] ||
    `https://www.google.com/search?q=book+${encodeURIComponent(code)}+airline+flights`
  )
}
