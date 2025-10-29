/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            animation: {
                // You can change '10s' to make it faster or slower
                ticker: 'ticker 12s linear infinite',
            },
            keyframes: {
                ticker: {
                    /* Start just off-screen to the right
                      (100% of the container's width)
                    */
                    '0%': { transform: 'translateX(500%)' },
                    /* End just off-screen to the left
                      (-100% of the element's *own* width)
                    */
                    '100%': { transform: 'translateX(-100%)' },
                }
            }
        },
    },
    plugins: [],
}