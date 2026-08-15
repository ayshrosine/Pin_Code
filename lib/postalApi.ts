export interface PostalOffice {
  Name: string;
  Description?: string | null;
  BranchType?: string;
  DeliveryStatus?: string;
  Circle?: string;
  District: string;
  Division?: string;
  Region?: string;
  State: string;
  Country?: string;
  Pincode: string;
}

export interface PostalApiResponse {
  Message: string;
  Status: "Success" | "Error";
  PostOffice: PostalOffice[] | null;
}

export interface FilteredPincodeRecord {
  pincode: string;
  areaName: string;
  district: string;
  state: string;
}

export type PostalResult =
  | { success: true; data: FilteredPincodeRecord[] }
  | {
      success: false;
      data?: undefined;
      errorStatus: "INVALID_FORMAT" | "NOT_FOUND" | "SERVICE_UNAVAILABLE";
      errorMessage: string;
    };

const TIMEOUT_MS = 6000;

async function fetchWithTimeout(url: string, timeoutMs: number = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}

export function filterBangaloreOffices(offices: PostalOffice[] | null): FilteredPincodeRecord[] {
  if (!offices || !Array.isArray(offices)) return [];

  return offices
    .filter((office) => {
      const districtLower = (office.District || "").toLowerCase();
      const stateLower = (office.State || "").toLowerCase();
      const circleLower = (office.Circle || "").toLowerCase();
      const nameLower = (office.Name || "").toLowerCase();

      const isKarnataka = stateLower.includes("karnataka") || circleLower.includes("karnataka");
      const isBangalore =
        districtLower.includes("bangalore") ||
        districtLower.includes("bengaluru") ||
        nameLower.includes("bangalore") ||
        nameLower.includes("bengaluru") ||
        circleLower.includes("bangalore");

      return isKarnataka && (isBangalore || districtLower.length === 0);
    })
    .map((office) => ({
      pincode: office.Pincode,
      areaName: office.Name,
      district: office.District || "Bengaluru Urban",
      state: office.State || "Karnataka",
    }));
}

export async function fetchPincodeFromIndiaPost(code: string): Promise<PostalResult> {
  if (!code || !/^\d{6}$/.test(code)) {
    return {
      success: false,
      errorStatus: "INVALID_FORMAT",
      errorMessage: "Invalid pincode format. Must be a 6-digit numeric string.",
    };
  }

  const url = `https://api.postalpincode.in/pincode/${code}`;

  try {
    const res = await fetchWithTimeout(url);

    if (!res.ok) {
      return {
        success: false,
        errorStatus: "SERVICE_UNAVAILABLE",
        errorMessage: "India Post service temporarily unavailable. Please try again later.",
      };
    }

    const json = (await res.json()) as PostalApiResponse[];

    if (!Array.isArray(json) || json.length === 0) {
      return {
        success: false,
        errorStatus: "NOT_FOUND",
        errorMessage: `Pincode '${code}' not found.`,
      };
    }

    const payload = json[0];

    if (payload.Status === "Error" || !payload.PostOffice || payload.PostOffice.length === 0) {
      return {
        success: false,
        errorStatus: "NOT_FOUND",
        errorMessage: payload.Message || `No post offices found for pincode '${code}'.`,
      };
    }

    const filtered = filterBangaloreOffices(payload.PostOffice);

    if (filtered.length === 0) {
      return {
        success: false,
        errorStatus: "NOT_FOUND",
        errorMessage: `No Bangalore area matches found for pincode '${code}'.`,
      };
    }

    return {
      success: true,
      data: filtered,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        errorStatus: "SERVICE_UNAVAILABLE",
        errorMessage: "India Post API request timed out. Please try again.",
      };
    }

    return {
      success: false,
      errorStatus: "SERVICE_UNAVAILABLE",
      errorMessage: "Service temporarily unavailable, please try again.",
    };
  }
}

export async function fetchAreaFromIndiaPost(areaName: string): Promise<PostalResult> {
  const cleanArea = areaName.trim();

  if (!cleanArea) {
    return {
      success: false,
      errorStatus: "INVALID_FORMAT",
      errorMessage: "Search area name cannot be empty.",
    };
  }

  const url = `https://api.postalpincode.in/postoffice/${encodeURIComponent(cleanArea)}`;

  try {
    const res = await fetchWithTimeout(url);

    if (!res.ok) {
      return {
        success: false,
        errorStatus: "SERVICE_UNAVAILABLE",
        errorMessage: "India Post service temporarily unavailable. Please try again later.",
      };
    }

    const json = (await res.json()) as PostalApiResponse[];

    if (!Array.isArray(json) || json.length === 0) {
      return {
        success: false,
        errorStatus: "NOT_FOUND",
        errorMessage: `No post offices found for area '${cleanArea}'.`,
      };
    }

    const payload = json[0];

    if (payload.Status === "Error" || !payload.PostOffice || payload.PostOffice.length === 0) {
      return {
        success: false,
        errorStatus: "NOT_FOUND",
        errorMessage: payload.Message || `No post offices found matching '${cleanArea}'.`,
      };
    }

    const filtered = filterBangaloreOffices(payload.PostOffice);

    if (filtered.length === 0) {
      return {
        success: false,
        errorStatus: "NOT_FOUND",
        errorMessage: `No Bangalore post office matches found for '${cleanArea}'.`,
      };
    }

    return {
      success: true,
      data: filtered,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      return {
        success: false,
        errorStatus: "SERVICE_UNAVAILABLE",
        errorMessage: "India Post API request timed out. Please try again.",
      };
    }

    return {
      success: false,
      errorStatus: "SERVICE_UNAVAILABLE",
      errorMessage: "Service temporarily unavailable, please try again.",
    };
  }
}
