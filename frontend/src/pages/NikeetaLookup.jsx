import axios from "axios";
import { useEffect, useState } from "react";
import DataTable from "../components/DataTable.jsx";
import { API_BASE } from "../config";

// Caching Strategy:
// We use localStorage to persist data for 3 days (72 hours).
// Key format: nikeeta_cache_{JSON_PARAMS}
// Value format: { timestamp: number, data: { data: [], total: number } }
const CACHE_PREFIX = 'nikeeta_cache_';
const CACHE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export default function NikeetaLookup() {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // Filters
  const [dateRange, setDateRange] = useState({
    startDate: "",
    endDate: new Date().toISOString().split('T')[0] // Default to today
  });
  
  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 50;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg(null);
      console.time("NikeetaLoadTime");

      const paramString = JSON.stringify({ 
        start_date: dateRange.startDate || null,
        end_date: dateRange.endDate || null,
        page,
        page_size: pageSize 
      });

      // 1. Try Cache
      try {
          const cacheKey = CACHE_PREFIX + paramString;
          const cachedItem = localStorage.getItem(cacheKey);
          
          if (cachedItem) {
              const parsed = JSON.parse(cachedItem);
              const age = Date.now() - parsed.timestamp;
              
              if (age < CACHE_RETENTION_MS) {
                  console.log(`[NikeetaLookup] Using cached data (Age: ${Math.round(age/1000/60)} mins)`);
                  setData(parsed.data.data);
                  setTotal(parsed.data.total);
                  setLoading(false);
                  console.timeEnd("NikeetaLoadTime");
                  return;
              } else {
                  console.log("[NikeetaLookup] Cache expired, fetching fresh data");
                  localStorage.removeItem(cacheKey);
              }
          }
      } catch (e) {
          console.error("Cache read error:", e);
      }

      // 2. Fetch Network
      try {
        const payload = JSON.parse(paramString);
        
        const res = await axios.post(`${API_BASE}/nikeeta-lookup`, payload);
        const result = { data: res.data.data || [], total: res.data.total || 0 };
        
        // Save to Cache
        try {
            const cacheKey = CACHE_PREFIX + paramString;
            const cachePayload = {
                timestamp: Date.now(),
                data: result
            };
            localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
        } catch (e) {
            console.error("Cache write error (likely quota exceeded):", e);
        }

        setData(result.data);
        setTotal(result.total);
      } catch (err) {
        console.error("Error fetching Nikeeta lookup:", err);
        setErrorMsg(err.message + (err.response ? ` (${err.response.status})` : ""));
      } finally {
        setLoading(false);
        console.timeEnd("NikeetaLoadTime");
      }
    };

    fetchData();
  }, [page, dateRange]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    // Prevent future dates validation could happen here, but HTML input max attribute can also do it
    // For now, we update state.
    setDateRange(prev => ({ ...prev, [name]: value }));
    setPage(1); // Reset to page 1 on filter change
  };

  const setPresetRange = (days) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    
    setDateRange({
      startDate: start.toISOString().split('T')[0],
      endDate: end.toISOString().split('T')[0]
    });
    setPage(1);
  };

  const handleClearFilters = () => {
    setDateRange({
      startDate: "",
      endDate: new Date().toISOString().split('T')[0]
    });
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);
  const today = new Date().toISOString().split('T')[0];
  const buttonClass = "px-3 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-800 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";

  // Preload Next Page Strategy
  useEffect(() => {
    if (loading || page >= totalPages) return;

    const preloadNextPage = async () => {
        const nextPage = page + 1;
        const paramString = JSON.stringify({ 
            start_date: dateRange.startDate || null,
            end_date: dateRange.endDate || null,
            page: nextPage,
            page_size: pageSize 
        });

        const cacheKey = CACHE_PREFIX + paramString;
        if (localStorage.getItem(cacheKey)) return; // Already cached

        try {
            console.log(`[NikeetaLookup] Preloading page ${nextPage}...`);
            const payload = JSON.parse(paramString);
            const res = await axios.post(`${API_BASE}/nikeeta-lookup`, payload);
            const result = { data: res.data.data || [], total: res.data.total || 0 };
            
            const cachePayload = {
                timestamp: Date.now(),
                data: result
            };
            localStorage.setItem(cacheKey, JSON.stringify(cachePayload));
        } catch (e) {
            // Ignore errors in preload
            console.warn("[NikeetaLookup] Preload failed:", e);
        }
    };

    // Delay preloading to avoid contending with main fetch
    const timer = setTimeout(preloadNextPage, 1500);
    return () => clearTimeout(timer);
  }, [loading, page, totalPages, dateRange]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Nikeeta Lookup</h2>
        <div className="flex gap-4 text-sm">
           <span className="text-gray-500">Total: {total}</span>
           <span className="text-gray-500">
             Range: {dateRange.startDate || 'Beginning'} to {dateRange.endDate || 'Now'}
           </span>
        </div>
      </div>

      {/* ERROR MESSAGE */}
      {errorMsg && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Error: {errorMsg}</p>
        </div>
      )}

      {/* FILTERS */}
      <div className="w-full p-6 rounded-xl shadow bg-[var(--card-bg)] border border-[var(--border)] mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--text-muted)]">Start Date</label>
            <input 
              type="date" 
              name="startDate"
              max={today}
              value={dateRange.startDate}
              onChange={handleDateChange}
              className="px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-[var(--text-muted)]">End Date</label>
            <input 
              type="date" 
              name="endDate"
              max={today}
              value={dateRange.endDate}
              onChange={handleDateChange}
              className="px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--border)]"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 pb-1 items-center">
            <button 
                onClick={() => setPresetRange(3)} 
                disabled={loading}
                aria-label="Filter by last 3 days"
                className={buttonClass}
            >
                Last 3 Days
            </button>
            <button 
                onClick={() => setPresetRange(7)} 
                disabled={loading}
                aria-label="Filter by last 7 days"
                className={buttonClass}
            >
                Last 7 Days
            </button>
            <button 
                onClick={() => setPresetRange(30)} 
                disabled={loading}
                aria-label="Filter by last 30 days"
                className={buttonClass}
            >
                Last 30 Days
            </button>
            <button 
                onClick={() => setPresetRange(90)} 
                disabled={loading}
                aria-label="Filter by last 90 days"
                className={buttonClass}
            >
                Last 90 Days
            </button>

            <div className="h-6 w-px bg-[var(--border)] mx-1"></div>

            <button 
                onClick={handleClearFilters}
                disabled={loading}
                aria-label="Clear all filters"
                className={buttonClass}
            >
                Clear Filter
            </button>
          </div>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="flex-1 flex flex-col">
        {loading ? (
          <div className="w-full flex-1 flex justify-center items-center">
            <div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto">
                <DataTable data={data} />
            </div>
            
            {/* PAGINATION */}
            {total > 0 && (
              <div className="flex justify-center items-center gap-4 mt-4 pb-8">
                <button 
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="px-4 py-2 rounded bg-indigo-100 text-indigo-700 disabled:opacity-50 hover:bg-indigo-200 transition"
                >
                  Previous
                </button>
                <span className="text-sm text-[var(--text-main)]">Page {page} of {totalPages || 1}</span>
                <button 
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="px-4 py-2 rounded bg-indigo-100 text-indigo-700 disabled:opacity-50 hover:bg-indigo-200 transition"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}