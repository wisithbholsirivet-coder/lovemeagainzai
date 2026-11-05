// Mock static database of ingredients
const ingredientDatabase = [
    {
        name: "AQUA",
        description: "Water. Primarily used as a solvent for ingredients that do not like to dissolve in oils but rather in water.",
        safety: "safe" // safe, warning, danger
    },
    {
        name: "GLYCERIN",
        description: "A natural moisturizer that's also in our skin. A super common, safe, effective and cheap molecule used for more than 50 years.",
        safety: "safe"
    },
    {
        name: "NIACINAMIDE",
        description: "A multi-functional skincare superstar that has clinically proven anti-aging, skin lightening, anti-inflammatory and barrier repair properties.",
        safety: "safe"
    },
    {
        name: "PARABEN",
        description: "Preservative used to prevent the growth of bacteria and fungus. Some concerns over hormonal disruption.",
        safety: "danger"
    },
    {
        name: "FRAGRANCE",
        description: "An undisclosed mixture of various scent chemicals and ingredients. Can be a skin irritant or sensitizer for some.",
        safety: "warning"
    },
    {
        name: "ALCOHOL DENAT",
        description: "A highly volatile alcohol that dries quickly but can be very drying and irritating to the skin barrier.",
        safety: "warning"
    },
    {
        name: "RETINOL",
        description: "Gold standard anti-aging ingredient, but can cause irritation, redness, and peeling, especially for beginners.",
        safety: "warning"
    },
    {
        name: "HYDROQUINONE",
        description: "Skin-lightening agent. Effective but restricted in some countries due to long-term safety concerns (ochronosis).",
        safety: "danger"
    },
    {
        name: "SALICYLIC ACID",
        description: "A well-known BHA that works on the skin's surface and inside the pore to unclog them. Good for acne.",
        safety: "safe"
    },
    {
        name: "METHYLISOTHIAZOLINONE",
        description: "A powerful synthetic biocide and preservative that is known to be a strong allergen and sensitizer.",
        safety: "danger"
    }
];
