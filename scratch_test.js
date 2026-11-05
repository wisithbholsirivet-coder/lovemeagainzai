const fs = require('fs');

function _normalize(str) {
  return (str || '')
    .toLowerCase()
    .replace(/?/g, 'fi').replace(/?/g, 'fl')
    .replace(/[^a-z0-9\s\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

console.log(_normalize('WATER'));
console.log(_normalize('Water (Aqua)'));
