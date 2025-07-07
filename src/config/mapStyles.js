// =================================================================
// FILE: src/config/mapStyles.js
// =================================================================
import { capitalize } from '../utils/helpers';

export const styleColors = { 'Art Deco': '#00A896', 'Beaux-Arts': '#A4243B', 'Modern': '#033F63', 'Gothic Revival': '#7A306C', 'Neoclassical': '#F4A261', 'Simplified Colonial Revival Or Art Deco': '#2A9D8F', 'Neo-Gothic': '#6A0572', 'French Second Empire': '#E76F51', 'Modified Classical': '#264653', 'Renaissance Revival': '#D81159', 'Romanesque Revival': '#FFBC42' };
const defaultColor = '#95a5a6';
export const getColorForStyle = (style) => styleColors[capitalize(style)] || defaultColor;

export const cleanMapStyle = [ { stylers: [{ saturation: -100 }] }, { featureType: "all", elementType: "labels.icon", stylers: [{ visibility: "off" }] }, { featureType: "poi", elementType: "all", stylers: [{ visibility: "off" }] }, { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] }, { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] }, { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#e3e3e3" }] }, { featureType: "water", elementType: "geometry", stylers: [{ color: "#d5d5d5" }] }, { featureType: "road.local", elementType: "geometry.fill", stylers: [{ color: "#f2f2f2" }] }, { featureType: "landscape", elementType: "geometry.fill", stylers: [{ color: "#f5f5f5" }] }, ];
