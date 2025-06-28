// This is the final script to populate all building images.
// It uses the update logic that we have now proven works correctly.

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// --- Configuration ---
// Make sure these keys are correct.
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6enZobW15d2FheGxqcG1vYWNtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDg4MDg1NiwiZXhwIjoyMDY2NDU2ODU2fQ.it91Xc8ys6PQCJlM18xI7zpNWiBmuc1__Gtv0T6TAZ8'; 
const SUPABASE_URL = 'https://gzzvhmmywaaxljpmoacm.supabase.co';
const GOOGLE_PLACES_API_KEY = 'AIzaSyBDmnOfbxedImsu2U3TRnCYIPErYA_GIWs'; 

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    }
});

/**
 * Main function to run the entire process.
 */
async function run() {
    console.log("--- Starting Image Fetching Process ---");

    // 1. Get the list of all buildings that still need a photo.
    const { data: buildings, error: rpcError } = await supabase
        .rpc('get_buildings_without_photos');

    if (rpcError) {
        console.error("--- FATAL ERROR: Could not fetch buildings from Supabase ---");
        console.error(rpcError.message);
        return;
    }

    if (!buildings || buildings.length === 0) {
        console.log("--- All buildings already have images. Nothing to do. ---");
        return;
    }

    console.log(`Found ${buildings.length} buildings to process...`);

    // 2. Loop through each building and process it.
    for (const building of buildings) {
        try {
            console.log(`Processing: ${building.des_addres}`);

            // First, try to get a curated photo from the Places API
            const findPlaceUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(building.des_addres + " New York, NY")}&inputtype=textquery&fields=photos&key=${GOOGLE_PLACES_API_KEY}`;
            const placeResponse = await fetch(findPlaceUrl);
            const placeData = await placeResponse.json();
            const photoRef = placeData.candidates?.[0]?.photos?.[0]?.photo_reference;

            let photoUrl;
            let photoAttribution;

            if (photoRef) {
                // If we found a curated photo, use it.
                photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${GOOGLE_PLACES_API_KEY}`;
                photoAttribution = placeData.candidates[0].photos[0].html_attributions?.[0] || "Image from Google";
                console.log(` -> Found curated photo.`);
            } else {
                // Otherwise, fall back to getting a Street View image.
                console.log(` -> No curated photo found. Using Street View.`);
                photoUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x600&location=${building.latitude},${building.longitude}&fov=90&heading=235&pitch=10&key=${GOOGLE_PLACES_API_KEY}`;
                photoAttribution = "Image from Google Street View";
            }

            // 3. Update the database for the current building.
            const { error: updateError } = await supabase
                .from('buildings')
                .update({ 
                    photo_url: photoUrl, 
                    photo_attribution: photoAttribution 
                })
                .eq('des_addres', building.des_addres); // Update using the address

            if (updateError) {
                console.error(` -> FAILED to update "${building.des_addres}":`, updateError.message);
            } else {
                console.log(` -> SUCCESS: Updated "${building.des_addres}"`);
            }

        } catch (apiError) {
            console.error(` -> An API error occurred for "${building.des_addres}":`, apiError);
        }
        
        // Wait a moment to avoid overwhelming the APIs.
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log("--- Image fetching process complete. ---");
}

run();
