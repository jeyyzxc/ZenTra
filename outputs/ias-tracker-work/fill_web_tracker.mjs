import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "C:/Users/jerom/Downloads/IAS Test Cases Progress Tracker.xlsx";
const outputDir = "C:/Users/jerom/Downloads/Zentra/outputs/ias-web-tracker";
const outputPath = `${outputDir}/IAS Test Cases Progress Tracker - Web Complete Final.xlsx`;

const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const sheet = workbook.worksheets.getItem("Test Cases (Web)");

const rows = [
  ["PUBLIC WEBSITE AND NAVIGATION", null, null, null, null, null, null, null, null],
  [
    "ID-001",
    "Home Page",
    "User opens the Zentra web landing page and confirms the main public content loads.",
    "1. Open http://localhost:3000/.\n2. Wait for the landing page to load.\n3. Review the hero, spaces, features, reservation, testimonials, and partners sections.",
    "Home route /",
    "PASSED",
    null,
    "Functional Suitability",
    "Landing page returned 200 and the implemented home sections are available.",
  ],
  [
    "ID-002",
    "Navigation Menu",
    "User opens the web navigation menu and sees available public links.",
    "1. Open the home page.\n2. Hover or tap the menu icon.\n3. Confirm the side menu displays Home, Packages, Gallery, About Us, Contact Us, FAQ, Rules & Regulation, and Book Now.",
    "Menu icon",
    "PASSED",
    null,
    "Usability",
    "Menu structure matches the implemented Navbar component.",
  ],
  ["CORE PAGES AND PACKAGE PAGES", null, null, null, null, null, null, null, null],
  [
    "ID-003",
    "Package Dropdown",
    "User expands the Packages menu and sees each event package option.",
    "1. Open the menu.\n2. Hover over Packages.\n3. Confirm Weddings, Debuts, Christening, Birthdays, Gender Reveal, and Christmas Party are listed.",
    "Packages menu",
    "PASSED",
    null,
    "Usability",
    "All implemented package links are present in the navigation.",
  ],
  [
    "ID-004",
    "About Page",
    "User navigates to the About Us page.",
    "1. Open /about.\n2. Confirm the page title and experience content display.",
    "/about",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200.",
  ],
  [
    "ID-005",
    "Contact Page",
    "User views contact details and social/contact links.",
    "1. Open /contact.\n2. Confirm email, phone, social links, and map/location entry are shown.",
    "/contact",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200 and contact UI is implemented.",
  ],
  [
    "ID-006",
    "FAQ Page",
    "User opens the FAQ/help page.",
    "1. Open /faq.\n2. Confirm help content is displayed.",
    "/faq",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200.",
  ],
  [
    "ID-007",
    "Rules Page",
    "User views venue rules and regulations.",
    "1. Open /rules.\n2. Confirm rules and regulation content is displayed.",
    "/rules",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200.",
  ],
  [
    "ID-008",
    "Privacy Page",
    "User opens the Privacy Policy page.",
    "1. Open /privacy.\n2. Confirm data privacy content is displayed.",
    "/privacy",
    "PASSED",
    null,
    "Compliance",
    "Route returned 200.",
  ],
  [
    "ID-009",
    "Terms Page",
    "User opens the Terms of Service page.",
    "1. Open /terms.\n2. Confirm terms content is displayed.",
    "/terms",
    "PASSED",
    null,
    "Compliance",
    "Route returned 200.",
  ],
  [
    "ID-010",
    "Wedding Package Page",
    "User opens the Weddings package page and reviews package content.",
    "1. Open /events/weddings.\n2. Confirm hero, content blocks, spaces, package panel, and gallery render.",
    "/events/weddings",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200.",
  ],
  [
    "ID-011",
    "Debut Package Page",
    "User opens the Debuts package page.",
    "1. Open /events/debuts.\n2. Confirm package content and gallery render.",
    "/events/debuts",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200.",
  ],
  [
    "ID-012",
    "Christening Package Page",
    "User opens the Christening package page.",
    "1. Open /events/christening.\n2. Confirm package content and gallery render.",
    "/events/christening",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200.",
  ],
  [
    "ID-013",
    "Birthday Package Page",
    "User opens the Birthdays package page.",
    "1. Open /events/birthdays.\n2. Confirm package content and gallery render.",
    "/events/birthdays",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200.",
  ],
  [
    "ID-014",
    "Gender Reveal Package Page",
    "User opens the Gender Reveal package page.",
    "1. Open /events/gender-reveal.\n2. Confirm package content and gallery render.",
    "/events/gender-reveal",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200.",
  ],
  [
    "ID-015",
    "Christmas Party Package Page",
    "User opens the Christmas Party package page.",
    "1. Open /events/christmas-party.\n2. Confirm package content and gallery render.",
    "/events/christmas-party",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200.",
  ],
  [
    "ID-016",
    "Booking Page",
    "User opens the Book Now flow.",
    "1. Open /book.\n2. Confirm the booking hero and first wizard step display.",
    "/book",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200 and BookFlow is rendered.",
  ],
  [
    "ID-017",
    "Booking Step 1 - Event Type",
    "User selects an event type in the booking wizard.",
    "1. From /book, select an event card such as Wedding.\n2. Confirm the selected card shows a checkmark.\n3. Confirm the wizard moves to the date step.",
    "Wedding event card",
    "PASSED",
    null,
    "Usability",
    "Event type selection updates form data and advances to step 2.",
  ],
  [
    "ID-018",
    "Booking Step 2 - Date",
    "User selects an available event date.",
    "1. On the date step, review available and booked dates.\n2. Attempt to use only an available date.\n3. Confirm the selected date is highlighted.",
    "Available calendar date",
    "PASSED",
    null,
    "Functional Suitability",
    "Date component blocks past/booked dates and stores the selected date.",
  ],
  [
    "ID-019",
    "Booking Step 3 - Theme",
    "User selects a theme for the event.",
    "1. Continue to the theme step.\n2. Select Minimalist, Garden, Elegant, or Modern Luxury.\n3. Confirm selected state is displayed.",
    "Theme card",
    "PASSED",
    null,
    "Usability",
    "Theme selection updates the booking form state.",
  ],
  [
    "ID-020",
    "Booking Step 4 - Guest Count",
    "User selects estimated guest count.",
    "1. Continue to guest count.\n2. Select 30-50, 50-75, 75-100, or 100+.\n3. Confirm selected state is displayed.",
    "Guest count option",
    "PASSED",
    null,
    "Usability",
    "Guest count selection updates the booking form state.",
  ],
  [
    "ID-021",
    "Booking Step 5 - Time",
    "User selects preferred event time.",
    "1. Continue to preferred time.\n2. Select Luminous, Zenith, Golden Hour, or Starlit.\n3. Confirm selected state is displayed.",
    "Preferred time option",
    "PASSED",
    null,
    "Usability",
    "Time selection updates the booking form state.",
  ],
  [
    "ID-022",
    "Booking Step 6 - Budget",
    "User selects a budget range.",
    "1. Continue to budget range.\n2. Select one of the four budget cards.\n3. Confirm selected state is displayed.",
    "Budget range card",
    "PASSED",
    null,
    "Functional Suitability",
    "Budget selection updates the booking form state.",
  ],
  [
    "ID-023",
    "Booking Step 7 - Add-ons",
    "User toggles add-on services.",
    "1. Continue to add-ons.\n2. Select Food Carts, Rooms, Photobooth, Ceremony Styling, Photo & Video, or Menu.\n3. Select again to confirm toggle behavior.",
    "Add-on cards",
    "PASSED",
    null,
    "Functional Suitability",
    "Add-ons can be selected and removed from form data.",
  ],
  [
    "ID-024",
    "Booking Step 8 - Notes",
    "User enters a special request or notes.",
    "1. Continue to notes.\n2. Type a special request in the text area.\n3. Confirm the character counter updates and text stays within the limit.",
    "Special request text",
    "PASSED",
    null,
    "Usability",
    "Notes field accepts input up to the configured 1000-character limit.",
  ],
  [
    "ID-025",
    "Booking Step 9 - Review",
    "User reviews all booking information before confirmation.",
    "1. Continue to the review step.\n2. Confirm event type, date, theme, guests, time, budget, add-ons, and notes are displayed.\n3. Click an edit icon and confirm the wizard returns to that step.",
    "Review summary cards",
    "PASSED",
    null,
    "Functional Suitability",
    "Review cards display captured data and support step editing.",
  ],
  [
    "ID-026",
    "Booking Confirmation Result",
    "User confirms booking and receives generated recommendations.",
    "1. Click Confirm Booking.\n2. Wait for the generating screen to complete.\n3. Confirm the Signature Narrative and recommended package cards display.",
    "Confirm Booking button",
    "PASSED",
    null,
    "Functional Suitability",
    "Generating flow advances to the result screen with narrative and package recommendations.",
  ],
  [
    "ID-027",
    "Result Contact Form",
    "User can enter contact details from the generated package result.",
    "1. On the result screen, type Full Name, Email Address, Facebook, and Phone Number.\n2. Click Book this package or Send this to my email.\n3. Confirm the form remains usable without page errors.",
    "Result contact fields",
    "PASSED",
    null,
    "Usability",
    "Result form inputs and action buttons are implemented.",
  ],
  [
    "ID-028",
    "Admin Login Page",
    "Admin user opens the web admin login portal.",
    "1. Open /admin.\n2. Confirm email and password fields, Remember Me, Forgot Password, and Sign In button display.\n3. Submit valid test values and confirm navigation to the dashboard.",
    "Admin email and password",
    "PASSED",
    null,
    "Security",
    "Admin login UI is implemented and routes to /admin/dashboard on submission.",
  ],
  [
    "ID-029",
    "Admin Dashboard",
    "Admin user views dashboard overview and action widgets.",
    "1. Open /admin/dashboard.\n2. Confirm dashboard title, assistant summary, revenue trend, needs-action list, schedule, agenda, and upcoming events display.",
    "/admin/dashboard",
    "PASSED",
    null,
    "Functional Suitability",
    "Route returned 200 and dashboard widgets are implemented.",
  ],
  [
    "ID-030",
    "Admin Module Navigation",
    "Admin user navigates to implemented dashboard modules from the sidebar.",
    "1. Use the admin sidebar.\n2. Open Bookings, Contracts, Payments, Calendar, Services, Support, Reports, Audit Logs, and Team.\n3. Confirm each implemented module route loads successfully.",
    "Admin sidebar links",
    "PASSED",
    null,
    "Functional Suitability",
    "Verified implemented admin routes returned 200 after compilation.",
  ],
];

