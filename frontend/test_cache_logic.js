// Mock LocalStorage
const store = {};
const localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => store[key] = val,
    removeItem: (key) => delete store[key],
    clear: () => Object.keys(store).forEach(k => delete store[k])
};

// Configuration
const CACHE_PREFIX = 'nikeeta_cache_';
const CACHE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

// Helper to simulate the component logic
function getCachedData(key, now) {
    const cachedItem = localStorage.getItem(CACHE_PREFIX + key);
    if (!cachedItem) return { found: false, reason: 'miss' };
    
    const parsed = JSON.parse(cachedItem);
    const age = now - parsed.timestamp;
    
    if (age < CACHE_RETENTION_MS) {
        return { found: true, data: parsed.data };
    } else {
        localStorage.removeItem(CACHE_PREFIX + key);
        return { found: false, reason: 'expired' };
    }
}

function runTests() {
    console.log("Starting Cache Logic Tests...");
    
    const key = "test_params";
    const data = { foo: "bar" };
    const now = Date.now();
    
    // Test 1: Set Cache
    const payload = { timestamp: now, data };
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(payload));
    console.log("Test 1 (Set Cache): SUCCESS");
    
    // Test 2: Get Valid Cache (Immediate)
    const res1 = getCachedData(key, now + 1000); // 1 second later
    if (res1.found && res1.data.foo === "bar") {
        console.log("Test 2 (Valid Cache 1s): PASS");
    } else {
        console.error("Test 2 (Valid Cache 1s): FAIL", res1);
    }
    
    // Test 3: Get Valid Cache (2 days 23 hours)
    const nearExpiry = now + (CACHE_RETENTION_MS - 1000 * 60 * 60); 
    const res2 = getCachedData(key, nearExpiry);
    if (res2.found) {
        console.log("Test 3 (Valid Cache < 72h): PASS");
    } else {
        console.error("Test 3 (Valid Cache < 72h): FAIL", res2);
    }
    
    // Test 4: Get Expired Cache (3 days + 1 second)
    const expiredTime = now + CACHE_RETENTION_MS + 1000;
    const res3 = getCachedData(key, expiredTime);
    if (!res3.found && res3.reason === 'expired') {
        console.log("Test 4 (Expired Cache > 72h): PASS");
    } else {
        console.error("Test 4 (Expired Cache > 72h): FAIL", res3);
    }
    
    // Test 5: Verify Removal
    const res4 = getCachedData(key, expiredTime);
    if (!res4.found && res4.reason === 'miss') {
        console.log("Test 5 (Cache Cleared): PASS");
    } else {
        console.error("Test 5 (Cache Cleared): FAIL", res4);
    }
}

runTests();