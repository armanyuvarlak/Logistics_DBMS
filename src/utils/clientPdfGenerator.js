import { jsPDF } from 'jspdf';

/**
 * Client-side PDF generator using jsPDF
 * This avoids Firebase Functions authentication issues by generating PDFs directly in the browser
 */

/**
 * Generate a single offer PDF document
 * 
 * @param {Object} offerData - Offer data containing offer details
 * @returns {Promise<string>} Base64 string of the PDF
 */
export const generateSingleOfferPdf = (offerData) => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set title
  doc.setFontSize(22);
  doc.text('Shipping Offer', 105, 20, { align: 'center' });
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 195, 10, { align: 'right' });
  
  // Add logo/header
  doc.setFillColor(220, 220, 220);
  doc.rect(10, 30, 190, 10, 'F');
  doc.setFontSize(12);
  doc.setTextColor(40, 40, 40);
  doc.text('Logistics Offer Information', 15, 37);
  
  // Route information
  doc.setFontSize(11);
  doc.text(`Origin: ${offerData.origin || 'N/A'}`, 15, 50);
  doc.text(`Destination: ${offerData.destination || 'N/A'}`, 15, 60);
  
  // Offer details
  doc.setFillColor(240, 240, 240);
  doc.rect(10, 70, 190, 10, 'F');
  doc.setFontSize(12);
  doc.text('Offer Details', 15, 77);
  
  doc.setFontSize(11);
  doc.text(`Service: ${offerData.service || 'N/A'}`, 15, 90);
  doc.text(`Volume Ratio: ${offerData.volumeRatio || 'N/A'}`, 15, 100);
  doc.text(`Term: ${offerData.term || 'N/A'}`, 15, 110);
  
  // Pricing table
  doc.setFillColor(240, 240, 240);
  doc.rect(10, 120, 190, 10, 'F');
  doc.setFontSize(12);
  doc.text('Pricing Information', 15, 127);
  
  // Table headers
  doc.setFillColor(220, 220, 220);
  doc.rect(15, 135, 180, 10, 'F');
  doc.setFontSize(10);
  doc.text('Service', 25, 142);
  doc.text('Details', 75, 142);
  doc.text('Price', 150, 142);
  
  // Add pricing rows
  let yPosition = 152;
  if (offerData.options && offerData.options.length > 0) {
    offerData.options.forEach((option, index) => {
      const isGray = index % 2 === 1;
      if (isGray) {
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPosition - 7, 180, 10, 'F');
      }
      
      doc.text(option.service || 'N/A', 25, yPosition);
      doc.text(option.details || 'N/A', 75, yPosition);
      doc.text(`${option.price || 'N/A'} €`, 150, yPosition);
      
      yPosition += 15;
    });
  } else {
    doc.text('No pricing options available', 25, yPosition);
  }
  
  // FTL value if available
  if (offerData.ftlValue) {
    yPosition += 10;
    doc.setFillColor(220, 220, 220);
    doc.rect(15, yPosition - 7, 180, 10, 'F');
    doc.setFontSize(11);
    doc.text('FTL Value:', 25, yPosition);
    doc.text(`${offerData.ftlValue} €`, 150, yPosition);
  }
  
  // Footer
  doc.setFontSize(10);
  doc.text('This offer is valid for 30 days from the date of generation.', 105, 280, { align: 'center' });
  
  // Save PDF
  return doc.output('dataurlstring');
};

/**
 * Generate a multiple offer PDF document
 * 
 * @param {Object} offerData - Multiple offer data
 * @returns {Promise<string>} Base64 string of the PDF
 */
