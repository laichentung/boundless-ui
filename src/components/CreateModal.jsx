import { useState } from "react";

const categories = [
  { type: "activity", label: "Meal" },
  { type: "activity", label: "Ride" },
  { type: "activity", label: "Performance" },
  { type: "activity", label: "Partner" },
  { type: "activity", label: "Help" },
  { type: "resource", label: "Space" },
  { type: "resource", label: "Parking" },
  { type: "resource", label: "Food" },
  { type: "resource", label: "Electronics" },
  { type: "resource", label: "Clothes" },
  { type: "resource", label: "Tools" },
];

export default function CreateModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    time: "",
    location: "",
    price: "",
    description: "",
    photos: [],
  });

  const handleInput = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    setFormData({ ...formData, photos: files });
  };

  const handleSubmit = () => {
    const activity = {
      ...formData,
      ...selected,
    };
    console.log("Activity created:", activity);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-[90%] max-w-md rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {step === 1 && "Choose a Category"}
            {step === 2 && "Activity Details"}
          </h2>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-black">
            ✕
          </button>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {categories.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  setSelected(item);
                  setStep(2);
                }}
                className="p-3 rounded-xl border border-gray-300 hover:border-black hover:bg-gray-50 text-sm capitalize"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <input
              name="time"
              type="text"
              placeholder="Time"
              onChange={handleInput}
              className="w-full border px-3 py-2 rounded-md"
            />
            <input
              name="location"
              type="text"
              placeholder="Location"
              onChange={handleInput}
              className="w-full border px-3 py-2 rounded-md"
            />
            <input
              name="price"
              type="text"
              placeholder="Price"
              onChange={handleInput}
              className="w-full border px-3 py-2 rounded-md"
            />
            <textarea
              name="description"
              placeholder="Description"
              onChange={handleInput}
              className="w-full border px-3 py-2 rounded-md"
            />
            <input
              type="file"
              multiple
              onChange={handlePhotoUpload}
              className="w-full"
            />
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleSubmit}
                className="bg-black text-white px-4 py-2 rounded-md"
              >
                Publish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
