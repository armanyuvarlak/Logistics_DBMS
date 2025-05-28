import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import ResultsSection from '../components/ResultsSection';
import SummarySection from '../components/SummarySection';

const ResultsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Get data from location state
  const data = location.state || { rows: [] };
  
  const handleBack = () => {
    // Check the calculation type and navigate to the appropriate page
    if (data.calculationType === 'multiple') {
      navigate('/offer/multiple-offer');
    } else {
      navigate('/offer/single-offer');
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
          onClick={handleBack}
        >
          Back to Calculator
        </button>
      </div>
      
      <div className="card">
        <div className="card-body">
          {data.calculationId && (
            <div className="mb-4 text-sm text-gray-600">
              Calculation ID: {data.calculationId}
              <br />
              Date: {new Date(data.timestamp).toLocaleString()}
            </div>
          )}
          <ResultsSection data={data} />
          <SummarySection data={data} />
        </div>
      </div>
    </div>
  );
};

export default ResultsPage; 