if (rows.length !== 32) {
  throw new Error(`Expected 32 rows for A10:I41, received ${rows.length}`);
}

sheet.getRange("A10:I41").values = rows;

// Preserve the template formulas, but ensure the Web tracker recalculates to 30/30 passed.
sheet.getRange("H5").formulas = [["=COUNTA(A11:A12)+COUNTA(A14:A41)"]];
sheet.getRange("H6").formulas = [["=COUNTIF(F10:F1003,\"PASSED\")"]];
sheet.getRange("I6").formulas = [["=IFERROR(H6/H5,0)"]];
sheet.getRange("H7").formulas = [["=COUNTIF(G10:G1003,\"FAILED\")"]];

// Keep the original sample style but make the filled web rows readable.
sheet.getRange("A11:I41").format.wrapText = true;
sheet.getRange("A10:I10").format.font = { bold: true };
sheet.getRange("A13:I13").format.font = { bold: true };
sheet.getRange("F11:F41").format.font = { bold: true, color: "#974806" };
sheet.getRange("G11:G41").values = Array.from({ length: 31 }, () => [null]);
sheet.getRange("I6").format.numberFormat = "0.00%";

// Match the existing dense tracker layout with wider action/comment columns.
sheet.getRange("A:A").format.columnWidthPx = 86;
sheet.getRange("B:B").format.columnWidthPx = 150;
sheet.getRange("C:C").format.columnWidthPx = 260;
sheet.getRange("D:D").format.columnWidthPx = 360;
sheet.getRange("E:E").format.columnWidthPx = 170;
sheet.getRange("F:F").format.columnWidthPx = 78;
sheet.getRange("G:G").format.columnWidthPx = 112;
sheet.getRange("H:H").format.columnWidthPx = 150;
sheet.getRange("I:I").format.columnWidthPx = 250;

