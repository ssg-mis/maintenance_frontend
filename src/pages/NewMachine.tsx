import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Upload, CalendarPlus, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

const NewMachine = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);

  useEffect(() => {
    if (!id || !token) return;

    fetch(`http://localhost:5000/api/machines/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((result) => {
        if (!result.success) {
          toast.error("Machine data load nahi hua");
          return;
        }

        const machine = result.data;
const setValue = (fieldId, value) => {
  const field = document.getElementById(fieldId);

  if (field) {
    const dateFields = [
      "purchaseDate",
      "warrantyExpiration",
      "initialSchedule",
    ];

    if (dateFields.includes(fieldId) && value) {
      field.value = String(value).slice(0, 10);
    } else {
      field.value = value ?? "";
    }
  }
};

        setValue("name", machine.name);
        setValue("serialNumber", machine.serialNumber);
        setValue("model", machine.model);
        setValue("manufacturer", machine.manufacturer);
        setValue("department", machine.department);
        setValue("location", machine.location);
        setValue("purchaseDate", machine.purchaseDate);
        setValue("purchasePrice", machine.purchasePrice);
        setValue("vendor", machine.vendor);
        setValue("warrantyExpiration", machine.warrantyExpiration);
        setValue("initialSchedule", machine.nextMaintenance);
      })
      .catch((error) => {
        console.error("Machine API error:", error);
        toast.error("Machine data load nahi hua");
      });
  }, [id, token]);
  const [machineImage, setMachineImage] = useState(null);
  const [specifications, setSpecifications] = useState([{ name: '', value: '' }]);
  const [maintenanceParts, setMaintenanceParts] = useState([]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload a valid image file (PNG or JPG)");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be under 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setMachineImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const addSpecification = () => {
    setSpecifications([...specifications, { name: '', value: '' }]);
  };

  const removeSpecification = (index) => {
    const newSpecs = specifications.filter((_, i) => i !== index);
    setSpecifications(newSpecs);
  };

  const addMaintenancePart = () => {
    if (maintenanceParts.length < 5) {
      setMaintenanceParts([...maintenanceParts, '']);
    } else {
      toast.error("Maximum 5 maintenance parts allowed");
    }
  };

  const removeMaintenancePart = (index) => {
    const newParts = maintenanceParts.filter((_, i) => i !== index);
    setMaintenanceParts(newParts);
  };

  const updateMaintenancePart = (index, value) => {
    const newParts = [...maintenanceParts];
    newParts[index] = value;
    setMaintenanceParts(newParts);
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const getValue = (fieldId: string) => {
    const field = document.getElementById(fieldId) as
      | HTMLInputElement
      | HTMLSelectElement
      | null;

    return field?.value ?? "";
  };

  const selectedSchedules: string[] = [];
  ["monthly", "quarterly", "biannual", "annual"].forEach((schedId) => {
    const el = document.getElementById(schedId) as HTMLInputElement | null;
    if (el && el.checked) {
      selectedSchedules.push(schedId);
    }
  });

  const machineData = {
    name: getValue("name"),
    serialNumber: getValue("serialNumber"),
    model: getValue("model"),
    manufacturer: getValue("manufacturer"),
    department: getValue("department"),
    location: getValue("location"),
    status: "operational",
    purchaseDate: getValue("purchaseDate") || null,
    purchasePrice: Number(getValue("purchasePrice") || 0),
    vendor: getValue("vendor"),
    warrantyExpiration: getValue("warrantyExpiration") || null,
    nextMaintenance: getValue("initialSchedule") || null,
    maintenanceSchedule: selectedSchedules,
    maintenanceParts: maintenanceParts.filter((p: string) => Boolean(p && p.trim())),
    image: machineImage || null,
  };

  if (!machineData.name.trim()) {
    toast.error("Machine Name is required");
    return;
  }

  if (!token) {
    toast.error("Please login to save machine");
    return;
  }

  try {
    if (!id) {
      // Create new machine in PostgreSQL database
      const response = await fetch("http://localhost:5000/api/machines", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(machineData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || "Machine creation failed");
        return;
      }

      toast.success("Machine successfully added to inventory");
      navigate("/machines");
    } else {
      // Update existing machine in PostgreSQL database
      const response = await fetch(
        `http://localhost:5000/api/machines/${id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(machineData),
        }
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        toast.error(result.message || "Machine update failed");
        return;
      }

      toast.success("Machine successfully updated");
      navigate("/machines");
    }
  } catch (error: any) {
    console.error("Machine save error:", error);
    toast.error(error?.message || "Failed to save machine");
  }
};

  return (
    <div className="space-y-6 p-4 md:p-0">
      <div className="flex flex-col md:flex-row md:items-center mb-6 space-y-2 md:space-y-0">
        <Link to="/machines" className="text-sky-600 hover:text-sky-900 md:mr-4 flex items-center">
          <ChevronLeft size={20} />
          <span>Back to Machines</span>
        </Link>
    <h1 className="text-xl font-bold text-gray-800">
  {id ? 'Edit Machine' : 'Add New Machine'}
</h1>
      </div>

      <div className="bg-white rounded-lg shadow-lg">
        <div className="p-4 md:p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-6">
                <h2 className="font-medium text-base text-gray-900 border-b pb-2">Machine Information</h2>
                
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-700">
                    Machine Name*
                  </label>
                  <input
                    type="text"
                    id="name"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                    placeholder="e.g., Hydraulic Press HP-102"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="serialNumber" className="block text-xs font-medium text-gray-700">
                    Serial Number*
                  </label>
                  <input
                    type="text"
                    id="serialNumber"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                    placeholder="e.g., HP102-2021-XYZ"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="model" className="block text-xs font-medium text-gray-700">
                    Model
                  </label>
                  <input
                    type="text"
                    id="model"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                    placeholder="e.g., HP-2000 Series"
                  />
                </div>
                
                <div>
                  <label htmlFor="manufacturer" className="block text-xs font-medium text-gray-700">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    id="manufacturer"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                    placeholder="e.g., Industrial Dynamics Ltd."
                  />
                </div>
                
                <div>
                  <label htmlFor="department" className="block text-xs font-medium text-gray-700">
                    Department*
                  </label>
                  <select
                    id="department"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Production">Production</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Quality Control">Quality Control</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="location" className="block text-xs font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                    placeholder="e.g., Building A, Floor 2, Section 3"
                  />
                </div>
              </div>
              
              {/* Right Column */}
              <div className="space-y-6">
                <h2 className="font-medium text-base text-gray-900 border-b pb-2">Purchase & Maintenance Details</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="purchaseDate" className="block text-xs font-medium text-gray-700">
                      Purchase Date*
                    </label>
                    <input
                      type="date"
                      id="purchaseDate"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="purchasePrice" className="block text-xs font-medium text-gray-700">
                      Purchase Price
                    </label>
                    <div className="mt-1 relative rounded-md shadow-lg">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-xs">₹</span>
                      </div>
                      <input
                        type="number"
                        id="purchasePrice"
                        className="pl-7 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="vendor" className="block text-xs font-medium text-gray-700">
                    Vendor
                  </label>
                  <input
                    type="text"
                    id="vendor"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                    placeholder="e.g., Industrial Suppliers Inc."
                  />
                </div>
                
                <div>
                  <label htmlFor="warrantyExpiration" className="block text-xs font-medium text-gray-700">
                    Warranty Expiration
                  </label>
                  <input
                    type="date"
                    id="warrantyExpiration"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Maintenance Schedule
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="monthly" 
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded" 
                      />
                      <label htmlFor="monthly" className="ml-2 block text-xs text-gray-700">Monthly</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="quarterly" 
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded" 
                        defaultChecked
                      />
                      <label htmlFor="quarterly" className="ml-2 block text-xs text-gray-700">Quarterly</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="biannual" 
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded" 
                      />
                      <label htmlFor="biannual" className="ml-2 block text-xs text-gray-700">Bi-annual</label>
                    </div>
                    <div className="flex items-center">
                      <input 
                        type="checkbox" 
                        id="annual" 
                        className="h-4 w-4 text-sky-600 focus:ring-sky-500 border-gray-300 rounded" 
                        defaultChecked
                      />
                      <label htmlFor="annual" className="ml-2 block text-xs text-gray-700">Annual</label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Maintenance Parts ({maintenanceParts.length}/5)
                  </label>
                  <div className="space-y-2">
                    {maintenanceParts.map((part, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder={`Part ${index + 1}`}
                          value={part}
                          onChange={(e) => updateMaintenancePart(index, e.target.value)}
                          className="flex-1 rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                        />
                        <button
                          type="button"
                          onClick={() => removeMaintenancePart(index)}
                          className="p-2 rounded-full hover:bg-red-50 text-red-500"
                        >
                          <Minus size={16} />
                        </button>
                      </div>
                    ))}
                    {maintenanceParts.length < 5 && (
                      <button
                        type="button"
                        onClick={addMaintenancePart}
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-lg text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                      >
                        <Plus size={14} className="mr-1" />
                        Add Part
                      </button>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="initialSchedule" className="block text-xs font-medium text-gray-700">
                    Initial Maintenance Date*
                  </label>
                  <div className="mt-1 flex rounded-md shadow-lg">
                    <input
                      type="date"
                      id="initialSchedule"
                      className="flex-1 block w-full rounded-l-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                      required
                    />
                    <button
                      type="button"
                      className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-xs rounded-r-md hover:bg-gray-100"
                    >
                      <CalendarPlus size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Documentation Section */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="font-medium text-base text-gray-900 mb-4">Documentation</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {/* Machine Image Upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Machine Image
                  </label>
                  <div className="flex flex-col items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    {machineImage ? (
                      <img
                        src={machineImage}
                        alt="Machine Preview"
                        className="w-32 h-32 object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    )}
                    <div className="flex text-xs text-gray-600 justify-center flex-wrap">
                      <label
                        htmlFor="machine-image"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500"
                      >
                        <span>{machineImage ? "Change Image" : "Upload Image"}</span>
                        <input
                          id="machine-image"
                          name="machine-image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1 hidden sm:inline">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                  </div>
                </div>

                {/* User Manual */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    User Manual
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-xs text-gray-600 justify-center flex-wrap">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500"
                        >
                          <span>Upload a file</span>
                          <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                        </label>
                        <p className="pl-1 hidden sm:inline">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Specifications Sheet */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Specifications Sheet
                  </label>
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-xs text-gray-600 justify-center flex-wrap">
                        <label
                          htmlFor="specs-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-sky-600 hover:text-sky-500"
                        >
                          <span>Upload a file</span>
                          <input id="specs-upload" name="specs-upload" type="file" className="sr-only" />
                        </label>
                        <p className="pl-1 hidden sm:inline">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        PDF, DOC, XLS up to 10MB
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Additional Specifications */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="font-medium text-base text-gray-900 mb-4">Additional Specifications</h2>
              <div className="space-y-4">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Specification Name"
                        className="block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                        value={spec.name}
                        onChange={(e) => {
                          const newSpecs = [...specifications];
                          newSpecs[index].name = e.target.value;
                          setSpecifications(newSpecs);
                        }}
                      />
                    </div>
                    <div className="flex-1 w-full">
                      <input
                        type="text"
                        placeholder="Value"
                        className="block w-full rounded-md border-gray-300 shadow-lg focus:border-sky-500 focus:ring-sky-500 sm:text-xs border p-2"
                        value={spec.value}
                        onChange={(e) => {
                          const newSpecs = [...specifications];
                          newSpecs[index].value = e.target.value;
                          setSpecifications(newSpecs);
                        }}
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeSpecification(index)}
                      className="p-2 rounded-full hover:bg-red-50 text-red-500"
                    >
                      <Minus size={20} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSpecification}
                className="mt-2 inline-flex items-center px-3 py-2 border border-gray-300 shadow-lg text-xs leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                <Plus size={16} className="mr-2" />
                Add Specification
              </button>
            </div>
            
            {/* Notes Section */}
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h2 className="font-medium text-base text-gray-900 mb-4">Notes</h2>
              <textarea
                rows={4}
                className="shadow-lg block w-full focus:ring-sky-500 focus:border-sky-500 sm:text-xs border border-gray-300 rounded-md p-2"
                placeholder="Add any additional notes about this machine..."
              ></textarea>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
              <Link
                to="/machines"
                className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-lg text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-lg text-xs font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
              >
                Save Machine
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NewMachine;