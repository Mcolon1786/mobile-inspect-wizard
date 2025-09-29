import * as XLSX from 'xlsx';

const statusLabels: Record<string, string> = {
  ok: "OK",
  clean: "Clean",
  not_clean: "Not Clean",
  damaged: "Damaged",
  not_working: "Not Working",
  replenish: "Replenish",
  other: "Other"
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

  // Combine all data
  const allData = [
    ...headerData,
    ...createRestroomSection(formData.mensRestroom, "MEN'S RESTROOM"),
    ...createRestroomSection(formData.womensRestroom, "WOMEN'S RESTROOM"),
    ...createRestroomSection(formData.unisexRestroom1, "UNISEX RESTROOM 1"),
    ...createRestroomSection(formData.unisexRestroom2, "UNISEX RESTROOM 2"),
    ['GENERAL COMMENTS'],
    [formData.generalComments || 'None']
  ];

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
