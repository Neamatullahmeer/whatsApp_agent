import { Business } from "./shared/models/Business.model.js";

const test = async () => {
  const result = await Business.create({
    phoneNumberId: "1234550",
    name: "salesbudge",
    category: "crm",
    services: ["custmer management", "leads generate tool"],
    rules: ["Appointment compulsory"]
  });

  console.log(result);
};

export default test;
