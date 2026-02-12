const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'NikeetaLookup.jsx');
const content = fs.readFileSync(filePath, 'utf8');

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    } else {
        console.log(`✅ PASS: ${message}`);
    }
}

console.log("Starting UI Static Analysis Verification...");

// 1. Verify Buttons
assert(content.includes('Last 3 Days'), 'Contains "Last 3 Days" button');
assert(content.includes('Clear Filter'), 'Contains "Clear Filter" button');

// 2. Verify ARIA Labels
assert(content.includes('aria-label="Filter by last 3 days"'), 'Contains ARIA label for 3 days');
assert(content.includes('aria-label="Clear all filters"'), 'Contains ARIA label for Clear Filter');

// 3. Verify Styling Consistency
// We check for the presence of the class definition string, but handle potential formatting differences by checking key parts
assert(content.includes('const buttonClass = "px-3 py-1 text-xs rounded bg-gray-200 hover:bg-gray-300 text-gray-800 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed";'), 'Defines consistent buttonClass');

// 4. Verify Usage
// Check if className={buttonClass} is used at least 5 times (3 old buttons + 2 new buttons)
const matches = (content.match(/className={buttonClass}/g) || []).length;
assert(matches >= 5, `Uses buttonClass for at least 5 buttons (Found ${matches})`);

console.log("All UI checks passed!");