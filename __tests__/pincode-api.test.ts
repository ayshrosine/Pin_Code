import { GET as getPincodeByCode } from "@/app/api/pincodes/[code]/route";
import { GET as searchByArea } from "@/app/api/pincodes/search/route";
import * as dbModule from "@/lib/db";

// Global fetch mock
const originalFetch = global.fetch;

describe("Pincode Explorer API Routes & Cache-First Logic", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("1. Invalid pincode format (e.g. 3 digits) is rejected with 400 before hitting external API", async () => {
    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;

    const req = new Request("http://localhost:3000/api/pincodes/123");
    const res = await getPincodeByCode(req, { params: { code: "123" } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toContain("Invalid pincode format");
    // Verify external API fetch was NOT called
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("2. Successful live pincode lookup returns correct shape and X-Cache: MISS header", async () => {
    // Mock cache miss
    jest.spyOn(dbModule, "getCachedPincode").mockResolvedValue(null);

    // Mock India Post API response
    const mockPostOfficeResponse = [
      {
        Message: "Number of Post Office(s) found: 1",
        Status: "Success",
        PostOffice: [
          {
            Name: "Koramangala",
            District: "Bangalore",
            State: "Karnataka",
            Pincode: "560034",
            Circle: "Karnataka",
          },
        ],
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockPostOfficeResponse,
    } as unknown as Response);

    const req = new Request("http://localhost:3000/api/pincodes/560034");
    const res = await getPincodeByCode(req, { params: { code: "560034" } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(json.count).toBe(1);
    expect(json.data[0].code).toBe("560034");
    expect(json.data[0].areaName).toBe("Koramangala");
  });

  it("3. External API 'Error' status is converted to a proper 404 response", async () => {
    // Mock cache miss
    jest.spyOn(dbModule, "getCachedPincode").mockResolvedValue(null);

    // Mock India Post API error response
    const mockErrorResponse = [
      {
        Message: "No Post Office found",
        Status: "Error",
        PostOffice: null,
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockErrorResponse,
    } as unknown as Response);

    const req = new Request("http://localhost:3000/api/pincodes/560099");
    const res = await getPincodeByCode(req, { params: { code: "560099" } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBeDefined();
  });

  it("4. Cache-hit path: second call returns cached record without re-fetching external API", async () => {
    const cachedRecord = [
      {
        id: "cache-1",
        code: "560034",
        areaName: "Koramangala",
        district: "Bengaluru Urban",
        state: "Karnataka",
      },
    ];

    // Mock cache HIT
    jest.spyOn(dbModule, "getCachedPincode").mockResolvedValue(cachedRecord);

    const fetchSpy = jest.fn();
    global.fetch = fetchSpy;

    const req = new Request("http://localhost:3000/api/pincodes/560034");
    const res = await getPincodeByCode(req, { params: { code: "560034" } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("HIT");
    expect(json.source).toBe("cache");
    expect(json.data[0].areaName).toBe("Koramangala");
    // Verify external API was bypassed
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("5. Area search route (/api/pincodes/search?area=koramangala) returns valid response", async () => {
    jest.spyOn(dbModule, "getCachedArea").mockResolvedValue(null);

    const mockAreaResponse = [
      {
        Message: "Number of Post Office(s) found: 1",
        Status: "Success",
        PostOffice: [
          {
            Name: "Koramangala",
            District: "Bangalore",
            State: "Karnataka",
            Pincode: "560034",
            Circle: "Karnataka",
          },
        ],
      },
    ];

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => mockAreaResponse,
    } as unknown as Response);

    const req = new Request("http://localhost:3000/api/pincodes/search?area=Koramangala");
    const res = await searchByArea(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data[0].code).toBe("560034");
  });
});