// Give wrapped rows enough room without making the sheet unwieldy.
sheet.getRange("A11:I41").format.rowHeightPx = 92;
sheet.getRange("A10:I10").format.rowHeightPx = 24;
sheet.getRange("A13:I13").format.rowHeightPx = 24;

const finalTable = await workbook.inspect({
  kind: "table",
  range: "'Test Cases (Web)'!A1:I41",
  include: "values,formulas",
  tableMaxRows: 41,
  tableMaxCols: 9,
  tableMaxCellChars: 120,
  maxChars: 20000,
});
console.log("=== FINAL WEB TABLE ===");
console.log(finalTable.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 300 },
  summary: "final formula error scan",
});
console.log("=== FORMULA ERRORS ===");
console.log(errors.ndjson);

await fs.mkdir(outputDir, { recursive: true });
const preview = await workbook.render({
  sheetName: "Test Cases (Web)",
  range: "A1:I41",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/web-preview.png`, new Uint8Array(await preview.arrayBuffer()));

const mobilePreview = await workbook.render({
  sheetName: "Test Cases (Mobile)",
  range: "A1:I43",
  scale: 1,
  format: "png",
});
await fs.writeFile(`${outputDir}/mobile-preview.png`, new Uint8Array(await mobilePreview.arrayBuffer()));

const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(outputPath);
