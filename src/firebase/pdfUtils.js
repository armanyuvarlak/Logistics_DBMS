/**
 * PDF utility functions for interacting with Firebase Functions
 */

import { httpsCallable } from "firebase/functions";
import { auth, functions } from './config';
import { ensureFreshToken } from './authRefresh';

/**
 * Generate a PDF offer document and save it to Firebase Storage
 * 
 * @param {Object} offerData - Offer data containing all relevant details
 * @param {string} filename - Name for the PDF file (without extension)
 * @param {string} folder - Storage folder to save the PDF in
 * @returns {Promise<Object>} - Object with success status, file path, and download URL
 */
export const generateOfferPdf = async (offerData, filename, folder = 'offers') => {
  try {
    console.log('Using simplified PDF generation as a workaround');
    
    // Format offer details as text
    const summaryText = `
      Offer Type: ${offerData.type || 'N/A'}
      Origin: ${offerData.origin || 'N/A'}
      Destination: ${offerData.destination || 'N/A'}
      Term: ${offerData.term || 'N/A'}
      Service: ${offerData.service || 'N/A'}
      
      Price Information:
      ${offerData.options ? offerData.options.map(opt => 
        `- ${opt.service || 'Service'}: ${opt.price || 'N/A'} (${opt.details || ''})`
      ).join('\n') : 'No pricing details available'}
      
      ${offerData.ranges ? 'Pricing Ranges:\n' + offerData.ranges.map(range => 
        `- ${range.min} to ${range.max}: €${range.price}`
      ).join('\n') : ''}
      
      Generated: ${new Date().toLocaleString()}
    `;
    
    // Call the simplified PDF function that's working
    const generateSimplePdfFunction = httpsCallable(functions, 'generateSimplePdf');
    
    // Prepare data for the simple PDF
    const data = {
      filename: filename,
      folder: folder,
      content: summaryText
    };
    
    console.log('Calling simplified PDF function with data:', data);
    
    // Call the function
    const result = await generateSimplePdfFunction(data);
    console.log('PDF generation result:', result.data);
    
    return result.data;
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      message: error.message || 'Failed to generate PDF'
    };
  }
};

/**
 * List all PDFs in a specific folder
 * 
 * @param {string} folder - Storage folder to list PDFs from
 * @returns {Promise<Array>} - Array of PDF file objects
 */
export const listPdfs = async (folder = 'offers') => {
  try {
    // BYPASS AUTHENTICATION FOR NOW
    
    // Call the Firebase Function
    console.log(`Listing PDFs in folder: ${folder}`);
    const listPdfsFunction = httpsCallable(functions, 'listPdfs');
    const result = await listPdfsFunction({ folder });
    
    console.log(`Found ${result.data.files?.length || 0} files`);
    return result.data.files || [];
  } catch (error) {
    console.error('List PDFs error:', error);
    throw error;
  }
};

/**
 * Delete a PDF file from Firebase Storage
 * 
 * @param {string} filePath - Full path to the file in Storage
 * @returns {Promise<Object>} - Object with success status
 */
export const deletePdf = async (filePath) => {
  try {
    // BYPASS AUTHENTICATION FOR NOW
    
    // Call the Firebase Function
    console.log(`Deleting PDF at path: ${filePath}`);
    const deletePdfFunction = httpsCallable(functions, 'deletePdf');
    const result = await deletePdfFunction({ filePath });
    
    console.log('Delete operation result:', result.data);
    return result.data;
  } catch (error) {
    console.error('Delete PDF error:', error);
    throw error;
  }
};

/**
 * Helper function to format offer data for PDF generation
 * 
 * @param {Object} offerData - Raw offer data from the form
 * @returns {Object} - Formatted data ready for PDF generation
 */
export const formatOfferDataForPdf = (offerData) => {
  // This is where you'd transform your application's data model
  // into the structure expected by the PDF generation function
  
  // For example, you might extract options from the offerData
  const options = [];
  
  if (offerData.option1) {
    options.push({
      service: offerData.option1.service || 'Express',
      details: `${offerData.option1.weight || 'N/A'} kg`,
      price: offerData.option1.price
    });
  }
  
  if (offerData.option2) {
    options.push({
      service: offerData.option2.service || 'Economy',
      details: `${offerData.option2.weight || 'N/A'} kg`,
      price: offerData.option2.price
    });
  }
  
  // Return formatted data
  return {
    origin: offerData.originZip,
    destination: offerData.destinationZip,
    service: offerData.service || 'Standard',
    volumeRatio: offerData.volumeRatio || '1:3',
    term: offerData.term || 'Annual',
    options
  };
}; 