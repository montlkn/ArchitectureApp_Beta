// This is a minimal script to test one single database update.

import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
// Make sure these keys are correct.
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6enZobW15d2FheGxqcG1vYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg4MDg1NiwiZXhwIjoyMDY2NDU2ODU2fQ.it91Xc8ys6PQCJlM18xI7zpNWiBmuc1__Gtv0T6TAZ8'; 
const SUPABASE_URL = 'https://gzzvhmmywaaxljpmoacm.supabase.co';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

console.log("--- Starting Single Row Update Test ---");

// The address we know we can update from the SQL Editor test.
const testAddress = '169 Westminster Road';
const testUrl = `https://this-is-a-test-from-the-script.com/image.jpg?time=${new Date().getTime()}`;

async function runTest() {
    console.log(`Attempting to update row where des_addres = "${testAddress}"`);

    // --- The Update Command ---
    const { data, error } = await supabase
        .from('buildings')
        .update({ 
            photo_url: testUrl, 
        })
        .eq('des_addres', testAddress)
        .select(); // Ask for the updated row back

    // --- Check the Results ---
    if (error) {
        console.error("--- TEST FAILED: Supabase returned an error ---");
        console.error(error.message);
        return;
    }

    if (data && data.length > 0) {
        console.log("--- TEST SUCCEEDED: The database was updated. ---");
        console.log("Updated row data:", data);
    } else {
        console.warn("--- TEST FAILED: The update command ran but did not update any rows. ---");
        console.warn("This suggests an issue with the Supabase project permissions or an unknown filter preventing the update.");
    }
}

runTest();
