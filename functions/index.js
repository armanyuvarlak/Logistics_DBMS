/**
 * Cloud Functions for generating and storing PDFs
 */

const functions = require("firebase-functions/v2");
const admin = require("firebase-admin");
const PDFDocument = require("pdfkit");
const logger = require("firebase-functions/logger");
const simplifiedPdf = require("./simplified-pdf");

// Initialize Firebase Admin SDK - no need for explicit credentials in GCP environment
admin.initializeApp();

// Log startup information
logger.info('Firebase Admin SDK initialized', {
  projectId: process.env.GCLOUD_PROJECT,
  nodeMajorVersion: process.versions.node.split('.')[0]
});

// Export the simplified PDF generator function
exports.generateSimplePdf = simplifiedPdf.generateSimplePdf;

/**
 * Generates a logistics offer PDF and stores it in Firebase Storage
 * 
 * Required request data:
 * - offerData: Object containing offer details
 * - filename: String name for the file (without .pdf extension)
 * - folder: String storage folder path
 */
exports.generateOfferPdf = functions.https.onCall(async (data, context) => {
  // Log raw context for debugging
  console.log('Function called with context:', {
    auth: context.auth ? 'Authenticated' : 'Not authenticated',
    uid: context.auth ? context.auth.uid : 'No UID'
  });
  
  // Get data from the request
  const { offerData, filename, folder = 'offers' } = data;
  
  // Temporarily allow non-authenticated access for testing (REMOVE IN PRODUCTION)
  const allowNonAuthenticatedForTesting = true;
  
  // Enhanced authentication check with fallback
  if (!context.auth && !allowNonAuthenticatedForTesting) {
    console.error('Unauthenticated function call rejected');
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  try {
    logger.info('Starting PDF generation with offer data:', {
      filename: filename,
      folder: folder,
      offerType: offerData && offerData.type
    });
    
    logger.info('Auth context:', {
      auth: context.auth ? 'present' : 'missing',
      uid: context.auth ? context.auth.uid : 'none',
      token: context.auth && context.auth.token ? 'present' : 'missing',
      authenticated: !!context.auth
    });
    
    // Log detailed auth info for debugging
    if (context.auth) {
      const email = context.auth.token && context.auth.token.email ? context.auth.token.email : 'no email in token';
      const emailVerified = context.auth.token && context.auth.token.email_verified;
      const provider = context.auth.token && context.auth.token.firebase && context.auth.token.firebase.sign_in_provider;
      
      logger.info('Authentication successful. User details:', {
        uid: context.auth.uid,
        email: email,
        emailVerified: emailVerified,
        provider: provider
      });
    } else {
      logger.info('No authentication context available, proceeding with anonymous access');
    }

    // Check required parameters
    if (!offerData || !filename || !folder) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required parameters: offerData, filename, or folder"
      );
    }

    // Create a PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Create a readable stream from the PDF document
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    
    // Build the PDF content
    buildPdfContent(doc, offerData);
    
    // Finalize the PDF
    doc.end();
    
    // Wait for PDF generation to complete
    const pdfBuffer = await new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (err) => {
        reject(err);
      });
    });
    
    // Define the file path in Storage
    const filePath = `${folder}/${filename}.pdf`;
    logger.info(`PDF generated, uploading to: ${filePath}`);
    
    try {
      // Upload to Firebase Storage
      const file = admin.storage().bucket().file(filePath);
      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
          metadata: {
            createdBy: context.auth ? context.auth.uid : 'anonymous-user',
            createdAt: new Date().toISOString()
          }
        }
      });
      
      logger.info('PDF uploaded successfully, getting signed URL');
      
      // Get the download URL
      const downloadUrl = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Long expiration for demo purposes
      });
      
      logger.info('Operation completed successfully');
      
      // Return success with file info
      return {
        success: true,
        filePath,
        downloadUrl: downloadUrl[0],
        message: 'PDF generated and stored successfully'
      };
    } catch (storageError) {
      logger.error('Storage error:', storageError);
      throw new functions.https.HttpsError(
        'internal',
        `Storage error: ${storageError.message}`
      );
    }
  } catch (error) {
    logger.error('PDF generation error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to generate PDF: ${error.message}`
    );
  }
});

