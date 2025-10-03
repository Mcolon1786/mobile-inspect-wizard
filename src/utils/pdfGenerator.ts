import jsPDF from 'jspdf';
import usfLogo from '@/assets/usf-logo.png';

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
      if (itemData.photo instanceof File) {
        imageSrc = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(itemData.photo);
        });
      } else if (typeof itemData.photo === 'string') {
        imageSrc = itemData.photo;
      }
      
      if (imageSrc) {
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

export const generateInspectionPDF = async (formData: any, elementId: string) => {
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    let pageNum = 1;
    
    await addHeader(pdf, pageNum);
    let y = MARGIN + LOGO_HEIGHT + 20;
    
    y = addInspectionDetails(pdf, formData, y);
    
    // Men's Restroom
    let result = await addRestroomSection(pdf, "MEN'S RESTROOM", formData.mensRestroom, y, pageNum);
    y = result.y;
    pageNum = result.page;
    
    // Women's Restroom
    result = await addRestroomSection(pdf, "WOMEN'S RESTROOM", formData.womensRestroom, y, pageNum);
    y = result.y;
    pageNum = result.page;
    
    // Unisex Restroom 1
    result = await addRestroomSection(pdf, "UNISEX RESTROOM 1", formData.unisexRestroom1, y, pageNum);
    y = result.y;
    pageNum = result.page;
    
    // Unisex Restroom 2
    result = await addRestroomSection(pdf, "UNISEX RESTROOM 2", formData.unisexRestroom2, y, pageNum);
    y = result.y;
    pageNum = result.page;
    
    // General Comments
    if (formData.generalComments && formData.generalComments.trim().length > 0) {
      result = checkPageBreak(pdf, y, 20, pageNum);
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