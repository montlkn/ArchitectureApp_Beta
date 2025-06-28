// This is the final, paginated script to process all 37,000+ rows
// and export them to a single, complete photos.csv file.

import fetch from 'node-fetch';
import { createObjectCsvWriter } from 'csv-writer';
import { createClient } from '@supabase/supabase-js';

// --- Configuration ---
// Make sure these keys are correct.
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6enZobW15d2FheGxqcG1vYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg4MDg1NiwiZXhwIjoyMDY2NDU2ODU2fQ.it91Xc8ys6PQCJlM18xI7zpNWiBmuc1__Gtv0T6TAZ8'; 
const SUPABASE_URL = 'https://gzzvhmmywaaxljpmoacm.supabase.co';
const GOOGLE_PLACES_API_KEY = 'AIzaSyBDmnOfbxedImsu2U3TRnCYIPErYA_GIWs';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Setup for the CSV file
const csvWriter = createObjectCsvWriter({
  path: './photos.csv',
  header: [
    { id: 'des_addres', title: 'des_addres' },
    { id: 'photo_url', title: 'photo_url' },
    { id: 'photo_attribution', title: 'photo_attribution' },
  ],
});

async function run() {
    console.log("--- Starting Full Image URL Export Process ---");

    let allRecords = [];
    let pageNumber = 1;
    const pageSize = 1000; // Process 1000 records per page
    let keepFetching = true;

    while (keepFetching) {
        console.log(`\nFetching page ${pageNumber}...`);

        const { data: buildings, error: rpcError } = await supabase
            .rpc('get_buildings_page', { page_size: pageSize, page_number: pageNumber });

        if (rpcError) {
            console.error("--- FATAL ERROR: Could not fetch buildings from Supabase ---");
            console.error(rpcError.message);
            keepFetching = false;
            break;
        }

        if (!buildings || buildings.length === 0) {
            console.log("No more buildings to process.");
            keepFetching = false;
            break;
        }

        console.log(`Found ${buildings.length} buildings on this page. Processing...`);

        for (const building of buildings) {
            try {
                const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(building.des_addres + " New York, NY")}&inputtype=textquery&fields=photos&key=${GOOGLE_PLACES_API_KEY}`;
                const placeResponse = await fetch(findPlaceUrl);
                const placeData = await placeResponse.json();
                const photoRef = placeData.candidates?.[0]?.photos?.[0]?.photo_reference;

                let photoUrl;
                let photoAttribution;

                if (photoRef) {
                    photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;
                    photoAttribution = placeData.candidates[0].photos[0].html_attributions?.[0] || "Image from Google";
                } else {
                    photoUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${building.latitude},${building.longitude}&fov=90&heading=235&pitch=10&key=${GOOGLE_PLACES_API_KEY}`;
                    photoAttribution = "Image from Google Street View";
                }

                allRecords.push({
                    des_addres: building.des_addres,
                    photo_url: photoUrl,
                    photo_attribution: photoAttribution,
                });

            } catch (apiError) {
                console.error(` -> An API error occurred for "${building.des_addres}":`, apiError);
            }
            
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        pageNumber++; // Go to the next page
    }

    if (allRecords.length > 0) {
        await csvWriter.writeRecords(allRecords);
        console.log(`\n--- Process Complete ---`);
        console.log(`Successfully created photos.csv with ${allRecords.length} records.`);
        console.log(`Next step: Upload this file to your 'buildings' table in Supabase.`);
    } else {
        console.log("No records were processed.");
    }
}

// Before running, make sure you have installed csv-writer:
// npm install csv-writer
run();
