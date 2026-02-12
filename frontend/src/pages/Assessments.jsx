import axios from "axios";
import { useEffect, useState } from "react";
import Filters from "../components/Filters.jsx";
import DataTable from "../components/DataTable.jsx";
import { API_BASE } from "../config";

export default function Assessments() {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState({});
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);

  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    console.log('Assessments component mounted');
    const fetchAssessments = async () => {
      try {
        console.log('Fetching assessments from:', `${API_BASE}/assessments`);
        const res = await axios.get(`${API_BASE}/assessments`);
        console.log('Response status:', res.status);
        console.log('Response data length:', res.data?.length);
        const rows = res.data || [];
        setData(rows);
        setErrorMsg(null);

        const options = {};
        rows.forEach((row) => {
          Object.keys(row).forEach((key) => {
            if (!options[key]) options[key] = new Set();
            options[key].add(row[key]);
          });
        });
        Object.keys(options).forEach((key) => {
          options[key] = Array.from(options[key]);
        });
        setFilterOptions(options);
      } catch (err) {
        console.error("Error fetching assessments:", err);
        console.error("Error details:", err.response?.data, err.response?.status);
        setErrorMsg(err.message + (err.response ? ` (${err.response.status})` : ""));
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  const applyFilters = async () => {
    try {
      const res = await axios.post(`${API_BASE}/filter-assessments`, {
        filters,
      });
      setData(res.data || []);
    } catch (err) {
      console.error("Error filtering assessments:", err);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <h2 className="text-2xl font-semibold text-center mb-8">Assessments</h2>
      
      {/* DEBUG INFO */}
      <div className="bg-gray-100 p-4 mb-4 rounded text-xs font-mono overflow-auto max-h-40 border border-gray-300">
        <p><strong>Debug Info:</strong></p>
        <p>API Base: {API_BASE}</p>
        <p>Loading: {loading.toString()}</p>
        <p>Data Length: {data.length}</p>
        <p>Error: {errorMsg || "None"}</p>
        {data.length > 0 && (
           <details>
             <summary>First Record Sample</summary>
             <pre>{JSON.stringify(data[0], null, 2)}</pre>
           </details>
        )}
      </div>

      <div className="w-full mb-8">
        <Filters
          filters={filters}
          setFilters={setFilters}
          filterOptions={filterOptions}
        />
      </div>

      <div className="flex justify-center mb-8">
        <button
          onClick={applyFilters}
          className="px-6 py-2 rounded-xl bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 transition shadow active:scale-95"
        >
          Apply Filters
        </button>
      </div>

      <div className="flex-1 flex">
        {loading ? (
          <div className="w-full flex-1 flex justify-center items-center">
            <div className="animate-spin h-12 w-12 rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          </div>
        ) : (
          <DataTable data={data} />
        )}
      </div>
    </div>
  );
}
