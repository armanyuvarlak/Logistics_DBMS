import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Configuration constants
const PDF_CONFIG = {
  format: 'a4',
  unit: 'mm',
  margins: { top: 20, left: 20, right: 20, bottom: 20 },
  lineHeight: 6,
  fontSize: { 
    title: 18, 
    header: 14, 
    normal: 10, 
    small: 8 
  },
  colors: {
    primary: '#1e40af',
    secondary: '#64748b',
    text: '#000000',
    tableHeader: '#f8fafc',
    tableBorder: '#e2e8f0'
  }
};

/**
 * Generate a PDF offer document with structured tables matching the UI
 * @param {number} optionNumber - Option number (1 or 2)
 * @param {Object} offerData - All the offer data needed for the PDF
 * @param {string} clientName - Optional client name to include in PDF and filename
 * @param {string} customFilename - Optional custom filename (without .pdf extension)
 * @returns {Promise<Object>} - PDF data with blob URL for preview and download function
 */
export const generateOfferPDF = async (optionNumber, offerData, clientName = '', customFilename = '') => {
  try {
    if (!offerData) {
      throw new Error('Offer data is required');
    }

    if (!optionNumber) {
      throw new Error('Option number is required');
    }

    // Create PDF document
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: PDF_CONFIG.unit,
      format: PDF_CONFIG.format
    });

    const { margins, fontSize, colors } = PDF_CONFIG;
    let yPosition = margins.top;

    // Title
    doc.setFontSize(fontSize.title);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.primary);
    doc.text(`Logistics Offer - Option ${optionNumber}`, doc.internal.pageSize.width / 2, yPosition, { align: 'center' });

    yPosition += 15;

    // Client information
    if (clientName && clientName !== 'Unnamed Client') {
      doc.setFontSize(fontSize.header);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.text);
      doc.text('Client Information', margins.left, yPosition);
      yPosition += 8;
      
      doc.autoTable({
        startY: yPosition,
        head: [['Field', 'Value']],
        body: [['Client Name', clientName]],
        theme: 'grid',
        headStyles: { fillColor: colors.tableHeader, textColor: colors.text, fontStyle: 'bold' },
        margin: { left: margins.left, right: margins.right },
        styles: { fontSize: fontSize.normal }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }
    
    // Route Information Table
    doc.setFontSize(fontSize.header);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.text);
    doc.text('Route Information', margins.left, yPosition);
    yPosition += 8;

    const routeData = [
      ['Origin', offerData.origin || 'N/A'],
      ['Destination', offerData.destination || 'N/A'],
      ['Service Type', offerData.serviceType || 'N/A'],
      ['Term', offerData.selectedTerm || 'N/A'],
      ['Volume Ratio', offerData.volumeRatio || 'N/A'],
      ['Chargeable Weight', `${offerData.chargeableWeight || 0} kg`]
    ];

    doc.autoTable({
      startY: yPosition,
      head: [['Field', 'Value']],
      body: routeData,
      theme: 'grid',
      headStyles: { 
        fillColor: colors.tableHeader, 
        textColor: colors.text, 
        fontStyle: 'bold',
        fontSize: fontSize.normal
      },
      bodyStyles: { fontSize: fontSize.normal },
      margin: { left: margins.left, right: margins.right },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 60 },
        1: { cellWidth: 100 }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 15;

    // Pricing Breakdown Table
    if (offerData.breakdown) {
      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = margins.top;
      }

      doc.setFontSize(fontSize.header);
      doc.setFont('helvetica', 'bold');
      doc.text('Pricing Breakdown', margins.left, yPosition);
      yPosition += 8;

      const breakdown = offerData.breakdown;
      const breakdownData = [
        ['Line Haul', `€${(breakdown.lanePair?.totalCost || 0).toFixed(2)}`],
        ['Origin Service', `€${(breakdown.origin?.totalCost || 0).toFixed(2)}`],
        ['Destination Service', `€${(breakdown.destination?.totalCost || 0).toFixed(2)}`],
        ['FTL Fee', `€${(offerData.ftlFee || breakdown.lanePair?.ftlFee || 0).toFixed(2)}`]
      ];

      // Calculate total from breakdown.totalCost or sum individual components
      const total = breakdown.totalCost || 
        (breakdown.origin?.totalCost || 0) + 
        (breakdown.destination?.totalCost || 0) + 
        (breakdown.lanePair?.totalCost || 0) + 
        (offerData.ftlFee || breakdown.lanePair?.ftlFee || 0);

      doc.autoTable({
        startY: yPosition,
        head: [['Cost Component', 'Amount']],
        body: breakdownData,
        foot: [['Total Cost', `€${total.toFixed(2)}`]],
        theme: 'grid',
        headStyles: { 
          fillColor: colors.tableHeader, 
          textColor: colors.text, 
          fontStyle: 'bold',
          fontSize: fontSize.normal
        },
        footStyles: { 
          fillColor: colors.primary, 
          textColor: '#ffffff', 
          fontStyle: 'bold',
          fontSize: fontSize.normal
        },
        bodyStyles: { fontSize: fontSize.normal },
        margin: { left: margins.left, right: margins.right },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { cellWidth: 60, halign: 'right' }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 15;
    }

    // Summary Table (if package details are available)
    if (offerData.packageDetails && offerData.packageDetails.length > 0) {
      // Check if we need a new page
      if (yPosition > 220) {
        doc.addPage();
        yPosition = margins.top;
      }

      doc.setFontSize(fontSize.header);
      doc.setFont('helvetica', 'bold');
      doc.text('Package Details', margins.left, yPosition);
      yPosition += 8;

      const packageHeaders = ['Pieces', 'Weight (kg)', 'Length (cm)', 'Width (cm)', 'Height (cm)', 'Stackable'];
      const packageData = offerData.packageDetails.map(pkg => [
        pkg.pieces || 0,
        pkg.grossWeight || pkg.weight || 0,
        pkg.length || 0,
        pkg.width || 0,
        pkg.height || 0,
        // Handle different stackable formats
        typeof pkg.stackable === 'string' ? pkg.stackable : (pkg.stackable ? 'Yes' : 'No')
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [packageHeaders],
        body: packageData,
        theme: 'grid',
        headStyles: { 
          fillColor: colors.tableHeader, 
          textColor: colors.text, 
          fontStyle: 'bold',
          fontSize: fontSize.small
        },
        bodyStyles: { fontSize: fontSize.small, halign: 'center' },
        margin: { left: margins.left, right: margins.right },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 25 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 },
          5: { cellWidth: 25 }
        }
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(fontSize.small);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(colors.secondary);
      
      // Footer text
      doc.text('Generated by Logistics Management System', margins.left, doc.internal.pageSize.height - 15);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margins.left, doc.internal.pageSize.height - 10);
      
      // Page numbers
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - margins.right, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    // Generate PDF blob and URL
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);

    // Return result object with utility functions
    const result = {
      success: true,
      pdfUrl,
      doc, // Expose the document object for custom downloads
      downloadPDF: (overrideFilename = '') => {
        let filename;
        
        if (overrideFilename) {
          // Use provided filename
          filename = overrideFilename;
        } else if (customFilename) {
          // Use custom filename passed to function
          filename = customFilename;
        } else {
          // Generate default filename
          const finalClientName = clientName || 'client';
          filename = `offer-option-${optionNumber}`;
          
          if (finalClientName && finalClientName !== 'Unnamed Client') {
            const sanitizedClientName = finalClientName.replace(/[^a-zA-Z0-9]/g, '_');
            filename = `offer-option-${optionNumber}-${sanitizedClientName}`;
          }
        }
        
        doc.save(`${filename}.pdf`);
      },
      openInNewTab: () => {
        window.open(pdfUrl, '_blank');
      },
      cleanup: () => {
        URL.revokeObjectURL(pdfUrl);
      }
    };
    
    return result;
    
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Failed to generate PDF'
    };
  }
}; 