/**
 * List all PDFs in a specified folder
 */
exports.listPdfs = functions.https.onCall(async (data, context) => {
  try {
    // Temporarily allow non-authenticated access for testing (REMOVE IN PRODUCTION)
    const allowNonAuthenticatedForTesting = true;
    
    // Enhanced authentication check with fallback
    if (!context.auth && !allowNonAuthenticatedForTesting) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    
    // Check required parameters
    if (!data.folder) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required parameter: folder"
      );
    }
    
    // List files in the specified folder
    const [files] = await admin.storage().bucket().getFiles({
      prefix: data.folder
    });
    
    // Process file information
    const fileList = await Promise.all(files.map(async (file) => {
      const [metadata] = await file.getMetadata();
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: '03-01-2500' // Long expiration for demo purposes
      });
      
      return {
        name: file.name,
        url,
        contentType: metadata.contentType,
        size: metadata.size,
        updated: metadata.updated,
        customMetadata: metadata.metadata || {}
      };
    }));
    
    return { files: fileList };
    
  } catch (error) {
    logger.error('List PDFs error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to list PDFs: ${error.message}`
    );
  }
});

/**
 * Delete a PDF file from Storage
 */
exports.deletePdf = functions.https.onCall(async (data, context) => {
  try {
    // Temporarily allow non-authenticated access for testing (REMOVE IN PRODUCTION)
    const allowNonAuthenticatedForTesting = true;
    
    // Enhanced authentication check with fallback
    if (!context.auth && !allowNonAuthenticatedForTesting) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }
    
    // Check required parameters
    if (!data.filePath) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required parameter: filePath"
      );
    }
    
    // Delete the file
    await admin.storage().bucket().file(data.filePath).delete();
    
    return { 
      success: true,
      message: 'File deleted successfully'
    };
    
  } catch (error) {
    logger.error('Delete PDF error:', error);
    throw new functions.https.HttpsError(
      'internal',
      `Failed to delete PDF: ${error.message}`
    );
  }
});

/**
 * Helper function to build PDF content
 */
function buildPdfContent(doc, offerData) {
  // Add document title
  doc
    .fontSize(25)
    .text(`Logistics Offer - Option ${offerData.option || ''}`, 50, 50, { align: 'center' })
    .moveDown(1);
  
  // Add offer details section
  doc
    .fontSize(14)
    .text('Offer Details', { underline: true })
    .moveDown(0.5);
  
  // Add offer information
  const detailsTable = {
    'Origin': offerData.origin || 'N/A',
    'Destination': offerData.destination || 'N/A',
    'Service Type': offerData.service || 'N/A',
    'Volume Ratio': offerData.volumeRatio || 'N/A',
    'Term': offerData.termValue || offerData.term || 'N/A',
    'Date Created': new Date().toLocaleDateString()
  };
  
  // Add details to PDF
  let yPosition = doc.y;
  Object.entries(detailsTable).forEach(([key, value]) => {
    doc
      .fontSize(12)
      .text(`${key}: `, 50, yPosition, { continued: true, bold: true })
      .text(`${value}`, { bold: false })
      .moveDown(0.5);
    yPosition = doc.y;
  });
  
  doc.moveDown(1);
  
  // Add chargeable weight if it exists (for quick calculation)
  if (offerData.chargeableWeight) {
    doc
      .fontSize(14)
      .text('Chargeable Weight', { underline: true })
      .moveDown(0.5)
      .fontSize(12)
      .text(`Total: ${offerData.chargeableWeight} kg`)
      .moveDown(1);
  }
  
  // Add FTL value if it exists
  if (offerData.ftlValue) {
    doc
      .fontSize(14)
      .text('FTL Value', { underline: true })
      .moveDown(0.5)
      .fontSize(12)
      .text(`${offerData.ftlValue}`)
      .moveDown(1);
  }
  
  // Add service rows if available (specific for single offers)
  if (offerData.serviceRows && offerData.serviceRows.length > 0) {
    doc
      .fontSize(14)
      .text('Service Pricing', { underline: true })
      .moveDown(0.5);
    
    // Draw service rows table
    drawServiceRowsTable(doc, offerData.serviceRows);
    doc.moveDown(1);
  }
  
  // Add options section if available
  if (offerData.options && offerData.options.length > 0) {
    doc
      .fontSize(14)
      .text('Transport Options', { underline: true })
      .moveDown(0.5);
    
    // Draw options table header
    drawOptionsTable(doc, offerData.options);
  }
  
  // Add footer
  const pageCount = doc.bufferedPageRange().count;
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i);
    
    // Footer text
    doc
      .fontSize(10)
      .text(
        'Logistics Offer Generator - Powered by Transcon Management System',
        50,
        doc.page.height - 50,
        { align: 'center', width: doc.page.width - 100 }
      );
    
    // Page number
    doc
      .fontSize(10)
      .text(
        `Page ${i + 1} of ${pageCount}`,
        50,
        doc.page.height - 35,
        { align: 'center', width: doc.page.width - 100 }
      );
  }
}

