const mongoose = require("mongoose");

const HRAdminSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, default: "hr" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("HRAdmin", HRAdminSchema);
