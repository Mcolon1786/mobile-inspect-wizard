import * as XLSX from 'xlsx';

const statusLabels: Record<string, string> = {
  ok: "OK",
  clean: "Clean",
  not_clean: "Not Clean",
  damaged: "Damaged",
  not_working: "Not Working",
  replenish: "Replenish",
  other: "Other",
  na: "N/A"
};

const itemLabels: Record<string, string> = {
  walls_ceilings: "Walls and Ceilings",
  doors: "Doors",
  mirrors_counters: "Mirrors & Counters",
  soap_dispensers: "Soap Dispensers",
  light_fittings: "Light Fittings",
  paper_products: "Paper Products",
  toilets_urinals: "Toilets/Urinals",
  trash_sharps_containers: "Trash/Sharps Containers",
  floor: "Floor"
};

// Define all 35 restroom sections
const restroomSections = [
  { key: "basementMensPSTV", label: "Basement Men's Restroom - PSTV" },
  { key: "basementWomensPSTV", label: "Basement Women's Restroom - PSTV" },
  { key: "basementMensPrintShop", label: "Basement Men's Restroom - Print Shop" },
  { key: "basementWomensPrintShop", label: "Basement Women's Restroom - Print Shop" },
  { key: "groundFloorUnisexPayroll1", label: "Ground Floor Unisex Restroom - Payroll" },
  { key: "groundFloorUnisexPayroll2", label: "Ground Floor Unisex Restroom - Payroll" },
  { key: "groundFloorUnisexWarehouse1", label: "Ground Floor Unisex Restroom - Warehouse" },
  { key: "groundFloorUnisexWarehouse2", label: "Ground Floor Unisex Restroom - Warehouse" },
  { key: "floor1MensPortalA", label: "1st Floor Men's Restroom - Portal A" },
  { key: "floor1WomensPortalA", label: "1st Floor Women's Restroom - Portal A" },
  { key: "floor1MensPortalC", label: "1st Floor Men's Restroom - Portal C" },
  { key: "floor1WomensPortalC", label: "1st Floor Women's Restroom - Portal C" },
  { key: "floor1UnisexPortalB_BOE1", label: "1st Floor Unisex Restroom - Portal B - BOE Suite" },
  { key: "floor1UnisexPortalB_BOE2", label: "1st Floor Unisex Restroom - Portal B - BOE Suite" },
  { key: "floor1MensPortalD", label: "1st Floor Men's Restroom - Portal D" },
  { key: "floor1WomensPortalD", label: "1st Floor Women's Restroom - Portal D" },
  { key: "floor2MensPortalA", label: "2nd Floor Men's Restroom - Portal A" },
  { key: "floor2WomensPortalA", label: "2nd Floor Women's Restroom - Portal A" },
  { key: "floor2MensPortalC", label: "2nd Floor Men's Restroom - Portal C" },
  { key: "floor2WomensPortalC", label: "2nd Floor Women's Restroom - Portal C" },
  { key: "floor2UnisexPortalC_Elevator", label: "2nd Floor Unisex Restroom - Portal C - Near Two-Bank Elevator" },
  { key: "floor2MensPortalD", label: "2nd Floor Men's Restroom - Portal D" },
  { key: "floor2WomensPortalD", label: "2nd Floor Women's Restroom - Portal D" },
  { key: "floor3MensPortalA", label: "3rd Floor Men's Restroom - Portal A" },
  { key: "floor3WomensPortalA", label: "3rd Floor Women's Restroom - Portal A" },
  { key: "floor3MensPortalC", label: "3rd Floor Men's Restroom - Portal C" },
  { key: "floor3WomensPortalC", label: "3rd Floor Women's Restroom - Portal C" },
  { key: "floor3UnisexPortalC_OGC", label: "3rd Floor Unisex Restroom - Portal C - OGC Suite" },
  { key: "floor3UnisexPortalB_Super", label: "3rd Floor Unisex Restroom - Portal B - Superintendent Suite" },
  { key: "floor3MensPortalD", label: "3rd Floor Men's Restroom - Portal D" },
  { key: "floor3WomensPortalD", label: "3rd Floor Women's Restroom - Portal D" },
  { key: "floor4MensBreakArea", label: "4th Floor Men's Restroom - Break Area" },
  { key: "floor4WomensBreakArea", label: "4th Floor Women's Restroom - Break Area" },
  { key: "floor4MensNearNOC", label: "4th Floor Men's Restroom - Near N.O.C." },
  { key: "floor4WomensNearNOC", label: "4th Floor Women's Restroom - Near N.O.C." },
];

export const generateInspectionExcel = (formData: any) => {
  const workbook = XLSX.utils.book_new();

  // Header information
  const headerData = [
    ['USF FACILITIES INC.'],
    ['DAILY RESTROOM INSPECTION'],
    [''],
    ['Inspector Name:', formData.name || ''],
    ['Date:', formData.date || ''],
    ['Time:', formData.time || ''],
    ['Floor:', formData.floor || ''],
    ['']
  ];

  // Function to create restroom section
  const createRestroomSection = (restroomData: any, title: string) => {
    const section = [
      [title],
      ['Inspection Item', 'Status', 'Comments', 'Photo']
    ];

    Object.keys(itemLabels).forEach((key) => {
      const itemData = restroomData?.[key];
      if (itemData) {
        section.push([
          itemLabels[key],
          statusLabels[itemData.status] || itemData.status || '',
          itemData.comments || '',
          itemData.photo ? 'Photo attached' : ''
        ]);
      }
    });

    section.push(['']); // Empty row for spacing
    return section;
  };

  // Combine all data - iterate through all 35 restroom sections
  const allData = [...headerData];
  
  restroomSections.forEach(section => {
    allData.push(...createRestroomSection(formData[section.key], section.label.toUpperCase()));
  });
  
  allData.push(['GENERAL COMMENTS']);
  allData.push([formData.generalComments || 'None']);

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(allData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 30 }, // Inspection Item
    { wch: 15 }, // Status
    { wch: 40 }, // Comments
    { wch: 15 }  // Photo
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inspection Report');

  // Generate filename
  const filename = `Restroom_Inspection_${formData.date || 'report'}_${formData.floor || 'floor'}.xlsx`;

  // Save file
  XLSX.writeFile(workbook, filename);
};
