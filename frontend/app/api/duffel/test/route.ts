import { NextResponse } from "next/server";

const DUFFEL_BASE_URL = "https://api.duffel.com";
const DUFFEL_VERSION = "v2";

function getDuffelToken(): string | undefined {
  return process.env.DUFFEL_API_KEY || process.env.DUFFEL;
}

export async function GET(request: Request) {
  const token = getDuffelToken();

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error: "Missing Duffel API key. Set DUFFEL_API_KEY or DUFFEL in env.",
      },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(`${DUFFEL_BASE_URL}/air/airlines?limit=200`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Duffel-Version": DUFFEL_VERSION,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const payload = (await response.json().catch(() => null)) as
      | { data?: Array<{ id?: string; name?: string; iata_code?: string }> }
      | { error?: { message?: string; type?: string } }
      | null;

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: response.status,
          duffelError: payload,
        },
        { status: response.status },
      );
    }

    const airlines = payload && "data" in payload ? (payload.data ?? []) : [];
    const iataCode = new URL(request.url)
      .searchParams.get("iata_code")
      ?.toUpperCase();
    const filteredAirlines = iataCode
      ? airlines.filter(
          (airline) => airline.iata_code?.toUpperCase() === iataCode,
        )
      : airlines;

    return NextResponse.json({
      ok: true,
      duffelVersion: DUFFEL_VERSION,
      count: filteredAirlines.length,
      airlines: filteredAirlines.map((airline) => ({
        id: airline.id,
        name: airline.name,
        iata_code: airline.iata_code,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