/**
 * Helper function to draw service rows table
 */
function drawServiceRowsTable(doc, serviceRows) {
  const tableTop = doc.y + 10;
  const tableLeft = 50;
  const colWidth = (doc.page.width - 100) / 4;
  
  // Draw table header
  doc
    .fontSize(12)
    .text('Zone', tableLeft, tableTop, { width: colWidth, align: 'center' })
    .text('Term', tableLeft + colWidth, tableTop, { width: colWidth, align: 'center' })
    .text('Service', tableLeft + colWidth * 2, tableTop, { width: colWidth, align: 'center' })
    .text('Price', tableLeft + colWidth * 3, tableTop, { width: colWidth, align: 'center' });
  
  // Draw header line
  doc
    .moveTo(tableLeft, tableTop + 20)
    .lineTo(tableLeft + colWidth * 4, tableTop + 20)
    .stroke();
  
  // Draw service rows
  let rowTop = tableTop + 30;
  serviceRows.forEach((row, index) => {
    doc
      .fontSize(11)
      .text(row.zone || `${index + 1}`, tableLeft, rowTop, { width: colWidth, align: 'center' })
      .text(row.term || 'N/A', tableLeft + colWidth, rowTop, { width: colWidth, align: 'center' })
      .text(row.service || 'N/A', tableLeft + colWidth * 2, rowTop, { width: colWidth, align: 'center' })
      .text(row.price || 'N/A', tableLeft + colWidth * 3, rowTop, { width: colWidth, align: 'center' });
    
    rowTop += 30;
    
    // Draw row separator line
    doc
      .moveTo(tableLeft, rowTop - 10)
      .lineTo(tableLeft + colWidth * 4, rowTop - 10)
      .stroke();
  });
}

/**
 * Helper function to draw options table
 */
function drawOptionsTable(doc, options) {
  const tableTop = doc.y + 10;
  const tableLeft = 50;
  const colWidth = (doc.page.width - 100) / 4;
  
  // Draw table header
  doc
    .fontSize(12)
    .text('Option', tableLeft, tableTop, { width: colWidth, align: 'center' })
    .text('Service', tableLeft + colWidth, tableTop, { width: colWidth, align: 'center' })
    .text('Details', tableLeft + colWidth * 2, tableTop, { width: colWidth, align: 'center' })
    .text('Price', tableLeft + colWidth * 3, tableTop, { width: colWidth, align: 'center' });
  
  // Draw header line
  doc
    .moveTo(tableLeft, tableTop + 20)
    .lineTo(tableLeft + colWidth * 4, tableTop + 20)
    .stroke();
  
  // Draw options
  let rowTop = tableTop + 30;
  options.forEach((option, index) => {
    doc
      .fontSize(11)
      .text(`Option ${index + 1}`, tableLeft, rowTop, { width: colWidth, align: 'center' })
      .text(option.service || 'N/A', tableLeft + colWidth, rowTop, { width: colWidth, align: 'center' })
      .text(option.details || 'N/A', tableLeft + colWidth * 2, rowTop, { width: colWidth, align: 'center' })
      .text(option.price ? `${option.price} €` : 'N/A', tableLeft + colWidth * 3, rowTop, { width: colWidth, align: 'center' });
    
    rowTop += 30;
    
    // Draw row separator line
    doc
      .moveTo(tableLeft, rowTop - 10)
      .lineTo(tableLeft + colWidth * 4, rowTop - 10)
      .stroke();
  });
} 