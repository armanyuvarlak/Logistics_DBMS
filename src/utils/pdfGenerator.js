import jsPDF from 'jspdf';

/**
 * Generate a PDF offer document with the same table structure as shown in the Option tables
 * @param {number} optionNumber - Option number (1 or 2)
 * @param {Object} offerData - All the offer data needed for the PDF
 * @param {string} clientName - Optional client name to include in PDF and filename
 * @returns {Promise<Object>} - PDF data with blob URL for preview and download function
 */
export const generateOfferPDF = async (optionNumber, offerData = {}, clientName = null) => {
  console.log('generateOfferPDF called with option:', optionNumber, 'and data:', offerData);
  try {
    // Create new PDF document
    console.log('Creating jsPDF document...');
    const doc = new jsPDF();
    
    // Add content
    console.log('Adding content to PDF...');
    
    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Shipping Offer - Option ${optionNumber}`, 20, 20);
    
    // Client information
    let yPos = 35;
    const finalClientName = clientName || offerData.clientName;
    if (finalClientName) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Client: ${finalClientName}`, 20, yPos);
      yPos += 10;
    }
    
    // Basic information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    yPos += 5;
    
    // Add basic details
    if (offerData.origin && offerData.destination) {
      const routeText = `Route: ${offerData.origin} -> ${offerData.destination}`;
      doc.text(routeText, 20, yPos);
      yPos += 8;
    }
    
    if (offerData.serviceType) {
      doc.text(`Service: ${offerData.serviceType}`, 20, yPos);
      yPos += 8;
    }
    
    if (offerData.selectedTerm) {
      doc.text(`Term: ${offerData.selectedTerm}`, 20, yPos);
      yPos += 8;
    }
    
    if (offerData.volumeRatio) {
      doc.text(`Volume Ratio: ${offerData.volumeRatio}`, 20, yPos);
      yPos += 8;
    }
    
    if (offerData.chargeableWeight) {
      doc.text(`Chargeable Weight: ${offerData.chargeableWeight} kg`, 20, yPos);
      yPos += 8;
    }
    
    yPos += 10;
    
    // Table header
    doc.setFont('helvetica', 'bold');
    doc.text('Pricing Breakdown:', 20, yPos);
    yPos += 15;
    
    // Table structure similar to the UI
    const tableStartY = yPos;
    const tableWidth = 170;
    const colWidth = tableWidth / 4;
    const rowHeight = 20;
    
    // Table headers
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    
    // Draw complete table border (outer rectangle)
    doc.rect(20, tableStartY, tableWidth, rowHeight * 4); // Complete outer border
    
    // Draw all internal lines
    // Vertical lines (columns)
    doc.line(20 + colWidth, tableStartY, 20 + colWidth, tableStartY + rowHeight * 3); // After Branch (only for first 2 rows)
    doc.line(20 + colWidth * 2, tableStartY, 20 + colWidth * 2, tableStartY + rowHeight * 3); // After Zone (only for first 2 rows)
    doc.line(20 + colWidth * 3, tableStartY, 20 + colWidth * 3, tableStartY + rowHeight * 4); // After Euro in Total (full height)
    
    // Horizontal lines (rows)
    doc.line(20, tableStartY + rowHeight, 20 + tableWidth, tableStartY + rowHeight); // After header
    doc.line(20, tableStartY + rowHeight * 2, 20 + colWidth * 3, tableStartY + rowHeight * 2); // After first row (only first 3 cols)
    doc.line(20, tableStartY + rowHeight * 3, 20 + tableWidth, tableStartY + rowHeight * 3); // Before total row (full width)
    
    // Header text (centered in cells)
    doc.text('Branch', 20 + colWidth/2 - doc.getTextWidth('Branch')/2, tableStartY + rowHeight/2 + 3);
    doc.text('Zone', 20 + colWidth + colWidth/2 - doc.getTextWidth('Zone')/2, tableStartY + rowHeight/2 + 3);
    doc.text('Euro in Total', 20 + colWidth * 2 + colWidth/2 - doc.getTextWidth('Euro in Total')/2, tableStartY + rowHeight/2 + 3);
    doc.text('FTL', 20 + colWidth * 3 + colWidth/2 - doc.getTextWidth('FTL')/2, tableStartY + rowHeight/2 + 3);
    
    // Table data
    doc.setFont('helvetica', 'normal');
    
    // Row 1 - Origin (centered text in cells)
    if (offerData.origin) {
      doc.text(offerData.origin, 20 + colWidth/2 - doc.getTextWidth(offerData.origin)/2, tableStartY + rowHeight + rowHeight/2 + 3);
    }
    
    if (offerData.originZone) {
      doc.text(offerData.originZone, 20 + colWidth + colWidth/2 - doc.getTextWidth(offerData.originZone)/2, tableStartY + rowHeight + rowHeight/2 + 3);
    }
    
    if (offerData.breakdown && offerData.breakdown.origin) {
      const originCost = `€${parseFloat(offerData.breakdown.origin.totalCost || 0).toFixed(2)}`;
      doc.text(originCost, 20 + colWidth * 2 + colWidth/2 - doc.getTextWidth(originCost)/2, tableStartY + rowHeight + rowHeight/2 + 3);
    }
    
    // Row 2 - Destination (centered text in cells)
    if (offerData.destination) {
      doc.text(offerData.destination, 20 + colWidth/2 - doc.getTextWidth(offerData.destination)/2, tableStartY + rowHeight * 2 + rowHeight/2 + 3);
    }
    
    if (offerData.destinationZone) {
      doc.text(offerData.destinationZone, 20 + colWidth + colWidth/2 - doc.getTextWidth(offerData.destinationZone)/2, tableStartY + rowHeight * 2 + rowHeight/2 + 3);
    }
    
    if (offerData.breakdown && offerData.breakdown.destination) {
      const destCost = `€${parseFloat(offerData.breakdown.destination.totalCost || 0).toFixed(2)}`;
      doc.text(destCost, 20 + colWidth * 2 + colWidth/2 - doc.getTextWidth(destCost)/2, tableStartY + rowHeight * 2 + rowHeight/2 + 3);
    }
    
    // Row 3 - Total (Route String spans first two columns)
    doc.setFont('helvetica', 'bold');
    if (offerData.routeString) {
      // Center the route string across the first two columns
      const routeText = offerData.routeString.replace(/\s+/g, ''); // Remove any spaces
      const routeXPos = 20 + colWidth - doc.getTextWidth(routeText)/2;
      doc.text(routeText, routeXPos, tableStartY + rowHeight * 3 + rowHeight/2 + 3);
    }
    
    if (offerData.breakdown && offerData.breakdown.totalCost) {
      const totalCost = `€${parseFloat(offerData.breakdown.totalCost).toFixed(2)}`;
      doc.text(totalCost, 20 + colWidth * 2 + colWidth/2 - doc.getTextWidth(totalCost)/2, tableStartY + rowHeight * 3 + rowHeight/2 + 3);
    }
    
    // FTL Fee (spans all rows in the last column, centered vertically)
    if (offerData.ftlFee !== undefined) {
      doc.setFont('helvetica', 'normal');
      const ftlText = `€${parseFloat(offerData.ftlFee).toFixed(2)}`;
      // Center vertically in the FTL column (middle of the 3 data rows)
      doc.text(ftlText, 20 + colWidth * 3 + colWidth/2 - doc.getTextWidth(ftlText)/2, tableStartY + rowHeight * 2.5 + 3);
    }
    
    // Additional information below table
    yPos = tableStartY + rowHeight * 4 + 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPos);
    
    // Generate blob for preview
    console.log('Generating PDF blob...');
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    console.log('PDF URL created:', pdfUrl);
    
    // Function to download the PDF
    const downloadPDF = () => {
      console.log('Downloading PDF...');
      const finalClientName = clientName || offerData.clientName;
      let filename = `offer-option-${optionNumber}`;
      if (finalClientName && finalClientName !== 'Unnamed Client') {
        // Replace spaces and special characters for filename
        const sanitizedClientName = finalClientName.replace(/[^a-zA-Z0-9]/g, '_');
        filename = `offer-option-${optionNumber}-${sanitizedClientName}`;
      }
      doc.save(`${filename}.pdf`);
    };
    
    // Function to open in new tab
    const openInNewTab = () => {
      console.log('Opening PDF in new tab...');
      window.open(pdfUrl, '_blank');
    };
    
    const result = {
      success: true,
      pdfUrl,
      downloadPDF,
      openInNewTab,
      cleanup: () => {
        console.log('Cleaning up PDF URL...');
        URL.revokeObjectURL(pdfUrl);
      }
    };
    
    console.log('PDF generation completed successfully:', result);
    return result;
    
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 