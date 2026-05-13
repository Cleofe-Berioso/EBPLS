import { NextRequest, NextResponse } from "next/server";
import { isWithinEbMagalona } from "@/lib/business-location";

interface NominatimReverseResponse {
  address: {
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    [key: string]: string | undefined;
  };
  lat: string;
  lon: string;
}

/**
 * Reverse geocode coordinates to a readable address using OpenStreetMap Nominatim.
 * Only accepts coordinates within EB Magalona bounds.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latStr = searchParams.get("lat");
    const lngStr = searchParams.get("lng");

    if (!latStr || !lngStr) {
      return NextResponse.json(
        { error: "Missing lat or lng query parameters" },
        { status: 400 }
      );
    }

    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);

    if (
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return NextResponse.json(
        { error: "lat and lng must be valid numbers" },
        { status: 400 }
      );
    }

    // Validate coordinates are within EB Magalona
    if (!isWithinEbMagalona(latitude, longitude)) {
      return NextResponse.json(
        { error: "Selected location must be inside EB Magalona" },
        { status: 400 }
      );
    }

    // Call Nominatim reverse geocoding with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            "User-Agent": "EBPLS-App/1.0",
          },
          signal: controller.signal,
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error("[ReverseGeocode] Nominatim error:", response.status);
        return NextResponse.json(
          { error: "Reverse geocoding service error" },
          { status: 500 }
        );
      }

      const data = (await response.json()) as NominatimReverseResponse;

      // Build address from Nominatim response components
      const addressParts: string[] = [];

      if (data.address?.road) {
        addressParts.push(data.address.road);
      }

      if (data.address?.neighbourhood) {
        addressParts.push(data.address.neighbourhood);
      } else if (data.address?.suburb) {
        addressParts.push(data.address.suburb);
      }

      if (data.address?.city) {
        addressParts.push(data.address.city);
      } else if (data.address?.county) {
        addressParts.push(data.address.county);
      }

      if (data.address?.postcode) {
        addressParts.push(data.address.postcode);
      }

      const address = addressParts.filter((part) => part && part.trim()).join(", ");

      if (!address) {
        console.warn("[ReverseGeocode] No address components extracted");
        return NextResponse.json(
          { error: "Could not extract address from geocode result" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        address,
        latitude,
        longitude,
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (
        fetchError instanceof Error &&
        fetchError.name === "AbortError"
      ) {
        console.warn("[ReverseGeocode] Reverse geocoding timeout");
        return NextResponse.json(
          { error: "Geocoding service timeout" },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("[ReverseGeocode] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
