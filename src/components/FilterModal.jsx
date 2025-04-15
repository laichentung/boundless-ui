import { useState } from "react";
import { X } from "lucide-react";

const categoryColors = {
  // Activity categories
  "Meal": "#FF6B6B", // Red
  "Ride": "#4ECDC4", // Teal
  "Meet-up": "#FFD166", // Yellow
  "Entertainment": "#06D6A0", // Green
  "Relaxation": "#118AB2", // Blue
  "Learning": "#073B4C", // Dark Blue
  "Help": "#EF476F", // Pink
  // Resource categories
  "Food / Drinks": "#7209B7", // Purple
  "Items": "#F72585", // Magenta
  "Clothing": "#3A0CA3", // Indigo
  "Space": "#4361EE", // Light Blue
  "Parking": "#4CC9F0", // Sky Blue
  // Other
  "Others": "#A0A0A0" // Gray
};

const activityCategories = [
  "Meal", "Ride", "Meet-up", "Entertainment", 
  "Relaxation", "Learning", "Help"
];

const resourceCategories = [
  "Food / Drinks", "Items", "Clothing", "Space", "Parking"
];

const otherCategories = ["Others"];

export default function FilterModal({ onClose, onApply, currentFilters }) {
  // Calculate default time range (past 2 weeks to future 2 weeks)
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 14); // 2 weeks ago
  const defaultEndDate = new Date();
  defaultEndDate.setDate(defaultEndDate.getDate() + 14); // 2 weeks from now

  const [selectedCategories, setSelectedCategories] = useState(
    currentFilters?.categories || [...activityCategories, ...resourceCategories, ...otherCategories]
  );
  const [priceRange, setPriceRange] = useState(currentFilters?.priceRange || [0, 1000]);
  const [distance, setDistance] = useState(currentFilters?.distance || 12);
  const [timeRange, setTimeRange] = useState(currentFilters?.timeRange || {
    start: defaultStartDate.toISOString().split('T')[0],
    end: defaultEndDate.toISOString().split('T')[0]
  });
  const [hasImages, setHasImages] = useState(currentFilters?.hasImages || false);

  const toggleCategory = (category) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleApply = () => {
    onApply({
      categories: selectedCategories,
      priceRange,
      distance,
      timeRange,
      hasImages
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedCategories([...activityCategories, ...resourceCategories, ...otherCategories]);
    setPriceRange([0, 1000]);
    setDistance(12);
    setTimeRange({
      start: defaultStartDate.toISOString().split('T')[0],
      end: defaultEndDate.toISOString().split('T')[0]
    });
    setHasImages(false);
  };

  return (
    <div className="fixed inset-0 z-[1000]">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" 
        onClick={onClose}
      />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[400px] bg-white rounded-2xl shadow-lg max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-black p-2"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-6">
          {/* Categories */}
          <div>
            <h4 className="font-medium mb-2">Categories</h4>
            <div className="space-y-3">
              <div>
                <h5 className="text-sm text-gray-500 mb-2">Activities</h5>
                <div className="flex flex-wrap gap-2">
                  {activityCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategories.includes(category)
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                      style={{
                        backgroundColor: selectedCategories.includes(category)
                          ? categoryColors[category]
                          : '#F3F4F6'
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm text-gray-500 mb-2">Resources</h5>
                <div className="flex flex-wrap gap-2">
                  {resourceCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategories.includes(category)
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                      style={{
                        backgroundColor: selectedCategories.includes(category)
                          ? categoryColors[category]
                          : '#F3F4F6'
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h5 className="text-sm text-gray-500 mb-2">Others</h5>
                <div className="flex flex-wrap gap-2">
                  {otherCategories.map(category => (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        selectedCategories.includes(category)
                          ? 'text-white'
                          : 'text-gray-700'
                      }`}
                      style={{
                        backgroundColor: selectedCategories.includes(category)
                          ? categoryColors[category]
                          : '#F3F4F6'
                      }}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="font-medium mb-2">Price Range</h4>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([parseInt(e.target.value), priceRange[1]])}
                className="w-24 p-2 border rounded"
                min="0"
              />
              <span>to</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-24 p-2 border rounded"
                min="0"
              />
            </div>
          </div>

          {/* Distance */}
          <div>
            <h4 className="font-medium mb-2">Distance (km)</h4>
            <input
              type="range"
              min="1"
              max="50"
              value={distance}
              onChange={(e) => setDistance(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-sm text-gray-500 mt-1">{distance} km</div>
          </div>

          {/* Time Range */}
          <div>
            <h4 className="font-medium mb-2">Time Range</h4>
            <div className="space-y-2">
              <div>
                <label className="text-sm text-gray-500">Start</label>
                <input
                  type="date"
                  value={timeRange.start}
                  onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">End</label>
                <input
                  type="date"
                  value={timeRange.end}
                  onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Has Images */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasImages"
              checked={hasImages}
              onChange={(e) => setHasImages(e.target.checked)}
              className="mr-2"
            />
            <label htmlFor="hasImages" className="text-sm">Only show activities with images</label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-600 hover:text-black"
            >
              Reset
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 bg-black text-white rounded"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 