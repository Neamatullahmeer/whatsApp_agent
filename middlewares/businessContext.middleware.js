export function attachBusinessPhone(req, res, next) {
  const phoneNumberId =
    req.headers["x-phone-number-id"] ||
    req.headers["x-phonenumberid"];

  if (!phoneNumberId) {
    return res.status(400).json({
      success: false,
      message: "x-phone-number-id header missing"
    });
  }

  req.businessPhoneNumberId = phoneNumberId;
  next();
}
