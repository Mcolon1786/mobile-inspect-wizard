import jsPDF from 'jspdf';
import usfLogo from '@/assets/usf-logo.png';

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

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const MARGIN = 15;
const COLUMN_GAP = 10;
const LEFT_COLUMN_WIDTH = (PAGE_WIDTH - 2 * MARGIN - COLUMN_GAP) * 0.55;
const RIGHT_COLUMN_WIDTH = (PAGE_WIDTH - 2 * MARGIN - COLUMN_GAP) * 0.45;
const LOGO_HEIGHT = 15;

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
};

const getOrientation = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);
      if (view.getUint16(0, false) !== 0xFFD8) {
        resolve(1); // Not a JPEG
        return;
      }
      const length = view.byteLength;
      let offset = 2;
      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) {
          resolve(1);
          return;
        }
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker === 0xFFE1) {
          if (view.getUint32(offset += 2, false) !== 0x45786966) {
            resolve(1);
            return;
          }
          const little = view.getUint16(offset += 6, false) === 0x4949;
          offset += view.getUint32(offset + 4, little);
          const tags = view.getUint16(offset, little);
          offset += 2;
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + (i * 12), little) === 0x0112) {
              resolve(view.getUint16(offset + (i * 12) + 8, little));
              return;
            }
          }
        } else if ((marker & 0xFF00) !== 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
      resolve(1);
    };
    reader.readAsArrayBuffer(file);
  });
};

const correctImageOrientation = async (imageSrc: string, orientation: number): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve(imageSrc);
        return;
      }
      
      let width = img.width;
      let height = img.height;
      
      // Set canvas size based on orientation
      if (orientation >= 5 && orientation <= 8) {
        canvas.width = height;
        canvas.height = width;
      } else {
        canvas.width = width;
        canvas.height = height;
      }
      
      // Apply transformations based on EXIF orientation
      switch (orientation) {
        case 2:
          ctx.transform(-1, 0, 0, 1, width, 0);
          break;
        case 3:
          ctx.transform(-1, 0, 0, -1, width, height);
          break;
        case 4:
          ctx.transform(1, 0, 0, -1, 0, height);
          break;
        case 5:
          ctx.transform(0, 1, 1, 0, 0, 0);
          break;
        case 6:
          ctx.transform(0, 1, -1, 0, height, 0);
          break;
        case 7:
          ctx.transform(0, -1, -1, 0, height, width);
          break;
        case 8:
          ctx.transform(0, -1, 1, 0, 0, width);
          break;
        default:
          break;
      }
      
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = imageSrc;
  });
};

