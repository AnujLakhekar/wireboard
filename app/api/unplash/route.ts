import { NextResponse } from "next/server";

// 1. Typos happen: double-check if your .env file says "UNSPLASH" or "UPLASH"
const unsplashApiKey = process.env.UNSPLASH_ACCESS_KEY;
const unsplashApiUrl = "https://api.unsplash.com/photos/random?count=10";

// 2. Opt-out of static caching so you actually get *random* photos on every call
export const dynamic = "force-dynamic";

export async function GET() {
  // 3. Safety first: check if your API key is missing before hitting Unsplash
  if (!unsplashApiKey) {
    return NextResponse.json(
      { error: "Unsplash API key is missing from environment variables." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(unsplashApiUrl, {
      headers: {
        Authorization: `Client-ID ${unsplashApiKey}`,
      },
    });

    // 4. Handle upstream API errors (e.g., rate limits, bad requests)
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch from Unsplash", details: errorData },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    // 5. Handle network errors
    console.error("Unsplash API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  if (!unsplashApiKey) {
    return NextResponse.json(
      { error: "Unsplash API key is missing from environment variables." },
      { status: 500 }
    );
  }

  try {
    // 1. Parse body and fix the 'filters' typo
    const { filters, search } = await request.json();

    // 2. Determine endpoint: Default to random if no search query exists
    let apiUrl = "https://api.unsplash.com/photos/random?count=10";
    
    if (search && search.trim() !== "") {
      const searchParams = new URLSearchParams({
        query: search.trim(),
        per_page: "10",
      });

      // 3. Append optional filters if supported by Unsplash Search API
      // (Unsplash supports 'orientation', 'color', and 'order_by' on search)
      if (filters?.orientation) {
        searchParams.append("orientation", filters.orientation);
      }
      if (filters?.color) {
        searchParams.append("color", filters.color);
      }

      apiUrl = `https://api.unsplash.com/search/photos?${searchParams.toString()}`;
    }

    // 4. Execute request
    const res = await fetch(apiUrl, {
      headers: {
        Authorization: `Client-ID ${unsplashApiKey}`,
      },
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Unsplash API request failed", details: errorData },
        { status: res.status }
      );
    }

    const data = await res.json();

    // 5. Unsplash Search API returns an object format: { total: X, total_pages: Y, results: [...] }
    // We normalize the response data so your frontend receives a clean, consistent array either way.
    const normalizedImages = search ? (data.results || []) : data;

    return NextResponse.json(normalizedImages, { status: 200 });

  } catch (error) {
    console.error("Unsplash POST Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}