// components/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-gray-100 py-8 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded"></div>
            <span className="font-semibold text-gray-800">Fusion Chrono</span>
          </div>

          <div className="text-sm text-gray-600">
            © 2025 Fusion Chrono. MEV-resistant cross-chain TWAP swaps.
          </div>

          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#privacy" className="text-gray-600 hover:text-blue-600">Privacy</a>
            <a href="#terms" className="text-gray-600 hover:text-blue-600">Terms</a>
            <a href="https://github.com/your-repo" className="text-gray-600 hover:text-blue-600">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  )
}