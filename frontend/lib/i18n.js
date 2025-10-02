const en = {
  choose_portal: "Select a portal:",
  admin_login: "Admin Login",
  company_login: "Company Login",
  driver_login: "Driver Login",
  create_shipment: "Create Shipment",
  payments: "Payments",
  wallet: "Wallet",
  settings: "Commission Settings",
  save: "Save"
};
const hi = {
  choose_portal: "कृपया पोर्टल चुनें:",
  admin_login: "एडमिन लॉगिन",
  company_login: "कंपनी लॉगिन",
  driver_login: "ड्राइवर लॉगिन",
  create_shipment: "शिपमेंट बनाएँ",
  payments: "भुगतान",
  wallet: "वॉलेट",
  settings: "कमीशन सेटिंग्स",
  save: "सेव करें"
};
export function t(key, lang='en'){ return (lang==='hi'?hi:en)[key] || key; }
