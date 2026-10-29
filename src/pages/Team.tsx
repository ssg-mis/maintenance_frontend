import React, { useEffect, useState } from "react";
import { Users, Briefcase, Award, Wrench, Plus, X, Trash2, Loader2 } from "lucide-react";
import useAuthStore from "../store/authStore";

interface TeamMember {
  id: string;
  name: string;
  image: string;
  department: string;
  experience: string;
  skills: string[];
}

const TeamReport = () => {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [selectedPeriod, setSelectedPeriod] = useState("month");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const [formData, setFormData] = useState({
    name: "",
    image: "",
    department: "",
    experience: "",
    skills: "",
  });

  const loadTeam = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/team", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const result = await res.json();
      if (result.success && Array.isArray(result.data)) {
        setTeamMembers(
          result.data.map((m: any) => ({
            id: String(m.id),
            name: m.name,
            image: m.image || `https://i.pravatar.cc/150?img=${(Number(m.id) * 7) % 70 + 1}`,
            department: m.department || "Maintenance",
            experience: m.experience || "Not specified",
            skills: Array.isArray(m.skills) ? m.skills : [],
          }))
        );
      }
    } catch (err) {
      console.error("Failed to load team members:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, [token]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setSubmitting(true);
      const skillsArray = formData.skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const res = await fetch("http://localhost:5000/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          image: formData.image.trim() || `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70) + 1}`,
          department: formData.department.trim(),
          experience: formData.experience.trim(),
          skills: skillsArray,
        }),
      });

      const result = await res.json();
      if (!res.ok || !result.success) {
        throw new Error(result.message || "Failed to add team member");
      }

      setFormData({
        name: "",
        image: "",
        department: "",
        experience: "",
        skills: "",
      });
      setIsModalOpen(false);
      await loadTeam();
    } catch (err: any) {
      alert(err.message || "Failed to add team member");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!token) return;
    if (window.confirm(`Are you sure you want to delete ${name}?`)) {
      try {
        const res = await fetch(`http://localhost:5000/api/team/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.message || "Failed to delete team member");
        }
        await loadTeam();
      } catch (err: any) {
        alert(err.message || "Failed to delete team member");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 md:w-8 md:h-8 text-sky-600" />
              <div>
                <h1 className="text-lg md:text-xl font-bold text-gray-900">Maintenance Team Report</h1>
                <p className="text-xs text-gray-500 mt-1">Team members and their expertise</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-lg">
                <Users className="w-5 h-5 text-sky-600" />
                <span className="text-base font-bold text-sky-600">{teamMembers.length}</span>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg transition-colors font-medium"
              >
                <Plus className="w-5 h-5" />
                <span className="hidden sm:inline">Add Member</span>
              </button>
            </div>
          </div>
        </div>

        {/* Team Performance Section */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <Wrench className="w-5 h-5 md:w-6 md:h-6 text-sky-600" />
              <h2 className="text-base md:text-lg font-bold text-gray-900">Team Performance Details</h2>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Team Member
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Work Experience
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Skills
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamMembers.map((member) => {
                  return (
                    <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <img
                            src={member.image}
                            alt={member.name}
                            className="w-12 h-12 rounded-full object-cover border-2 border-sky-100"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{member.name}</p>
                            <p className="text-xs text-gray-500">Maintenance Technician</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4 text-sky-500" />
                          <span className="text-gray-900 font-medium">{member.department}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Award className="w-4 h-4 text-amber-500" />
                          <span className="text-gray-900 font-semibold">{member.experience}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          {member.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete member"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4 p-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="bg-gray-50 rounded-lg p-4 space-y-4 border border-gray-200"
              >
                {/* Member Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-sky-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{member.name}</p>
                      <p className="text-xs text-gray-500">Maintenance Technician</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteMember(member.id, member.name)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete member"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Department */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Briefcase className="w-4 h-4 text-sky-500" />
                    <span className="text-xs text-gray-500 font-medium">Department</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 ml-6">{member.department}</p>
                </div>

                {/* Experience */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-xs text-gray-500 font-medium">Work Experience</span>
                  </div>
                  <p className="text-xs font-semibold text-gray-900 ml-6">{member.experience}</p>
                </div>

                {/* Skills */}
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-700 border border-sky-200"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Member Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Add Team Member</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter full name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Profile Image URL
                  </label>
                  <input
                    type="text"
                    name="image"
                    value={formData.image}
                    onChange={handleInputChange}
                    placeholder="https://example.com/image.jpg (optional)"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for random avatar</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Department *
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Electrical Maintenance"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Work Experience *
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., 5 years"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Skills *
                  </label>
                  <input
                    type="text"
                    name="skills"
                    value={formData.skills}
                    onChange={handleInputChange}
                    required
                    placeholder="Separate skills with commas"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-transparent outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Example: Electrical Systems, PLC Programming, Troubleshooting</p>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                  >
                    Add Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamReport;