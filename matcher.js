// Levenshtein distance implementation
function levenshtein(a, b) {
    const matrix = [];

    // Increment along the first column of each row
    let i;
    for (i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }

    // Increment each column in the first row
    let j;
    for (j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                                        Math.min(matrix[i][j - 1] + 1, // insertion
                                                 matrix[i - 1][j] + 1)); // deletion
            }
        }
    }

    return matrix[b.length][a.length];
}

function findMatchingIngredients(inputStr) {
    // Split input by comma or newline and clean up
    // This allows users to paste multiple ingredients separated by comma or new lines
    const tokens = inputStr.split(/[\n,]/).map(t => t.trim().toUpperCase()).filter(t => t.length > 0);
    
    const matchedResults = [];
    const matchedNames = new Set(); // To prevent duplicates

    tokens.forEach(token => {
        let bestMatch = null;
        let minDistance = Infinity;

        ingredientDatabase.forEach(dbItem => {
            const dbName = dbItem.name.toUpperCase();
            
            // Allow 1 typo for words <= 5 chars, 2 typos for > 5 chars
            const maxAllowedDistance = dbName.length <= 5 ? 1 : 2;
            
            const distance = levenshtein(token, dbName);
            
            if (distance <= maxAllowedDistance && distance < minDistance) {
                minDistance = distance;
                bestMatch = dbItem;
            }
        });

        // Silent Dropping: Only add to results if a valid match was found and not already added
        if (bestMatch && !matchedNames.has(bestMatch.name)) {
            matchedResults.push(bestMatch);
            matchedNames.add(bestMatch.name);
        }
    });

    return matchedResults;
}
