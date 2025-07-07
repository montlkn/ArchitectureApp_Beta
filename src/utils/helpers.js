// =================================================================
// FILE: src/utils/helpers.js
// =================================================================
export const capitalize = (str) => {
    if (!str || str === '0') return '';
    return str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
};