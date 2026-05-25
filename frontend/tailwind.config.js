export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#08111f",
        panel: "#102239",
        accent: "#61dafb",
        warn: "#ff6b6b",
        safe: "#4ade80"
      },
      fontFamily: {
        sans: ["Poppins", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 24px rgba(97, 218, 251, 0.25)"
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)"
      }
    }
  },
  plugins: []
};