const addHeader = async (pdf: jsPDF, pageNum: number) => {
  try {
    const logo = await loadImage(usfLogo);
    const logoWidth = LOGO_HEIGHT * (logo.width / logo.height);
    pdf.addImage(logo, 'PNG', MARGIN, MARGIN, logoWidth, LOGO_HEIGHT);
  } catch (error) {
    console.error('Error loading logo:', error);
  }
  
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DAILY RESTROOM INSPECTION', PAGE_WIDTH / 2, MARGIN + LOGO_HEIGHT / 2, { align: 'center' });
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Page ${pageNum}`, PAGE_WIDTH - MARGIN, MARGIN + 5, { align: 'right' });
};

const checkPageBreak = (pdf: jsPDF, currentY: number, requiredSpace: number, pageNum: number): { y: number, page: number } => {
  if (currentY + requiredSpace > PAGE_HEIGHT - MARGIN) {
    pdf.addPage();
    pageNum++;
    addHeader(pdf, pageNum);
    return { y: MARGIN + LOGO_HEIGHT + 15, page: pageNum };
  }
  return { y: currentY, page: pageNum };
};

const addInspectionDetails = (pdf: jsPDF, formData: any, y: number): number => {
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Inspection Details', MARGIN, y);
  y += 7;
  
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(`Inspector: ${formData.name || 'N/A'}`, MARGIN, y);
  pdf.text(`Date: ${formData.date || 'N/A'}`, MARGIN + 70, y);
  y += 5;
  pdf.text(`Time: ${formData.time || 'N/A'}`, MARGIN, y);
  pdf.text(`Floor: ${formData.floor || 'N/A'}`, MARGIN + 70, y);
  y += 10;
  
  return y;
};

const addSectionHeader = (pdf: jsPDF, title: string, y: number): number => {
  pdf.setFillColor(240, 240, 240);
  pdf.rect(MARGIN, y - 5, PAGE_WIDTH - 2 * MARGIN, 8, 'F');
  
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(0, 0, 0);
  pdf.text(title, MARGIN + 2, y);
  
  return y + 8;
};

const addInspectionItem = async (
  pdf: jsPDF,
  label: string,
  itemData: any,
  y: number,
  isEven: boolean,
  pageNum: number
): Promise<{ y: number, page: number }> => {
  const leftColX = MARGIN;
  const rightColX = MARGIN + LEFT_COLUMN_WIDTH + COLUMN_GAP;
  
  // Determine row height based on content
  const hasImage = itemData?.photo instanceof File || (typeof itemData?.photo === 'string' && itemData.photo);
  const hasComments = itemData?.comments && itemData.comments.trim().length > 0;
  const baseHeight = 12;
  const imageHeight = hasImage ? 35 : 0;
  const commentsHeight = hasComments ? Math.ceil(itemData.comments.length / 50) * 5 + 3 : 0;
  const rowHeight = Math.max(baseHeight + commentsHeight, imageHeight + 5);
  
  // Check if we need a page break
  const result = checkPageBreak(pdf, y, rowHeight, pageNum);
  y = result.y;
  pageNum = result.page;
  
  // Alternate row background
  if (isEven) {
    pdf.setFillColor(250, 250, 250);
    pdf.rect(MARGIN, y, PAGE_WIDTH - 2 * MARGIN, rowHeight, 'F');
  }
  
  // Left column - Item details
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.text(label, leftColX + 2, y + 5);
  
  pdf.setFont('helvetica', 'normal');
  const status = itemData?.status ? statusLabels[itemData.status] || itemData.status : 'Not checked';
  pdf.text(`Status: ${status}`, leftColX + 2, y + 10);
  
  if (hasComments) {
    pdf.setFontSize(8);
    const splitComments = pdf.splitTextToSize(itemData.comments, LEFT_COLUMN_WIDTH - 4);
    pdf.text(splitComments, leftColX + 2, y + 14);
  }
  
  // Right column - Image
  if (hasImage) {
    try {
      let imageSrc = '';
      let orientation = 1;
      
      if (itemData.photo instanceof File) {
        // Get orientation from EXIF data
        orientation = await getOrientation(itemData.photo);
        
        imageSrc = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(itemData.photo);
        });
      } else if (typeof itemData.photo === 'string') {
        imageSrc = itemData.photo;
      }
      
      if (imageSrc) {
        // Correct orientation if needed
        if (orientation !== 1) {
          imageSrc = await correctImageOrientation(imageSrc, orientation);
        }
        
        const img = await loadImage(imageSrc);
        const imgAspectRatio = img.width / img.height;
        const maxImgWidth = RIGHT_COLUMN_WIDTH - 4;
        const maxImgHeight = imageHeight - 2;
        
        let imgWidth = maxImgWidth;
        let imgHeight = imgWidth / imgAspectRatio;
        
        if (imgHeight > maxImgHeight) {
          imgHeight = maxImgHeight;
          imgWidth = imgHeight * imgAspectRatio;
        }
        
        pdf.addImage(imageSrc, 'JPEG', rightColX + 2, y + 2, imgWidth, imgHeight);
      }
    } catch (error) {
      console.error('Error adding image to PDF:', error);
      pdf.setFontSize(8);
      pdf.text('Image unavailable', rightColX + 2, y + 5);
    }
  }
  
  return { y: y + rowHeight, page: pageNum };
};

const addRestroomSection = async (
  pdf: jsPDF,
  title: string,
  restroomData: any,
  y: number,
  pageNum: number
): Promise<{ y: number, page: number }> => {
  let result = checkPageBreak(pdf, y, 15, pageNum);
  y = result.y;
  pageNum = result.page;
  
  y = addSectionHeader(pdf, title, y);
  
  let itemIndex = 0;
  for (const [key, value] of Object.entries(itemLabels)) {
    const itemData = restroomData?.[key];
    result = await addInspectionItem(pdf, value as string, itemData, y, itemIndex % 2 === 0, pageNum);
    y = result.y;
    pageNum = result.page;
    itemIndex++;
  }
  
  y += 5;
  return { y, page: pageNum };
};

// Define all 35 restroom sections
const restroomSections = [
  { key: "basementMensPSTV", label: "BASEMENT MEN'S RESTROOM - PSTV" },
  { key: "basementWomensPSTV", label: "BASEMENT WOMEN'S RESTROOM - PSTV" },
  { key: "basementMensPrintShop", label: "BASEMENT MEN'S RESTROOM - PRINT SHOP" },
  { key: "basementWomensPrintShop", label: "BASEMENT WOMEN'S RESTROOM - PRINT SHOP" },
  { key: "groundFloorUnisexPayroll1", label: "GROUND FLOOR UNISEX RESTROOM - PAYROLL" },
  { key: "groundFloorUnisexPayroll2", label: "GROUND FLOOR UNISEX RESTROOM - PAYROLL" },
  { key: "groundFloorUnisexWarehouse1", label: "GROUND FLOOR UNISEX RESTROOM - WAREHOUSE" },
  { key: "groundFloorUnisexWarehouse2", label: "GROUND FLOOR UNISEX RESTROOM - WAREHOUSE" },
  { key: "floor1MensPortalA", label: "1ST FLOOR MEN'S RESTROOM - PORTAL A" },
  { key: "floor1WomensPortalA", label: "1ST FLOOR WOMEN'S RESTROOM - PORTAL A" },
  { key: "floor1MensPortalC", label: "1ST FLOOR MEN'S RESTROOM - PORTAL C" },
  { key: "floor1WomensPortalC", label: "1ST FLOOR WOMEN'S RESTROOM - PORTAL C" },
  { key: "floor1UnisexPortalB_BOE1", label: "1ST FLOOR UNISEX RESTROOM - PORTAL B - BOE SUITE" },
  { key: "floor1UnisexPortalB_BOE2", label: "1ST FLOOR UNISEX RESTROOM - PORTAL B - BOE SUITE" },
  { key: "floor1MensPortalD", label: "1ST FLOOR MEN'S RESTROOM - PORTAL D" },
  { key: "floor1WomensPortalD", label: "1ST FLOOR WOMEN'S RESTROOM - PORTAL D" },
  { key: "floor2MensPortalA", label: "2ND FLOOR MEN'S RESTROOM - PORTAL A" },
  { key: "floor2WomensPortalA", label: "2ND FLOOR WOMEN'S RESTROOM - PORTAL A" },
  { key: "floor2MensPortalC", label: "2ND FLOOR MEN'S RESTROOM - PORTAL C" },
  { key: "floor2WomensPortalC", label: "2ND FLOOR WOMEN'S RESTROOM - PORTAL C" },
  { key: "floor2UnisexPortalC_Elevator", label: "2ND FLOOR UNISEX RESTROOM - PORTAL C - NEAR TWO-BANK ELEVATOR" },
  { key: "floor2MensPortalD", label: "2ND FLOOR MEN'S RESTROOM - PORTAL D" },
  { key: "floor2WomensPortalD", label: "2ND FLOOR WOMEN'S RESTROOM - PORTAL D" },
  { key: "floor3MensPortalA", label: "3RD FLOOR MEN'S RESTROOM - PORTAL A" },
  { key: "floor3WomensPortalA", label: "3RD FLOOR WOMEN'S RESTROOM - PORTAL A" },
  { key: "floor3MensPortalC", label: "3RD FLOOR MEN'S RESTROOM - PORTAL C" },
  { key: "floor3WomensPortalC", label: "3RD FLOOR WOMEN'S RESTROOM - PORTAL C" },
  { key: "floor3UnisexPortalC_OGC", label: "3RD FLOOR UNISEX RESTROOM - PORTAL C - OGC SUITE" },
  { key: "floor3UnisexPortalB_Super", label: "3RD FLOOR UNISEX RESTROOM - PORTAL B - SUPERINTENDENT SUITE" },
  { key: "floor3MensPortalD", label: "3RD FLOOR MEN'S RESTROOM - PORTAL D" },
  { key: "floor3WomensPortalD", label: "3RD FLOOR WOMEN'S RESTROOM - PORTAL D" },
  { key: "floor4MensBreakArea", label: "4TH FLOOR MEN'S RESTROOM - BREAK AREA" },
  { key: "floor4WomensBreakArea", label: "4TH FLOOR WOMEN'S RESTROOM - BREAK AREA" },
  { key: "floor4MensNearNOC", label: "4TH FLOOR MEN'S RESTROOM - NEAR N.O.C." },
  { key: "floor4WomensNearNOC", label: "4TH FLOOR WOMEN'S RESTROOM - NEAR N.O.C." },
];

export const generateInspectionPDF = async (formData: any, elementId: string) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let pageNum = 1;
    
    await addHeader(pdf, pageNum);
    let y = MARGIN + LOGO_HEIGHT + 20;
    
    y = addInspectionDetails(pdf, formData, y);
    
    // Add all 35 restroom sections
    for (const section of restroomSections) {
      const result = await addRestroomSection(pdf, section.label, formData[section.key], y, pageNum);
      y = result.y;
      pageNum = result.page;
    }
    
    // General Comments
    if (formData.generalComments && formData.generalComments.trim().length > 0) {
      const result = checkPageBreak(pdf, y, 20, pageNum);
      y = result.y;
      pageNum = result.page;
      
      y = addSectionHeader(pdf, "GENERAL COMMENTS", y);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const splitComments = pdf.splitTextToSize(formData.generalComments, PAGE_WIDTH - 2 * MARGIN - 4);
      pdf.text(splitComments, MARGIN + 2, y);
    }
    
    const date = formData.date || new Date().toISOString().split('T')[0];
    const inspector = formData.name || 'Inspector';
    const floor = formData.floor || 'Floor';
    const filename = `USF_Restroom_Inspection_${inspector}_${floor}_${date}.pdf`;
    
    pdf.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};