export const generateMultipleOfferPdf = (offerData) => {
  console.log('Starting client-side PDF generation...');
  try {
    // Create new PDF document
    const doc = new jsPDF();
    console.log('jsPDF instance created');
    
    // Set title
    doc.setFontSize(22);
    doc.text(`${offerData.offerType || 'Multiple'} Offer`, 105, 20, { align: 'center' });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 195, 10, { align: 'right' });
    
    // Add logo/header
    doc.setFillColor(220, 220, 220);
    doc.rect(10, 30, 190, 10, 'F');
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('Multiple Offer Details', 15, 37);
    
    // Route information
    doc.setFontSize(11);
    doc.text(`Origin: ${offerData.origin || 'N/A'}`, 15, 50);
    doc.text(`Destination: ${offerData.destination || 'N/A'}`, 100, 50);
    doc.text(`Service: ${offerData.service || 'N/A'}`, 15, 60);
    doc.text(`Volume Ratio: ${offerData.volumeRatio || 'N/A'}`, 100, 60);
    doc.text(`Term: ${offerData.term || 'N/A'}`, 15, 70);
    
    // Pricing table
    doc.setFillColor(240, 240, 240);
    doc.rect(10, 80, 190, 10, 'F');
    doc.setFontSize(12);
    doc.text('Pricing Ranges', 15, 87);
    
    // Determine column headers based on offer type
    let minHeader = 'Min';
    let maxHeader = 'Max';
    let unit = '';
    
    if (offerData.offerType) {
      console.log(`Processing offer type: ${offerData.offerType}`);
      switch(offerData.offerType.toLowerCase()) {
        case 'weight range':
          minHeader = 'Min Weight';
          maxHeader = 'Max Weight';
          unit = 'kg';
          break;
        case 'ldm amount':
          minHeader = 'Min LDM';
          maxHeader = 'Max LDM';
          unit = 'ldm';
          break;
        case 'cbm amount':
          minHeader = 'Min Volume';
          maxHeader = 'Max Volume';
          unit = 'm³';
          break;
        case 'euro pallet':
        case 'block pallet':
          minHeader = 'Min Pallets';
          maxHeader = 'Max Pallets';
          unit = 'pallets';
          break;
      }
    }
    
    // Table headers
    doc.setFillColor(220, 220, 220);
    doc.rect(15, 95, 180, 10, 'F');
    doc.setFontSize(10);
    doc.text(`${minHeader}`, 25, 102);
    doc.text(`${maxHeader}`, 75, 102);
    doc.text('Price', 150, 102);
    
    // Add pricing rows
    console.log(`Processing ${offerData.ranges?.length || 0} pricing ranges`);
    let yPosition = 112;
    if (offerData.ranges && offerData.ranges.length > 0) {
      offerData.ranges.forEach((range, index) => {
        const isGray = index % 2 === 1;
        if (isGray) {
          doc.setFillColor(245, 245, 245);
          doc.rect(15, yPosition - 7, 180, 10, 'F');
        }
        
        doc.text(`${range.min || '0'} ${unit}`, 25, yPosition);
        doc.text(`${range.max || '0'} ${unit}`, 75, yPosition);
        doc.text(`${range.price || '0'} €`, 150, yPosition);
        
        yPosition += 15;
      });
    } else {
      doc.text('No pricing ranges available', 25, yPosition);
    }
    
    // Footer
    doc.setFontSize(10);
    doc.text('This offer is valid for 30 days from the date of generation.', 105, 280, { align: 'center' });
    
    // Save PDF
    console.log('PDF generation completed successfully');
    return doc.output('dataurlstring');
  } catch (error) {
    console.error('Error during client-side PDF generation:', error);
    throw error;
  }
};

/**
 * Open PDF in a new browser tab
 * 
 * @param {string} dataUrl - Data URL of the PDF
 * @param {string} filename - Filename for download
 */
export const openPdfInNewTab = (dataUrl, filename = 'document.pdf') => {
  console.log(`Opening PDF in new tab: ${filename}`);
  
  try {
    if (!dataUrl) {
      throw new Error('PDF data URL is empty or undefined');
    }
    
    // Check if dataUrl is in the correct format
    if (!dataUrl.startsWith('data:application/pdf')) {
      console.warn('Warning: PDF data URL does not have the expected format');
    }
    
    // Try to open a new window
    const newWindow = window.open();
    if (!newWindow) {
      alert("Please allow popups for this site to view the PDF");
      console.error("Failed to open new window - popup may be blocked");
      return;
    }
    
    // Write the HTML content to display the PDF
    newWindow.document.write(`
      <html>
        <head>
          <title>${filename}</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              height: 100%;
              overflow: hidden;
            }
            
            .container {
              display: flex;
              flex-direction: column;
              height: 100%;
            }
            
            .toolbar {
              background-color: #f1f1f1;
              padding: 10px;
              display: flex;
              justify-content: flex-end;
            }
            
            .download-btn {
              padding: 8px 16px;
              background-color: #4CAF50;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
            
            .download-btn:hover {
              background-color: #45a049;
            }
            
            .pdf-container {
              flex-grow: 1;
            }
            
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="toolbar">
              <button class="download-btn" id="downloadBtn">Download PDF</button>
            </div>
            <div class="pdf-container">
              <iframe src="${dataUrl}"></iframe>
            </div>
          </div>
          <script>
            document.getElementById('downloadBtn').addEventListener('click', function() {
              try {
                const link = document.createElement('a');
                link.href = '${dataUrl}';
                link.download = '${filename}';
                link.click();
                console.log('Download initiated');
              } catch (error) {
                console.error('Error during download:', error);
                alert('Failed to download PDF: ' + error.message);
              }
            });
            
            // Log when the PDF loads or fails
            document.querySelector('iframe').onload = function() {
              console.log('PDF loaded in iframe');
            };
            document.querySelector('iframe').onerror = function(error) {
              console.error('Error loading PDF in iframe', error);
            };
          </script>
        </body>
      </html>
    `);
    
    console.log('PDF successfully opened in new tab');
  } catch (error) {
    console.error('Error opening PDF in new tab:', error);
    alert(`Error viewing PDF: ${error.message}. Please try again.`);
  }
}; 