import { appointmentCategory } from "./appointment.category.js";
import { realEstateCategory } from "./realEstate.category.js";
import { crmCategory } from "./crm.category.js";

export const CATEGORY_REGISTRY = {
  appointment: appointmentCategory,
  real_estate: realEstateCategory,
  crm: crmCategory
};
