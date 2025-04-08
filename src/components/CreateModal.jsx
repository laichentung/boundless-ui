import { useState } from "react";

const categories = {
  activity: ["meal", "ride", "performance", "partner", "help"],
  resource: ["space", "parking", "food", "electronics", "clothes", "tools"],
};

export default function CreateModal({ onClose }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState(null);
  const [subtype, setSubtype] = useState(null);
  const [formData, setFormData] = useState({
    time: "",
    location: "",
    price: "",
    description: "",
    photos: [],
  });

  const handleNext = () => {
    if (step === 1 && type) setStep(2);
    if (step === 2 && subtype) setStep(3);
  };

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
      type,
      subtype,
    };
    console.log("Activity created:", activity);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md rounded-xl p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">
            {step === 1 && "Choose Category"}
            {step === 2 && "Choose Type"}
            {step === 3 && "Create Activity"}
          </h2>
          <button onClick={onClose} className="text-sm text-gray-400 hover:text-black">
            ✕
          </button>
        </div>

        {step === 1 && (
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(categories).map((key) => (
              <button
                key={key}
                onClick={() => setType(key)}
                className={`p-3 rounded-lg border text-sm capitalize hover:bg-gray-100 ${
                  type === key ? "border-black" : "border-gray-300"
                }`}
              >
                {key.replace("activity", "service/activity")}
              </button>
            ))}
          </div>
        )}

        {step === 2 && type && (
          <div className="grid grid-cols-2 gap-3">
            {categories[type].map((item) => (
              <button
                key={item}
                onClick={() => setSubtype(item)}
                className={`p-3 rounded-lg border text-sm capitalize hover:bg-gray-100 ${
                  subtype === item ? "border-black" : "border-gray-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {step === 3 && (
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
          </div>
        )}

        <div className="pt-2 flex justify-end">
          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={(step === 1 && !type) || (step === 2 && !subtype)}
              className="bg-black text-white px-4 py-2 rounded-md disabled:opacity-40"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="bg-black text-white px-4 py-2 rounded-md"
            >
              Publish
            </button>
          )}
        </div>
      </div>
    </div>
  );
}